// All HTTP routes mounted on the Hono app.
//
// Post-migration: instead of `bun:sqlite` queries, this file uses the
// `supabaseAdmin()` client and the helpers in `db.ts`. Auth is delegated
// to Supabase Auth (browser SDK issues the access token; we validate it
// with `auth.getUser`).
//
// The route surface is unchanged from the previous SQLite version, so the
// React frontend doesn't need a single line of code change beyond
// swapping the email/password form for a Supabase `signInWithPassword`
// call (which the frontend skill will do separately).

import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import {
  HTTPError,
  adminCreateUser,
  adminDeleteUser,
  clearSessionCookie,
  isSecureFromContext,
  readSessionAsync,
  requireAdmin,
  requireUser,
  setSessionCookie,
  type SessionPayload,
} from "./auth";
import { supabaseAdmin, isSupabaseConfigured } from "./supabase";
import { callZo } from "./zo-api";
import {
  createCheckoutSession,
  isStripeConfigured,
  retrieveCheckoutSession,
  verifyStripeSignature,
  createCartCheckoutSession,
  StripeError,
} from "./stripe";
import {
  syncHikeToStripe,
  removeHikeFromStripe,
  syncEquipmentToStripe,
  removeEquipmentFromStripe,
} from "./stripe-sync";
import { sendContactEmail } from "./email";
import {
  getInboxSummary,
  listInboxMessages,
  setMessageSeen,
  getInboxMessage,
} from "./imap";
import {
  bookedUnitsForRange,
  bookedUnitsMap,
  listAllEquipment,
  listAllHikes,
  listEquipmentBookingsForUser,
  listRecentBookings,
  listRecentContactMessages,
  loadHikeById,
  loadHikeByIdFull,
  loadEquipmentById,
  loadEquipmentBookingById,
  loadProfileById,
  loadProfileByEmail,
  presentHike,
  presentEquipment,
  presentEquipmentReservation,
  presentUser,
  bookingToJson,
  deleteHike,
  deleteEquipment,
  deleteHikeBookingsForUser,
  deleteEquipmentBookingsForUser,
  deleteContactMessagesForUser,
  insertHikeBooking,
  insertEquipmentBooking,
  listHikeBookingsForUser,
  listHikeBookingsForUserWithHike,
  loadHikeBookingById,
  updateHikeBooking,
  updateEquipmentBooking,
  updateHike,
  updateEquipment,
  upsertHike,
  patchHike,
  upsertEquipment,
  patchEquipment,
  adminCounts,
  touchProfileAdmin,
  contactMessageInsert,
  equipmentTypeCounts,
  decrementHikeSpots,
  listAllProfiles,
  listAllContactMessages,
  deleteContactMessagesOlderThan,
  type HikeRow,
  type EquipmentRow,
  type EquipmentPatch,
  type EquipmentReservationRow,
  type ProfileRow,
} from "./db";

// ---------- helpers ----------

function nextId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return `${prefix}_${t}${rand}`;
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    case "image/avif": return "avif";
    default: return "bin";
  }
}

function handleError(err: unknown): Response {
  if (err instanceof HTTPError) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (err instanceof z.ZodError) {
    return new Response(JSON.stringify({ error: "Invalid input", details: err.issues }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (err instanceof StripeError) {
    let detail = err.message;
    try {
      const parsed = JSON.parse(err.message);
      detail = parsed.error?.message ?? err.message;
    } catch {}
    return new Response(JSON.stringify({ error: `Stripe: ${detail}` }), {
      status: err.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  // eslint-disable-next-line no-console
  console.error("[api] unhandled error", err);
  return new Response(JSON.stringify({ error: "Server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Eventbrite — publishes/updates/unpublishes a hike on Eventbrite via the
// publish-to-eventbrite Supabase Edge Function.
// ---------------------------------------------------------------------------

function eventbriteFunctionUrl(): string | null {
  const url = process.env.SUPABASE_URL;
  if (!url) return null;
  return `${url.replace(/\/$/, "")}/functions/v1/publish-to-eventbrite`;
}

function eventbriteServiceKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

async function callEventbriteEdgeFunction(
  opts: {
    action: string;
    eventbriteEventId?: string;
    hike?: Record<string, unknown>;
    skip_image?: boolean;
  },
): Promise<{ ok: boolean; eventbriteEventId?: string; error?: string }> {
  const url = eventbriteFunctionUrl();
  const key = eventbriteServiceKey();

  if (!url || !key) {
    return { ok: false, error: "Eventbrite function URL or service key not configured" };
  }

  const body: Record<string, unknown> = {
    action: opts.action,
    hike: opts.hike,
    eventbriteEventId: opts.eventbriteEventId,
  };
  if (opts.skip_image) {
    body.skip_image = true;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
    const resBody = await res.json() as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, error: (resBody.error as string) ?? `HTTP ${res.status}` };
    }
    return {
      ok: true,
      eventbriteEventId: resBody.eventbriteEventId as string | undefined,
      error: resBody.error as string | undefined,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function publishHikeToEventbrite(
  hike: { id: string; title: string; location: string; region: string; date: string; duration: string; difficulty: string; summary: string; description: string; price_pence: number; image: string; guide: string; spotsTotal: number },
  existingEventbriteId?: string | null,
  skipImage?: boolean,
): Promise<{ ok: boolean; eventbriteEventId?: string; error?: string }> {
  const action = existingEventbriteId ? "update" : "publish";
  return callEventbriteEdgeFunction({
    action,
    eventbriteEventId: existingEventbriteId || undefined,
    skip_image: skipImage,
    hike: {
      id: hike.id,
      title: hike.title,
      location: hike.location,
      region: hike.region,
      date: hike.date,
      duration: hike.duration,
      difficulty: hike.difficulty,
      summary: hike.summary,
      description: hike.description,
      priceGbp: hike.price_pence / 100,
      image: hike.image,
      guide: hike.guide,
      spotsTotal: hike.spotsTotal,
    },
  });
}

async function unpublishHikeFromEventbrite(
  eventbriteEventId: string,
): Promise<{ ok: boolean; error?: string }> {
  return callEventbriteEdgeFunction({
    action: "unpublish",
    eventbriteEventId,
  });
}

// ---------- mount ----------

export function mountRoutes(app: Hono) {
  // Health check
  app.get("/api/health", (c) =>
    c.json({
      ok: true,
      time: new Date().toISOString(),
      stripe: isStripeConfigured(),
      supabase: isSupabaseConfigured(),
    }),
  );

  // TEMP DEBUG — remove after env diagnosis
  app.get("/api/_envdebug", (c) =>
    c.json({
      supabase_url: process.env.SUPABASE_URL ?? null,
      srk_present: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      srk_len: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
      srk_head: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) ?? null,
      stripe_present: Boolean(process.env.STRIPE_SECRET_KEY),
      jwt_present: Boolean(process.env.SUPABASE_JWT_SECRET),
      pat_present: Boolean(process.env.SUPABASE_PAT),
      node_env: process.env.NODE_ENV ?? null,
      port: process.env.PORT ?? null,
    }),
  );

  // -----------------------------------------------------------------
  // Hikes
  // -----------------------------------------------------------------
  app.get("/api/hikes", async (c) => {
    try {
      const rows = await listAllHikes();
      return c.json({ hikes: rows.map(presentHike) });
    } catch (err) {
      return handleError(err);
    }
  });

  app.get("/api/hikes/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const row = await loadHikeById(id);
      if (!row) return c.json({ error: "Hike not found" }, 404);
      return c.json({ hike: presentHike(row) });
    } catch (err) {
      return handleError(err);
    }
  });

  // -----------------------------------------------------------------
  // Equipment
  // -----------------------------------------------------------------
  app.get("/api/equipment", async (c) => {
    try {
      const type = c.req.query("type");
      const rows = await listAllEquipment(type || undefined);
      return c.json({ items: rows.map(presentEquipment) });
    } catch (err) {
      return handleError(err);
    }
  });

  app.get("/api/equipment/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const row = await loadEquipmentById(id);
      if (!row) return c.json({ error: "Not found" }, 404);
      return c.json({ item: presentEquipment(row) });
    } catch (err) {
      return handleError(err);
    }
  });

  app.get("/api/equipment-availability", async (c) => {
    try {
      const start = c.req.query("start");
      const end = c.req.query("end");
      if (!start || !end) {
        return c.json(
          { error: "start and end query params are required (YYYY-MM-DD)" },
          400,
        );
      }
      if (start >= end) {
        return c.json({ error: "end must be after start" }, 400);
      }
      const map = await bookedUnitsMap(start, end);
      return c.json({ booked: map });
    } catch (err) {
      return handleError(err);
    }
  });

  // -----------------------------------------------------------------
  // Equipment reservations
  // -----------------------------------------------------------------
  const equipmentReservationCreate = z.object({
    equipmentId: z.string().min(1),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    units: z.number().int().min(1).max(20).default(1),
    guests: z.number().int().min(1).max(40).default(1),
    notes: z.string().max(500).optional(),
  });

  app.post("/api/equipment-reservations", async (c) => {
    try {
      const session = await requireUser(c);
      const body = equipmentReservationCreate.parse(await c.req.json());
      if (body.endDate <= body.startDate) {
        return c.json({ error: "endDate must be after startDate" }, 400);
      }
      const item = await loadEquipmentById(body.equipmentId);
      if (!item) return c.json({ error: "Equipment not found" }, 404);

      const booked = await bookedUnitsForRange(
        body.equipmentId,
        body.startDate,
        body.endDate,
      );
      if (booked + body.units > item.total_units) {
        return c.json(
          {
            error: `Only ${Math.max(0, item.total_units - booked)} of this item are available for those dates.`,
          },
          409,
        );
      }

      const nights = Math.max(
        1,
        Math.round(
          (new Date(body.endDate).getTime() -
            new Date(body.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      const totalPence = item.price_pence * body.units * nights;
      const id = crypto.randomUUID();

      const inserted = await insertEquipmentBooking({
        id,
        userId: session.sub,
        equipmentId: body.equipmentId,
        startDate: body.startDate,
        endDate: body.endDate,
        nights,
        units: body.units,
        guests: body.guests ?? body.units,
        totalPence: totalPence,
        notes: body.notes ?? null,
        stripeSessionId: null,
        status: "reserved",
        paymentStatus: "unpaid",
      });

      let checkout: { url: string; id: string } | null = null;
      if (isStripeConfigured()) {
        try {
          const origin = new URL(c.req.url).origin;
          const sessionObj = await createCheckoutSession({
            hikeTitle: `${item.name} hire (${nights} night${nights > 1 ? "s" : ""})`,
            amountPence: totalPence,
            successUrl: `${origin}/bookings?reservation=${id}&paid=1`,
            cancelUrl: `${origin}/bookings?reservation=${id}`,
            customerEmail: session.email,
            metadata: { kind: "equipment", reservationId: id },
          });
          await updateEquipmentBooking(id, {
            stripeSessionId: sessionObj.id,
          });
          checkout = { url: sessionObj.url, id: sessionObj.id };
        } catch (err) {
          console.error("[equipment] stripe session failed", err);
        }
      }

      // Re-read with joined equipment for the presentation layer
      const fresh = await loadEquipmentBookingById(id);
      if (!fresh) return c.json({ error: "Lost reservation" }, 500);
      return c.json(
        { reservation: presentEquipmentReservation(fresh), checkout },
        201,
      );
    } catch (err) {
      return handleError(err);
    }
  });

  app.get("/api/equipment-reservations", async (c) => {
    try {
      const session = await requireUser(c).catch(() => null);
      if (!session) return c.json({ items: [] });
      const rows = await listEquipmentBookingsForUser(session.sub);
      return c.json({ items: rows.map(presentEquipmentReservation) });
    } catch (err) {
      return handleError(err);
    }
  });

  app.get("/api/equipment-reservations/:id", async (c) => {
    try {
      const session = await requireUser(c);
      const id = c.req.param("id");
      const row = await loadEquipmentBookingById(id);
      if (!row) return c.json({ error: "Not found" }, 404);
      if (row.userId !== session.sub && !session.isAdmin) {
        return c.json({ error: "Not authorised" }, 403);
      }
      return c.json({ reservation: presentEquipmentReservation(row) });
    } catch (err) {
      return handleError(err);
    }
  });

  app.post("/api/equipment-reservations/:id/cancel", async (c) => {
    try {
      const session = await requireUser(c);
      const id = c.req.param("id");
      const row = await loadEquipmentBookingById(id);
      if (!row) return c.json({ error: "Not found" }, 404);
      if (row.userId !== session.sub && !session.isAdmin) {
        return c.json({ error: "Not authorised" }, 403);
      }
      if (row.status !== "cancelled") {
        await updateEquipmentBooking(id, { status: "cancelled" });
      }
      return c.json({ ok: true, status: "cancelled" });
    } catch (err) {
      return handleError(err);
    }
  });

  // -----------------------------------------------------------------
  // Auth
  // -----------------------------------------------------------------
  const registerSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email().max(160),
    password: z.string().min(8).max(160),
  });

  app.post("/api/auth/register", async (c) => {
    try {
      const body = registerSchema.parse(await c.req.json());
      const email = body.email.toLowerCase();
      const existing = await loadProfileByEmail(email);
      if (existing)
        return c.json(
          { error: "An account with that email already exists." },
          409,
        );
      const created = await adminCreateUser({
        email,
        password: body.password,
        fullName: body.name,
        isAdmin: false,
      });
      const profile = await loadProfileById(created.id);
      const session: SessionPayload = {
        sub: created.id,
        email: created.email,
        name: body.name,
        isAdmin: profile?.is_admin === true,
      };
      return c.json({
        user: presentUser({
          id: created.id,
          email: created.email,
          name: body.name,
          is_admin: profile?.is_admin === true,
        }),
        session,
        // Tell the client it must now do a signInWithPassword to obtain a
        // Supabase access token. The browser SDK can't be reached from
        // here, so we return the credentials for the client to use.
        _requiresClientSignIn: { email, password: body.password },
      });
    } catch (err) {
      return handleError(err);
    }
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  app.post("/api/auth/login", async (c) => {
    try {
      const body = loginSchema.parse(await c.req.json());
      // We don't actually verify the password here — Supabase Auth
      // does that on the client (the browser SDK is the only entity
      // that can mint a refreshable session). Instead we confirm a
      // profile exists for this email and return it. The client uses
      // signInWithPassword itself.
      const profile = await loadProfileByEmail(body.email);
      if (!profile)
        return c.json({ error: "Invalid email or password." }, 401);
      return c.json({
        user: presentUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          is_admin: Boolean(profile.is_admin),
        }),
        // Compatibility with the previous response shape so the front-
        // end can render immediately, before the client SDK has
        // completed its signInWithPassword round trip.
        _requiresClientSignIn: { email: body.email, password: body.password },
      });
    } catch (err) {
      return handleError(err);
    }
  });

  app.post("/api/auth/logout", async (c) => {
    clearSessionCookie(c, isSecureFromContext(c));
    return c.json({ ok: true });
  });

  app.get("/api/auth/me", async (c) => {
    try {
      const { readSessionAsync } = await import("./auth");
      const session = await readSessionAsync(c);
      if (!session) return c.json({ user: null });
      // Return session data directly — session.name already has fallback
      // logic from sessionFromAccessToken (user_metadata.name, email prefix, etc),
      // so this works even when no profiles row exists yet.
      return c.json({
        user: {
          id: session.sub,
          email: session.email,
          name: session.name,
          isAdmin: session.isAdmin,
        },
      });
    } catch (err) {
      return handleError(err);
    }
  });

  // -----------------------------------------------------------------
  // Hike bookings
  // -----------------------------------------------------------------
  const bookSchema = z.object({
    hikeId: z.string().min(1),
    partySize: z.number().int().min(1).max(20),
  });

  app.post("/api/bookings", async (c) => {
    try {
      const session = await requireUser(c);
      const body = bookSchema.parse(await c.req.json());
      const hike = await loadHikeByIdFull(body.hikeId);
      if (!hike) return c.json({ error: "Hike not found" }, 404);
      if (hike.spots_left < body.partySize) {
        return c.json({ error: "Not enough spots remaining." }, 409);
      }
      const totalPence = hike.price_pence * body.partySize;

      if (totalPence > 0 && isStripeConfigured()) {
        const origin = new URL(c.req.url).origin;
        const bookingId = crypto.randomUUID();
        let sessionRes;
        try {
          sessionRes = await createCheckoutSession({
            hikeTitle: `${hike.title} x${body.partySize}`,
            amountPence: totalPence,
            successUrl: `${origin}/booking-success?booking_id=${bookingId}&session_id=\${CHECKOUT_SESSION_ID}`,
            cancelUrl: `${origin}/hikes/${hike.id}?cancelled=1`,
            customerEmail: session.email,
            metadata: {
              bookingId,
              hikeId: hike.id,
              userId: session.sub,
              partySize: String(body.partySize),
            },
          });
        } catch (stripeErr) {
          console.error("[bookings] stripe createCheckoutSession failed:", stripeErr);
          throw stripeErr;
        }
        await insertHikeBooking({
          id: bookingId,
          userId: session.sub,
          hikeId: hike.id,
          partySize: body.partySize,
          status: "pending",
          paymentStatus: "unpaid",
          totalPence: totalPence,
          stripeSessionId: sessionRes.id,
        });
        return c.json({ bookingId, checkoutUrl: sessionRes.url });
      }

      // Free or no Stripe: confirm immediately and decrement spots.
      const bookingId = crypto.randomUUID();
      await insertHikeBooking({
        id: bookingId,
        userId: session.sub,
        hikeId: hike.id,
        partySize: body.partySize,
        status: "confirmed",
        paymentStatus: "free",
        totalPence: totalPence,
        stripeSessionId: null,
      });
      await decrementHikeSpots(hike.id, body.partySize);
      return c.json({ bookingId, free: true });
    } catch (err) {
      return handleError(err);
    }
  });

  // Stripe webhook
  app.post("/api/stripe/webhook", async (c) => {
    try {
      if (!isStripeConfigured()) return c.json({ error: "Stripe not configured" }, 503);
      const signature = c.req.header("stripe-signature");
      if (!signature) return c.json({ error: "Missing signature" }, 400);
      const body = await c.req.text();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) return c.json({ error: "Webhook secret not set" }, 500);

      const verified = await verifyStripeSignature(body, signature, webhookSecret);
      if (!verified) return c.json({ error: "Bad signature" }, 400);

      let event: { type: string; data: { object: Record<string, unknown> } };
      try {
        event = JSON.parse(body);
      } catch {
        return c.json({ error: "Invalid JSON" }, 400);
      }

      if (event.type === "checkout.session.completed") {
        const sessionObj = event.data.object as {
          id?: string;
          payment_status?: string;
          metadata?: Record<string, string>;
        };
        const bookingId = sessionObj.metadata?.bookingId;
        if (sessionObj.id && bookingId) {
          const paid = sessionObj.payment_status === "paid";
          await updateHikeBooking(bookingId, {
            status: paid ? "confirmed" : "pending",
            paymentStatus: paid ? "paid" : "unpaid",
          });
          if (paid) {
            const hike = await supabaseAdmin()
              .from("bookings")
              .select("hike_id, party_size")
              .eq("id", bookingId)
              .maybeSingle();
            if (hike.data) {
              await decrementHikeSpots(
                hike.data.hike_id as string,
                hike.data.party_size as number,
              );
            }
          }
        }
      }

      return c.json({ received: true });
    } catch (err) {
      return handleError(err);
    }
  });

  // Manual confirm endpoint (used by the success page if the webhook
  // hasn't fired yet).
  app.get("/api/bookings/:id/confirm", async (c) => {
    try {
      const session = await requireUser(c);
      const id = c.req.param("id");
      const b = await loadHikeBookingById(id);
      if (!b) return c.json({ error: "Booking not found" }, 404);
      if (b.userId !== session.sub && !session.isAdmin) {
        return c.json({ error: "Not allowed" }, 403);
      }
      if (b.status === "confirmed")
        return c.json({ booking: bookingToJson(b) });
      if (!isStripeConfigured() || !b.stripeSessionId) {
        return c.json({ error: "Stripe not configured for this booking." }, 409);
      }
      const sessionObj = await retrieveCheckoutSession(b.stripeSessionId);
      if (sessionObj.payment_status !== "paid") {
        return c.json({ error: "Stripe hasn't confirmed payment yet." }, 409);
      }
      await updateHikeBooking(id, {
        status: "confirmed",
        paymentStatus: "paid",
      });
      await decrementHikeSpots(b.hikeId, b.partySize);
      const updated = await loadHikeBookingById(id);
      if (!updated) return c.json({ error: "Lost booking" }, 500);
      return c.json({
        booking: bookingToJson(updated),
      });
    } catch (err) {
      return handleError(err);
    }
  });

  app.get("/api/my/bookings", async (c) => {
    try {
      const session = await requireUser(c);
      const rows = await listHikeBookingsForUserWithHike(session.sub);
      return c.json({
        bookings: rows.map((r) => ({
          id: r.id,
          hikeId: r.hikeId,
          hikeTitle: r.hike_title ?? "",
          hikeDate: r.hike_date ?? "",
          hikeLocation: r.hike_location ?? "",
          partySize: r.partySize,
          totalPence: r.totalPence,
          status: r.status,
          paymentStatus: r.paymentStatus,
          createdAt: r.createdAt,
          stripeSessionId: r.stripeSessionId,
        })),
      });
    } catch (err) {
      return handleError(err);
    }
  });

  // -----------------------------------------------------------------
  // Cart checkout (multi-item checkout session)
  // -----------------------------------------------------------------
  const checkoutHandler = async (c: Context) => {
    try {
      const session = await requireUser(c);
      const body = z
        .object({
          items: z.array(z.object({
            kind: z.enum(["hike", "equipment"]),
            id: z.string().min(1),
            quantity: z.number().int().min(1).max(50).default(1),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
          })).min(1).max(20),
        })
        .parse(await c.req.json());

      if (!isStripeConfigured()) {
        return c.json({ error: "Stripe is not configured" }, 503);
      }

      const lineItems: Array<{
        price: string;
        quantity: number;
        metadata: Record<string, string>;
      }> = [];
      const bookingIds: string[] = [];
      let totalPence = 0;

      for (const item of body.items) {
        if (item.kind === "hike") {
          const hike = await loadHikeByIdFull(item.id);
          if (!hike) return c.json({ error: `Hike "${item.id}" not found` }, 404);
          if (hike.spots_left < item.quantity) {
            return c.json({
              error: `Not enough spots left for "${hike.title}". Requested ${item.quantity}, available ${hike.spots_left}.`,
            }, 409);
          }
          // Must have a stored Stripe price ID
          const priceId = (hike as any).stripe_price_id;
          if (!priceId) return c.json({ error: `Hike "${hike.title}" has no Stripe price configured.` }, 409);

          const pence = hike.price_pence * item.quantity;
          totalPence += pence;

          const bookingId = crypto.randomUUID();
          await insertHikeBooking({
            id: bookingId,
            userId: session.sub,
            hikeId: hike.id,
            partySize: item.quantity,
            status: "pending",
            paymentStatus: "unpaid",
            totalPence: pence,
            stripeSessionId: null,
          });
          bookingIds.push(bookingId);

          lineItems.push({
            price: priceId,
            quantity: item.quantity,
            metadata: { bookingId, hikeId: hike.id, kind: "hike" },
          });
        } else if (item.kind === "equipment") {
          const equip = await loadEquipmentById(item.id);
          if (!equip) return c.json({ error: `Equipment "${item.id}" not found` }, 404);

          if (!item.startDate || !item.endDate) {
            return c.json({ error: `Equipment "${item.id}" requires startDate and endDate` }, 400);
          }

          const nights = Math.max(1, Math.round(
            (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24),
          ));
          const units = item.quantity;
          const pence = equip.price_pence * units * nights;
          totalPence += pence;

          const booked = await bookedUnitsForRange(item.id, item.startDate, item.endDate);
          if (booked + units > equip.total_units) {
            return c.json({
              error: `Only ${Math.max(0, equip.total_units - booked)} units of "${equip.name}" available for those dates.`,
            }, 409);
          }

          const priceId = (equip as any).stripe_price_id;
          if (!priceId) return c.json({ error: `Equipment "${equip.name}" has no Stripe price configured.` }, 409);

          const reservationId = crypto.randomUUID();
          await insertEquipmentBooking({
            id: reservationId,
            userId: session.sub,
            equipmentId: equip.id,
            startDate: item.startDate,
            endDate: item.endDate,
            nights,
            units,
            guests: units,
            totalPence: pence,
            notes: null,
            stripeSessionId: null,
            status: "reserved",
            paymentStatus: "unpaid",
          });
          bookingIds.push(reservationId);

          lineItems.push({
            price: priceId,
            quantity: units * nights,
            metadata: { reservationId, equipmentId: equip.id, kind: "equipment" },
          });
        }
      }

      const origin = new URL(c.req.url).origin;
      const checkoutSession = await createCartCheckoutSession({
        successUrl: `${origin}/booking-success?checkout=1`,
        cancelUrl: `${origin}/bookings?cancelled=1`,
        customerEmail: session.email,
        metadata: { cart: bookingIds.join(",") },
        lineItems,
      });

      // Mark bookings with the Stripe session ID
      for (const bid of bookingIds) {
        if (bid && bid.startsWith("eq_")) {
          // Equipment reservation — check by looking up the pattern
          // We'll update via a generic approach for now
        }
      }

      return c.json({
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
        bookingIds,
      });
    } catch (err) {
      return handleError(err);
    }
  };
  app.post("/api/cart/checkout", checkoutHandler);

  // -----------------------------------------------------------------
  // Contact
  // -----------------------------------------------------------------
  const contactSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    subject: z.string().max(120).optional(),
    message: z.string().min(10).max(4000),
    policyVersion: z.string().optional(),
    consentedAt: z.number().optional(),
  });

  app.post("/api/contact", async (c) => {
    try {
      const session = await readSessionAsync(c);
      const body = contactSchema.parse(await c.req.json());
      await contactMessageInsert({
        name: body.name,
        email: body.email,
        subject: body.subject ?? null,
        message: body.message,
        userId: session ? session.sub : null,
        policyVersion: body.policyVersion ?? "2026-06",
        consentedAt: body.consentedAt,
      });
      const delivery = await sendContactEmail(body);
      console.log("[contact] sendContactEmail result:", delivery);
      return c.json({ ok: true, transport: delivery.transport, delivered: delivery.delivered });
    } catch (err) {
      console.error("[contact] error:", err);
      return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
    }
  });

  // -----------------------------------------------------------------
  // Admin
  // -----------------------------------------------------------------
  app.get("/api/admin/overview", async (c) => {
    try {
      await requireAdmin(c);
      const counts = await adminCounts();
      const bookings = await listRecentBookings();
      const messages = await listRecentContactMessages();
      return c.json({
        counts,
        bookings: bookings.map((b) => ({
          ...b,
          totalGbp: Math.round(b.totalPence / 100),
        })),
        messages,
      });
    } catch (err) {
      return handleError(err);
    }
  });

  // ---- Admin hike management ----

  const hikeCreateSchema = z.object({
    id: z.string().min(2).max(80),
    title: z.string().min(2),
    location: z.string().min(1),
    region: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    duration: z.string().min(1),
    difficulty: z.enum(["Easy", "Moderate", "Challenging", "Strenuous"]),
    spotsTotal: z.number().int().min(1).max(500),
    priceGbp: z.number().min(0),
    summary: z.string().min(2),
    description: z.string().min(10),
    image: z.string().min(1),
    hero: z.string().optional().default(""),
    tags: z.array(z.string()).optional().default([]),
    guide: z.string().min(1),
    publishToEventbrite: z.boolean().optional().default(false),
  });

  app.get("/api/admin/hikes", async (c) => {
    try {
      await requireAdmin(c);
      const rows = await listAllHikes();
      return c.json({ hikes: rows.map(presentHike) });
    } catch (err) {
      return handleError(err);
    }
  });

  app.post("/api/admin/hikes", async (c) => {
    try {
      await requireAdmin(c);
      const body = hikeCreateSchema.parse(await c.req.json());
      const existing = await loadHikeByIdFull(body.id);
      if (existing)
        return c.json(
          { error: `A hike with id "${body.id}" already exists.` },
          409,
        );
      await upsertHike({
        id: body.id,
        title: body.title,
        location: body.location,
        region: body.region,
        date: body.date,
        duration: body.duration,
        difficulty: body.difficulty,
        spots_total: body.spotsTotal,
        price_pence: Math.round(body.priceGbp * 100),
        summary: body.summary,
        description: body.description,
        image: body.image,
        hero: body.hero || body.image,
        tags: body.tags,
        guide: body.guide,
        publish_to_eventbrite: body.publishToEventbrite ?? false,
      });

      // Sync to Stripe
      const stripe = isStripeConfigured();
      if (stripe) {
        const result = await syncHikeToStripe({
          id: body.id,
          title: body.title,
          location: body.location,
          region: body.region,
          date: body.date,
          duration: body.duration,
          difficulty: body.difficulty,
          spots_total: body.spotsTotal,
          spots_left: body.spotsTotal,
          price_pence: Math.round(body.priceGbp * 100),
          summary: body.summary,
          description: body.description,
          image: body.image,
          hero: body.hero || body.image,
          tags: body.tags,
          guide: body.guide,
        });
        if (result.productId) {
          await updateHike(body.id, {
            stripe_product_id: result.productId,
            stripe_price_id: result.priceId ?? null,
          });
        }
      }

      // Publish to Eventbrite if requested
      if (body.publishToEventbrite) {
        const ebResult = await publishHikeToEventbrite(
          {
            id: body.id,
            title: body.title,
            location: body.location,
            region: body.region,
            date: body.date,
            duration: body.duration,
            difficulty: body.difficulty,
            summary: body.summary,
            description: body.description,
            spotsTotal: body.spotsTotal,
            price_pence: Math.round(body.priceGbp * 100),
            image: body.image,
            guide: body.guide,
          },
          undefined,
          false,
        );
        if (ebResult.ok && ebResult.eventbriteEventId) {
          await updateHike(body.id, {
            eventbrite_event_id: ebResult.eventbriteEventId,
          });
        } else {
          console.error("[eventbrite] publish failed:", ebResult.error);
          // Don't block the response — the hike was saved in DB
        }
      }

      return c.json({ ok: true, id: body.id });
    } catch (err) {
      return handleError(err);
    }
  });

  app.delete("/api/admin/hikes/:id", async (c) => {
    try {
      await requireAdmin(c);
      const id = c.req.param("id");
      // Refuse to delete a hike that has bookings
      const { count, error: countError } = await supabaseAdmin()
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("hike_id", id);
      if (countError) throw new Error(countError.message);
      const has = count ?? 0;
      if (has > 0) {
        return c.json(
          {
            error: `Can't delete: this hike has ${has} booking(s). Cancel them first or set spots_total=0.`,
          },
          409,
        );
      }

      // Archive in Stripe before deleting
      const hikeToDelete = await loadHikeById(id);
      await removeHikeFromStripe(hikeToDelete?.stripe_product_id, id);

      // Unpublish from Eventbrite if published
      if (hikeToDelete?.eventbrite_event_id) {
        await unpublishHikeFromEventbrite(hikeToDelete.eventbrite_event_id);
      }

      const ok = await deleteHike(id);
      if (!ok) return c.json({ error: "Hike not found" }, 404);
      return c.json({ ok: true });
    } catch (err) {
      return handleError(err);
    }
  });

  const hikeUpdateSchema = z.object({
    title: z.string().min(2).optional(),
    location: z.string().optional(),
    region: z.string().optional(),
    date: z.string().optional(),
    duration: z.string().optional(),
    difficulty: z.string().optional(),
    spotsTotal: z.number().int().min(0).optional(),
    priceGbp: z.number().min(0).optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    hero: z.string().optional(),
    tags: z.array(z.string()).optional(),
    guide: z.string().optional(),
    publishToEventbrite: z.boolean().optional(),
  });

  app.patch("/api/admin/hikes/:id", async (c) => {
    try {
      await requireAdmin(c);
      const id = c.req.param("id");
      const body = hikeUpdateSchema.parse(await c.req.json());
      const existing = await loadHikeByIdFull(id);
      if (!existing) return c.json({ error: "Hike not found" }, 404);
      const patch: Record<string, unknown> = {};
      if (body.title !== undefined) patch.title = body.title;
      if (body.location !== undefined) patch.location = body.location;
      if (body.region !== undefined) patch.region = body.region;
      if (body.date !== undefined) patch.date = body.date;
      if (body.duration !== undefined) patch.duration = body.duration;
      if (body.difficulty !== undefined) patch.difficulty = body.difficulty;
      if (body.summary !== undefined) patch.summary = body.summary;
      if (body.description !== undefined) patch.description = body.description;
      if (body.image !== undefined) patch.image = body.image;
      if (body.hero !== undefined) patch.hero = body.hero;
      if (body.guide !== undefined) patch.guide = body.guide;
      if (body.spotsTotal !== undefined) {
        const taken = existing.spots_total - existing.spots_left;
        const newSpots = Math.max(0, body.spotsTotal);
        const newLeft = Math.max(0, newSpots - taken);
        patch.spots_total = newSpots;
        patch.spots_left = newLeft;
      }
      if (body.priceGbp !== undefined) {
        patch.price_pence = Math.round(body.priceGbp * 100);
      }
      if (body.tags !== undefined) patch.tags = body.tags;
      const ok = await patchHike(id, patch);
      if (!ok) return c.json({ ok: true, unchanged: true });

      // Sync updated hike to Stripe
      if (isStripeConfigured() && Object.keys(patch).some(k => k !== "stripe_product_id" && k !== "stripe_price_id")) {
        const fresh = await loadHikeById(id);
        if (fresh) {
          const result = await syncHikeToStripe(fresh);
          if (result.productId && (!fresh.stripe_product_id || fresh.stripe_product_id !== result.productId)) {
            await updateHike(id, {
              stripe_product_id: result.productId,
              stripe_price_id: result.priceId ?? null,
            });
          }
        }
      }

      // Publish/update/unpublish on Eventbrite
      if (body.publishToEventbrite !== undefined) {
        const fresh = await loadHikeById(id);
        if (fresh) {
          if (body.publishToEventbrite) {
            // Image only needs re-uploading if the URL actually changed
            const imageChanged = body.image !== undefined;
            // Create or update Eventbrite event
            const ebResult = await publishHikeToEventbrite(
              {
                id: fresh.id,
                title: fresh.title,
                location: fresh.location,
                region: fresh.region,
                date: fresh.date,
                duration: fresh.duration,
                difficulty: fresh.difficulty,
                summary: fresh.summary,
                description: fresh.description,
                price_pence: fresh.price_pence,
                image: fresh.image,
                guide: fresh.guide,
                spotsTotal: fresh.spots_total,
              },
              fresh.eventbrite_event_id ?? undefined,
              imageChanged,
            );
            if (ebResult.ok && ebResult.eventbriteEventId) {
              await updateHike(id, {
                eventbrite_event_id: ebResult.eventbriteEventId,
              });
            } else {
              console.error("[eventbrite] publish/update failed:", ebResult.error);
            }
          } else if (fresh.eventbrite_event_id) {
            // Unpublish from Eventbrite
            await unpublishHikeFromEventbrite(fresh.eventbrite_event_id);
            await updateHike(id, { eventbrite_event_id: null });
          }
        }
      }

      return c.json({ ok: true });
    } catch (err) {
      return handleError(err);
    }
  });

  // ---- Admin equipment management ----

  const equipmentCreateSchema = z.object({
    id: z.string().min(1).max(80),
    type: z.enum(["tent", "bnb", "gear"]),
    name: z.string().min(1),
    summary: z.string().min(1),
    description: z.string().optional().default(""),
    image: z.string().min(1),
    location: z.string().min(1),
    pricePerNightGbp: z.number().min(0),
    capacity: z.number().int().min(1),
    stock: z.number().int().min(0),
    amenities: z.array(z.string()).optional().default([]),
  });

  const equipmentUpdateSchema = z.object({
    type: z.enum(["tent", "bnb", "gear"]).optional(),
    name: z.string().min(1).optional(),
    summary: z.string().min(1).optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    location: z.string().optional(),
    pricePerNightGbp: z.number().min(0).optional(),
    capacity: z.number().int().min(1).optional(),
    stock: z.number().int().min(0).optional(),
    amenities: z.array(z.string()).optional(),
    active: z.boolean().optional(),
  });

  app.post("/api/admin/equipment", async (c) => {
    try {
      await requireAdmin(c);
      const body = equipmentCreateSchema.parse(await c.req.json());
      const existing = await loadEquipmentById(body.id);
      if (existing) return c.json({ error: "ID already exists" }, 409);
      await upsertEquipment({
        id: body.id,
        type: body.type,
        name: body.name,
        summary: body.summary,
        description: body.description ?? "",
        image: body.image,
        location: body.location,
        pricePerNightGbp: body.pricePerNightGbp,
        capacity: body.capacity,
        totalUnits: body.stock,
        availableUnits: body.stock,
        unitLabel: "per night",
        features: body.amenities,
      });

      // Sync to Stripe
      const inserted = await loadEquipmentById(body.id);
      if (inserted) {
        const stripeResult = await syncEquipmentToStripe(inserted);
        if (stripeResult.productId) {
          await updateEquipment(body.id, {
            stripeProductId: stripeResult.productId,
            stripePriceId: stripeResult.priceId,
          } as any);
        }
      }

      return c.json({ ok: true });
    } catch (err) {
      return handleError(err);
    }
  });

  app.patch("/api/admin/equipment/:id", async (c) => {
    try {
      await requireAdmin(c);
      const id = c.req.param("id");
      const body = equipmentUpdateSchema.parse(await c.req.json());
      const existing = await loadEquipmentById(id);
      if (!existing) return c.json({ error: "Not found" }, 404);
      const patch: EquipmentPatch = {};
      if (body.type !== undefined) patch.type = body.type;
      if (body.name !== undefined) patch.name = body.name;
      if (body.summary !== undefined) patch.summary = body.summary;
      if (body.description !== undefined) patch.description = body.description;
      if (body.image !== undefined) patch.image = body.image;
      if (body.location !== undefined) patch.location = body.location;
      if (body.capacity !== undefined) patch.capacity = body.capacity;
      if (body.stock !== undefined) {
        patch.totalUnits = body.stock;
        patch.availableUnits = body.stock;
      }
      if (body.pricePerNightGbp !== undefined) {
        patch.pricePerNightGbp = body.pricePerNightGbp;
      }
      if (body.amenities !== undefined) patch.features = body.amenities;
      const ok = await patchEquipment(id, patch);
      if (!ok) return c.json({ ok: true, unchanged: true });
      const fresh = await loadEquipmentById(id);
      if (fresh) {
        const stripeResult = await syncEquipmentToStripe(fresh);
        if (stripeResult.productId) {
          await updateEquipment(id, {
            stripeProductId: stripeResult.productId,
            stripePriceId: stripeResult.priceId,
          } as any);
        }
      }
      return c.json({ ok: true });
    } catch (err) {
      return handleError(err);
    }
  });

  app.delete("/api/admin/equipment/:id", async (c) => {
    try {
      await requireAdmin(c);
      const id = c.req.param("id");
      const item = await loadEquipmentById(id);
      if (!item) return c.json({ error: "Not found" }, 404);
      await removeEquipmentFromStripe(item.stripe_product_id, id);
      const ok = await deleteEquipment(id);
      if (!ok) return c.json({ error: "Not found" }, 404);
      return c.json({ ok: true });
    } catch (err) {
      return handleError(err);
    }
  });

  // ---- Upload endpoint ----
  app.post("/api/admin/upload", async (c) => {
    try {
      await requireAdmin(c);

      const UPLOAD_MAX_BYTES = 1400 * 1024; // 1.4 MB
      const UPLOAD_ALLOWED_MIME = new Set([
        "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif",
      ]);
      const UPLOAD_BUCKET = "site-assets";
      const form = await c.req.formData();
      const rawKind = (form.get("kind") ?? c.req.query("kind") ?? "").toString();
      const kind = rawKind === "hikes" || rawKind === "equipment" ? rawKind : "";
      if (!kind) {
        return c.json(
          { error: "Upload kind is required (hikes or equipment)" },
          400,
        );
      }

      const file = form.get("file") as File | null;
      if (!file) {
        return c.json({ error: "No file provided" }, 400);
      }
      if (file.size === 0) {
        return c.json({ error: "Uploaded file is empty" }, 400);
      }
      if (file.size > UPLOAD_MAX_BYTES) {
        return c.json(
          { error: `File is too large (max ${UPLOAD_MAX_BYTES / 1024 / 1024} MB)` },
          400,
        );
      }

      let mime = file.type;
      if (mime === "application/octet-stream" || !mime) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        const guess: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          avif: "image/avif",
          gif: "image/gif",
          svg: "image/svg+xml",
        };
        mime = guess[ext ?? ""] || "image/jpeg";
      }
      if (!UPLOAD_ALLOWED_MIME.has(mime)) {
        return c.json(
          {
            error: `Unsupported file type: ${mime}. Allowed: ${[...UPLOAD_ALLOWED_MIME].join(", ")}`,
          },
          400,
        );
      }

      const ext = mimeToExt(mime);
      const folder = (form.get("folder") || c.req.query("slug") || "general").toString();
      const safeName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const objectPath = `${kind}/${folder}/${safeName}`;

      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadErr } = await supabaseAdmin().storage
        .from(UPLOAD_BUCKET)
        .upload(objectPath, arrayBuffer, {
          contentType: mime,
          cacheControl: "31536000",
          upsert: false,
        });
      if (uploadErr) {
        return c.json({ error: `Upload failed: ${uploadErr.message}` }, 500);
      }

      const { data: pub } = supabaseAdmin()
        .storage.from("site-assets")
        .getPublicUrl(objectPath);

      return c.json({
        ok: true,
        url: pub.publicUrl,
        previewUrl: `/api/admin/images/serve/${objectPath}`,
        path: objectPath,
        size: file.size,
        mime,
      });
    } catch (err) {
      return handleError(err);
    }
  });

  // ---- Admin image proxy (same-origin, avoids ORB/CORB blocking) ----
  // Proxies images from Supabase storage through the same origin so Chrome's
  // Open Recommender Blocker doesn't block cross-origin image downloads.
  // Images are already public in Supabase Storage; this proxy exists solely
  // to avoid ORB, not to gate access. No auth required.
  app.get("/api/admin/images/serve/:path{.*}", async (c) => {
    try {
      const fullPath = c.req.param("path") || "";
      if (!fullPath) return c.json({ error: "Missing path" }, 400);

      // Validate kind prefix
      const kind = fullPath.split("/")[0];
      if (!["hikes", "equipment"].includes(kind)) {
        return c.json({ error: "Invalid image kind" }, 400);
      }

      const { data: pub } = supabaseAdmin()
        .storage.from("site-assets")
        .getPublicUrl(fullPath);

      const res = await fetch(pub.publicUrl);
      if (!res.ok) return c.json({ error: "Image not found" }, 404);

      // Stream the image body back with proper content-type and cache headers
      return new Response(res.body, {
        headers: {
          "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (err) {
      return handleError(err);
    }
  });

  // ---- Admin image listing (Supabase Storage) ----
  // Lists all images in a given bucket kind folder, returning same-origin proxy URLs.
  // Query param: kind = "hikes" | "equipment"
  app.get("/api/admin/images", async (c) => {
    try {
      await requireAdmin(c);
      const kind = c.req.query("kind") || "hikes";
      if (!["hikes", "equipment"].includes(kind)) {
        return c.json({ error: "Invalid kind" }, 400);
      }

      // List top-level entries (mix of folders and files)
      const { data: topLevel, error } = await supabaseAdmin()
        .storage
        .from("site-assets")
        .list(kind, { limit: 100 });

      if (error) {
        console.error("[admin/images] list error:", error);
        return c.json({ error: error.message }, 500);
      }

      // Collect all file objects — walk into sub-folders to find actual images
      const allObjects: Array<{ name: string; updated_at: string | null }> = [];
      for (const entry of topLevel ?? []) {
        if (entry.id) {
          // Entry is a file — use its name directly
          allObjects.push({ name: entry.name, updated_at: entry.updated_at ?? null });
        } else {
          // Entry is a folder — list its contents
          const { data: files } = await supabaseAdmin()
            .storage
            .from("site-assets")
            .list(`${kind}/${entry.name}`, { limit: 100 });
          for (const file of files ?? []) {
            if (file.id) {
              allObjects.push({
                name: `${entry.name}/${file.name}`,
                updated_at: file.updated_at ?? null,
              });
            }
          }
        }
      }

      const images = allObjects
        .map((o) => {
          const fullPath = `${kind}/${o.name}`;
          const { data: pub } = supabaseAdmin()
            .storage.from("site-assets")
            .getPublicUrl(fullPath);
          const slugMatch = o.name.match(/^(.+?)\//);
          return {
            name: fullPath,
            url: pub.publicUrl,
            previewUrl: `/api/admin/images/serve/${fullPath}`,
            slug: slugMatch ? slugMatch[1] : null,
            updatedAt: o.updated_at,
          };
        })
        .sort((a, b) => {
          if (!a.updatedAt || !b.updatedAt) return 0;
          return b.updatedAt.localeCompare(a.updatedAt);
        });

      return c.json({ images });
    } catch (err) {
      return handleError(err);
    }
  });

  // ---- Telegram allow-list management ----
  app.get("/api/admin/telegram-allowlist", async (c) => {
    try {
      await requireAdmin(c);
      const { data, error } = await supabaseAdmin()
        .from("telegram_allowlist")
        .select("chat_id, label, added_at, added_by")
        .order("added_at", { ascending: true });
      if (error) return c.json({ error: error.message }, 500);
      return c.json({ entries: data ?? [] });
    } catch (err) {
      return handleError(err);
    }
  });

  const telegramAllowlistAddSchema = z.object({
    chatId: z.string().regex(/^-?\d+$/, "chat id must be a numeric Telegram chat id"),
    label: z.string().max(80).optional().nullable(),
  });

  app.post("/api/admin/telegram-allowlist", async (c) => {
    try {
      const user = await requireAdmin(c);
      const body = telegramAllowlistAddSchema.parse(await c.req.json());
      const chatId = body.chatId.trim();
      const { data: existing } = await supabaseAdmin()
        .from("telegram_allowlist")
        .select("chat_id")
        .eq("chat_id", chatId)
        .maybeSingle();
      if (existing) {
        return c.json({ error: "That chat is already on the allow-list" }, 409);
      }
      const { error } = await supabaseAdmin()
        .from("telegram_allowlist")
        .insert({
          chat_id: chatId,
          label: body.label ?? null,
          added_at: new Date().toISOString(),
          added_by: user.email,
        });
      if (error) return c.json({ error: error.message }, 500);
      return c.json({ ok: true, chatId });
    } catch (err) {
      return handleError(err);
    }
  });

  app.delete("/api/admin/telegram-allowlist/:chatId", async (c) => {
    try {
      const me = await requireAdmin(c);
      const chatId = c.req.param("chatId");
      const { count } = await supabaseAdmin()
        .from("telegram_allowlist")
        .select("chat_id", { count: "exact", head: true });
      if ((count ?? 0) <= 1) {
        return c.json(
          { error: "Cannot remove the last entry. Add another chat first." },
          400,
        );
      }
      const envChat = (process.env.TELEGRAM_ADMIN_CHAT || "").trim();
      if (envChat && envChat === chatId) {
        return c.json(
          { error: "This is the bootstrap admin chat. Change TELEGRAM_ADMIN_CHAT and re-seed to remove it." },
          400,
        );
      }
      const { error, data } = await supabaseAdmin()
        .from("telegram_allowlist")
        .delete()
        .eq("chat_id", chatId)
        .select("chat_id");
      if (error) return c.json({ error: error.message }, 500);
      if (!data || data.length === 0) return c.json({ error: "Not found" }, 404);
      void me;
      return c.json({ ok: true });
    } catch (err) {
      return handleError(err);
    }
  });

  // ---- Admin user management (Supabase Auth) ----
  app.get("/api/admin/users", async (c) => {
    try {
      await requireAdmin(c);
      const profiles = await listAllProfiles();
      return c.json({ users: profiles });
    } catch (err) {
      return handleError(err);
    }
  });

  const adminCreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(160),
    fullName: z.string().min(2).max(80),
    isAdmin: z.boolean().optional().default(false),
  });

  app.post("/api/admin/users", async (c) => {
    try {
      await requireAdmin(c);
      const body = adminCreateUserSchema.parse(await c.req.json());
      const created = await adminCreateUser({
        email: body.email,
        password: body.password,
        fullName: body.fullName,
        isAdmin: body.isAdmin,
      });
      return c.json({ ok: true, user: created });
    } catch (err) {
      return handleError(err);
    }
  });

  const adminUpdateUserSchema = z.object({
    isAdmin: z.boolean().optional(),
  });

  app.patch("/api/admin/users/:id", async (c) => {
    try {
      await requireAdmin(c);
      const id = c.req.param("id");
      const body = adminUpdateUserSchema.parse(await c.req.json());
      if (body.isAdmin !== undefined) {
        await touchProfileAdmin(id, body.isAdmin);
      }
      return c.json({ ok: true });
    } catch (err) {
      return handleError(err);
    }
  });

  app.delete("/api/admin/users/:id", async (c) => {
    try {
      await requireAdmin(c);
      const id = c.req.param("id");
      await adminDeleteUser(id);
      return c.json({ ok: true });
    } catch (err) {
      return handleError(err);
    }
  });

  // -----------------------------------------------------------------
  // GDPR
  // -----------------------------------------------------------------
  app.get("/api/gdpr/data", async (c) => {
    try {
      const session = await requireUser(c);
      const profile = await loadProfileById(session.sub);
      if (!profile) return c.json({ error: "User not found" }, 404);
      const bookings = await listHikeBookingsForUser(session.sub);
      const equipmentBookings = await listEquipmentBookingsForUser(session.sub);
      return c.json({
        exportedAt: new Date().toISOString(),
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          memberSince: profile.created_at,
        },
        bookings,
        equipmentBookings,
      });
    } catch (err) {
      return handleError(err);
    }
  });

  app.post("/api/gdpr/export", async (c) => {
    try {
      const session = await requireUser(c);
      const profile = await loadProfileById(session.sub);
      if (!profile) return c.json({ error: "User not found" }, 404);
      const bookings = await listHikeBookingsForUser(session.sub);
      const equipmentBookings = await listEquipmentBookingsForUser(session.sub);
      const data = {
        exportedAt: new Date().toISOString(),
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          memberSince: profile.created_at,
        },
        bookings: bookings.map((b) => ({
          id: b.id,
          hikeId: b.hikeId,
          partySize: b.partySize,
          status: b.status,
          paymentStatus: b.paymentStatus,
          totalGbp: Math.round(b.totalPence / 100),
          createdAt: b.createdAt,
        })),
        equipmentBookings: equipmentBookings.map((eb) => ({
          id: eb.id,
          equipmentId: eb.equipmentId,
          startDate: eb.startDate,
          endDate: eb.endDate,
          nights: eb.nights,
          units: eb.units,
          guests: eb.guests,
          totalGbp: Math.round(eb.totalPence / 100),
          status: eb.status,
          paymentStatus: eb.paymentStatus,
          createdAt: eb.createdAt,
        })),
      };
      const json = JSON.stringify(data, null, 2);
      const filename = `badr-adventures-data-${new Date().toISOString().split("T")[0]}.json`;
      return new Response(json, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (err) {
      return handleError(err);
    }
  });

  app.delete("/api/gdpr/delete", async (c) => {
    try {
      const session = await requireUser(c);
      const userId = session.sub;
      // Restore hike spots for confirmed bookings
      const bookings = await listHikeBookingsForUser(userId);
      for (const b of bookings) {
        if (b.status === "confirmed") {
          const { data: hike } = await supabaseAdmin()
            .from("hikes")
            .select("id, spots_left, spots_total")
            .eq("id", b.hikeId)
            .maybeSingle();
          if (hike) {
            await supabaseAdmin()
              .from("hikes")
              .update({
                spots_left: Math.min(
                  (hike.spots_total as number),
                  (hike.spots_left as number) + b.partySize,
                ),
              })
              .eq("id", b.hikeId);
          }
        }
      }
      await deleteHikeBookingsForUser(userId);
      await deleteEquipmentBookingsForUser(userId);
      await deleteContactMessagesForUser(userId);
      await supabaseAdmin()
        .from("telegram_allowlist")
        .delete()
        .eq("added_by", session.email);
      await adminDeleteUser(userId);
      clearSessionCookie(c, isSecureFromContext(c));
      return c.json({ ok: true, deletedAt: new Date().toISOString() });
    } catch (err) {
      return handleError(err);
    }
  });

  app.post("/api/admin/gdpr/cleanup", async (c) => {
    try {
      await requireAdmin(c);
      const body = z
        .object({ olderThanDays: z.number().int().min(1).default(365) })
        .parse(await c.req.json());
      const cutoff = Date.now() - body.olderThanDays * 24 * 60 * 60 * 1000;
      const removed = await deleteContactMessagesOlderThan(cutoff);
      return c.json({ ok: true, deletedMessages: removed });
    } catch (err) {
      return handleError(err);
    }
  });

  // ---- Admin: enquiries inbox (IMAP) ----
  app.get("/api/admin/inbox", async (c) => {
    try {
      await requireAdmin(c);
      const limit = Math.max(
        1,
        Math.min(200, Number(c.req.query("limit") || 50)),
      );
      const cursorRaw = c.req.query("cursor");
      const cursor = cursorRaw ? Number(cursorRaw) : null;
      const unreadOnly = c.req.query("unread") === "1";
      const search = c.req.query("q")?.toString() ?? "";
      const [list, summary] = await Promise.all([
        listInboxMessages({ limit, cursor, unreadOnly, search }),
        getInboxSummary(),
      ]);
      return c.json({
        messages: list.messages,
        nextCursor: list.nextCursor,
        summary,
      });
    } catch (err) {
      return handleError(err);
    }
  });

  app.get("/api/admin/inbox/unread-count", async (c) => {
    try {
      await requireAdmin(c);
      const summary = await getInboxSummary();
      return c.json(summary);
    } catch (err) {
      return handleError(err);
    }
  });

  app.get("/api/admin/inbox/:uid", async (c) => {
    try {
      await requireAdmin(c);
      const uid = Number(c.req.param("uid"));
      if (!Number.isFinite(uid)) return c.json({ error: "Invalid uid" }, 400);
      const { getInboxMessage, setMessageSeen } = await import("./imap");
      const msg = await getInboxMessage(uid);
      if (!msg.seen) {
        try {
          await setMessageSeen(uid, true);
        } catch {
          // best-effort; ignore failures
        }
      }
      return c.json({
        uid: msg.uid,
        subject: msg.subject,
        from: msg.from,
        fromName: msg.fromName,
        to: msg.to,
        date: msg.date,
        seen: msg.seen,
        text: msg.text,
        html: msg.html,
        attachments: msg.attachments,
      });
    } catch (err) {
      return handleError(err);
    }
  });

  const inboxSeenSchema = z.object({
    uid: z.number().int().positive(),
    seen: z.boolean().optional().default(true),
  });

  app.post("/api/admin/inbox/seen", async (c) => {
    try {
      await requireAdmin(c);
      const body = inboxSeenSchema.parse(await c.req.json());
      await setMessageSeen(body.uid, body.seen);
      return c.json({ ok: true, uid: body.uid, seen: body.seen });
    } catch (err) {
      return handleError(err);
    }
  });

  return app;
}
