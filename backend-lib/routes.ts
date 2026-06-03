import { Hono } from "hono";
import { z } from "zod";
import { db } from "./db";
import {
  HTTPError,
  clearSessionCookie,
  hashPassword,
  isSecureFromContext,
  loadUserRow,
  readSessionAsync,
  requireAdmin,
  requireUser,
  setSessionCookie,
  signSession,
  verifyPassword,
  type SessionPayload,
} from "./auth";
import { callZo } from "./zo-api";
import { createCheckoutSession, isStripeConfigured, retrieveCheckoutSession, verifyStripeSignature } from "./stripe";
import { sendContactEmail } from "./email";

const hikeRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string(),
  region: z.string(),
  date: z.string(),
  duration: z.string(),
  difficulty: z.string(),
  spots_total: z.number(),
  spots_left: z.number(),
  price_pence: z.number(),
  summary: z.string(),
  description: z.string(),
  image: z.string(),
  hero: z.string(),
  tags: z.string(),
  guide: z.string(),
});

type HikeRow = z.infer<typeof hikeRowSchema>;

type EquipmentRow = {
  id: string;
  type: string;
  name: string;
  summary: string;
  description: string | null;
  image: string;
  location: string;
  capacity: number;
  stock: number;
  price_pence: number;
  amenities: string | null;
  active: number;
  created_at: number;
};

type EquipmentReservationRow = {
  id: string;
  user_id: number;
  equipment_id: string;
  start_date: string;
  end_date: string;
  nights: number;
  party_size: number;
  quantity: number;
  total_pence: number;
  status: string;
  payment_status: string;
  stripe_session_id: string | null;
  notes: string | null;
  created_at: number;
  email?: string;
  name?: string;
  equipment_name?: string;
  equipment_type?: string;
  equipment_location?: string;
  equipment_image?: string;
};

function presentHike(row: HikeRow) {
  return {
    ...row,
    tags: row.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    pricePence: row.price_pence,
    priceGbp: Math.round(row.price_pence / 100),
  };
}

function presentEquipment(row: {
  id: string;
  name: string;
  type: string;
  capacity: number;
  price_pence: number;
  description: string | null;
  image: string;
  location: string;
  active: number;
  created_at: number;
}) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    capacity: row.capacity,
    pricePerNightGbp: Math.round(row.price_pence / 100),
    description: row.description,
    image: row.image,
    location: row.location,
    createdAt: row.created_at,
  };
}

function presentEquipmentReservation(row: {
  id: string;
  user_id: number;
  equipment_id: string;
  start_date: string;
  end_date: string;
  nights: number;
  party_size: number;
  total_pence: number;
  status: string;
  payment_status: string;
  stripe_session_id: string | null;
  created_at: number;
  email?: string;
  name?: string;
  equipment_name?: string;
  equipment_type?: string;
  equipment_image?: string;
  equipment_location?: string;
}) {
  return {
    id: row.id,
    userId: row.user_id,
    user: { name: row.name ?? "", email: row.email ?? "" },
    equipmentId: row.equipment_id,
    equipment: {
      name: row.equipment_name ?? "",
      type: row.equipment_type ?? "",
      image: row.equipment_image ?? "",
      location: row.equipment_location ?? "",
    },
    startDate: row.start_date,
    endDate: row.end_date,
    nights: row.nights,
    partySize: row.party_size,
    totalGbp: Math.round(row.total_pence / 100),
    status: row.status,
    paymentStatus: row.payment_status,
    stripeSessionId: row.stripe_session_id,
    createdAt: row.created_at,
  };
}

function nextId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return `${prefix}_${t}${rand}`;
}

function presentUser(row: { id: number; email: string; name: string; is_admin: number }) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isAdmin: row.is_admin === 1,
  };
}

function bookingToJson(row: {
  id: string;
  user_id: number;
  hike_id: string;
  party_size: number;
  status: string;
  payment_status: string;
  total_pence: number;
  stripe_session_id: string | null;
  created_at: number;
}) {
  return {
    id: row.id,
    userId: row.user_id,
    hikeId: row.hike_id,
    partySize: row.party_size,
    status: row.status,
    paymentStatus: row.payment_status,
    totalPence: row.total_pence,
    stripeSessionId: row.stripe_session_id,
    createdAt: row.created_at,
  };
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
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
  // eslint-disable-next-line no-console
  console.error("[api] unhandled error", err);
  return new Response(JSON.stringify({ error: "Server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

export function mountRoutes(app: Hono) {
  // Health check
  app.get("/api/health", (c) =>
    c.json({ ok: true, time: new Date().toISOString(), stripe: isStripeConfigured() }),
  );

  // ----- Hikes -----
  app.get("/api/hikes", (c) => {
    const rows = db
      .query<HikeRow, []>(
        "SELECT * FROM hikes ORDER BY date ASC",
      )
      .all();
    return c.json({ hikes: rows.map(presentHike) });
  });
  // -----------------------------------------------------------------
  // Equipment hire (tents, B&B rooms, hiking gear)
  // -----------------------------------------------------------------

  app.get("/api/equipment", (c) => {
    const type = c.req.query("type");
    let rows;
    if (type) {
      rows = db
        .query<EquipmentRow, [string]>(
          "SELECT * FROM equipment  AND type = ? ORDER BY type, price_pence",
        )
        .all(type);
    } else {
      rows = db
        .query<EquipmentRow, []>(
          "SELECT * FROM equipment  ORDER BY type, price_pence",
        )
        .all();
    }
    return c.json({ items: rows.map(presentEquipment) });
  });

  app.get("/api/equipment/:id", (c) => {
    const id = c.req.param("id");
    const row = db
      .query<EquipmentRow, [string]>("SELECT * FROM equipment WHERE id = ?")
      .get(id);
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json({ item: presentEquipment(row) });
  });

  // Public availability for a date range. Returns per-day counts that have
  // already been booked (or held) so the UI can disable items that are full.
  const availabilityQuery = db.query<
    {
      equipment_id: string;
      nights_booked: number;
    },
    [string, string]
  >(
    `SELECT
       e.id as equipment_id,
       COALESCE(SUM(er.units), 0) as nights_booked
     FROM equipment e
     LEFT JOIN equipment_bookings er
       ON er.equipment_id = e.id
      AND er.start_date < ?
      AND er.end_date   > ?
      AND er.status IN ('pending', 'confirmed')
     GROUP BY e.id`,
  );

  app.get("/api/equipment-availability", (c) => {
    const start = c.req.query("start");
    const end = c.req.query("end");
    if (!start || !end) {
      return c.json({ error: "start and end query params are required (YYYY-MM-DD)" }, 400);
    }
    if (start >= end) {
      return c.json({ error: "end must be after start" }, 400);
    }
    const rows = availabilityQuery.all(end, start);
    const map: Record<string, number> = {};
    for (const r of rows) map[r.equipment_id] = r.nights_booked;
    return c.json({ booked: map });
  });

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
      const item = db
        .query<EquipmentRow, [string]>("SELECT * FROM equipment WHERE id = ? ")
        .get(body.equipmentId);
      if (!item) return c.json({ error: "Equipment not found" }, 404);

      // Check overlapping reservations don't exceed stock.
      const overlapping = db
        .query<{ total: number }, [string, string, string]>(
          `SELECT COALESCE(SUM(units), 0) as total
           FROM equipment_bookings
           WHERE equipment_id = ?
             AND status IN ('pending', 'confirmed')
             AND start_date < ? AND end_date > ?`,
        )
        .get(body.equipmentId, body.endDate, body.startDate);
      const booked = overlapping?.total ?? 0;
      if (booked + body.quantity > item.stock) {
        return c.json(
          {
            error: `Only ${Math.max(0, item.stock - booked)} of this item are available for those dates.`,
          },
          409,
        );
      }

      const nights = Math.max(
        1,
        Math.round(
          (new Date(body.endDate).getTime() - new Date(body.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      const totalPence = item.price_pence * body.units * nights;
      const id = crypto.randomUUID();

      db.run(
        `INSERT INTO equipment_bookings
          (id, user_id, equipment_id, start_date, end_date, nights, units, guests, status, payment_status, total_pence, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'reserved', 'unpaid', ?, ?)`,
        [
          id,
          session.sub,
          body.equipmentId,
          body.startDate,
          body.endDate,
          nights,
          body.units,
          body.guests ?? body.units,
          totalPence,
          body.notes ?? null,
          Date.now(),
        ],
      );

      // Build a Stripe checkout session for the reservation, when Stripe is
      // configured. Otherwise leave it as `reserved` and let the user pay
      // cash on collection.
      let checkout: { url: string; id: string } | null = null;
      if (isStripeConfigured()) {
        try {
          const origin = new URL(c.req.url).origin;
          const sessionObj = await createCheckoutSession({
            hikeTitle: `${item.name} hire (${nights} night${nights > 1 ? "s" : ""})`,
            amountPence: totalPence,
            successUrl: `${origin}/account/reservations?reservation=${id}&paid=1`,
            cancelUrl: `${origin}/account/reservations?reservation=${id}`,
            customerEmail: session.email,
            metadata: { kind: "equipment", reservationId: id },
          });
          db.run(
            "UPDATE equipment_bookings SET stripe_session_id = ? WHERE id = ?",
            [sessionObj.id, id],
          );
          checkout = { url: sessionObj.url, id: sessionObj.id };
        } catch (err) {
          console.error("[equipment] stripe session failed", err);
        }
      }

      const row = db
        .query<
          EquipmentReservationRow,
          [string]
        >("SELECT * FROM equipment_bookings WHERE id = ?")
        .get(id);
      return c.json(
        { reservation: presentEquipmentReservation(row!), checkout },
        201,
      );
    } catch (err) {
      return handleError(err);
    }
  });

  app.get("/api/equipment-reservations", async (c) => {
    const session = await requireUser(c).catch(() => null);
    if (!session) return c.json({ items: [] });
    const rows = db
      .query<EquipmentReservationRow, [string]>(
        `SELECT er.*, e.name as equipment_name, e.type as equipment_type, e.image as equipment_image, e.location as equipment_location,
         u.name as name, u.email as email
         FROM equipment_bookings er
         JOIN equipment e ON e.id = er.equipment_id
         JOIN users u ON u.id = er.user_id
         WHERE er.user_id = ?
         ORDER BY er.start_date DESC`,
      )
      .all(session.sub);
    return c.json({ items: rows.map(presentEquipmentReservation) });
  });

  app.get("/api/equipment-reservations/:id", async (c) => {
    const session = await requireUser(c);
    const id = c.req.param("id");
    const row = db
      .query<
        EquipmentReservationRow,
        [string]
      >(
        `SELECT er.*, e.name as equipment_name, e.type as equipment_type, e.image as equipment_image, e.location as equipment_location,
         u.name as name, u.email as email
         FROM equipment_bookings er
         JOIN equipment e ON e.id = er.equipment_id
         JOIN users u ON u.id = er.user_id
         WHERE er.id = ?`,
      )
      .get(id);
    if (!row) return c.json({ error: "Not found" }, 404);
    if (String(row.user_id) !== session.sub && !session.isAdmin) {
      return c.json({ error: "Not authorised" }, 403);
    }
    return c.json({ reservation: presentEquipmentReservation(row) });
  });

  app.post("/api/equipment-reservations/:id/cancel", async (c) => {
    try {
      const session = await requireUser(c);
      const id = c.req.param("id");
      const row = db
        .query<EquipmentReservationRow, [string]>(
          "SELECT * FROM equipment_bookings WHERE id = ?",
        )
        .get(id);
      if (!row) return c.json({ error: "Not found" }, 404);
      if (String(row.user_id) !== session.sub && !session.isAdmin) {
        return c.json({ error: "Not authorised" }, 403);
      }
      if (row.status === "cancelled") {
        return c.json({ ok: true, status: "cancelled" });
      }
      db.run(
        "UPDATE equipment_bookings SET status = 'cancelled' WHERE id = ?",
        [id],
      );
      return c.json({ ok: true, status: "cancelled" });
    } catch (err) {
      return handleError(err);
    }
  });

  // --- Admin equipment management -----------------------------------

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
      const existing = db
        .query<{ id: string }, [string]>("SELECT id FROM equipment WHERE id = ?")
        .get(body.id);
      if (existing) return c.json({ error: "ID already exists" }, 409);
      db.run(
        `INSERT INTO equipment
          (id, type, name, summary, description, image, location, price_pence, capacity, stock, stock, amenities, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          body.id,
          body.type,
          body.name,
          body.summary,
          body.description,
          body.image,
          body.location,
          Math.round(body.pricePerNightGbp * 100),
          body.capacity,
          body.stock,
          body.stock,
          body.amenities.join(","),
          Date.now(),
        ],
      );
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
      const existing = db
        .query<{ id: string }, [string]>("SELECT id FROM equipment WHERE id = ?")
        .get(id);
      if (!existing) return c.json({ error: "Not found" }, 404);
      const updates: string[] = [];
      const values: (string | number)[] = [];
      const map: Record<string, string> = {
        name: "name",
        type: "type",
        summary: "summary",
        description: "description",
        image: "image",
        location: "location",
      };
      for (const [k, col] of Object.entries(map)) {
        if (body[k as keyof typeof body] !== undefined) {
          updates.push(`${col} = ?`);
          values.push(body[k as keyof typeof body] as string);
        }
      }
      if (body.capacity !== undefined) {
        updates.push("capacity = ?");
        values.push(body.capacity);
      }
      if (body.stock !== undefined) {
        updates.push("stock = ?", "stock = ?");
        values.push(body.stock, body.stock);
      }
      if (body.pricePerNightGbp !== undefined) {
        updates.push("price_pence = ?");
        values.push(Math.round(body.pricePerNightGbp * 100));
      }
      if (body.amenities !== undefined) {
        updates.push("amenities = ?");
        values.push(body.amenities.join(","));
      }
      if (body.active !== undefined) {
        updates.push("active = ?");
        values.push(body.active ? 1 : 0);
      }
      if (updates.length === 0) return c.json({ ok: true, unchanged: true });
      values.push(id);
      db.run(`UPDATE equipment SET ${updates.join(", ")} WHERE id = ?`, values);
      return c.json({ ok: true });
    } catch (err) {
      return handleError(err);
    }
  });

  app.delete("/api/admin/equipment/:id", async (c) => {
    try {
      await requireAdmin(c);
      const id = c.req.param("id");
      const result = db.run("DELETE FROM equipment WHERE id = ?", [id]);
      if (result.changes === 0) return c.json({ error: "Not found" }, 404);
      return c.json({ ok: true });
    } catch (err) {
      return handleError(err);
    }
  });

  app.get("/api/hikes/:id", (c) => {
    const id = c.req.param("id");
    const row = db
      .query<HikeRow, [string]>("SELECT * FROM hikes WHERE id = ?")
      .get(id);
    if (!row) return c.json({ error: "Hike not found" }, 404);
    return c.json({ hike: presentHike(row) });
  });

  // ----- Auth -----
  const registerSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email().max(160),
    password: z.string().min(8).max(160),
  });

  app.post("/api/auth/register", async (c) => {
    try {
      const body = registerSchema.parse(await c.req.json());
      const email = body.email.toLowerCase();
      const existing = loadUserRow(email);
      if (existing) return c.json({ error: "An account with that email already exists." }, 409);
      const hash = await hashPassword(body.password);
      const result = db.run(
        "INSERT INTO users (email, name, password_hash, is_admin, created_at) VALUES (?, ?, ?, 0, ?)",
        [email, body.name, hash, Date.now()],
      );
      const userId = Number(result.lastInsertRowid);
      const session: SessionPayload = {
        sub: String(userId),
        email,
        name: body.name,
        isAdmin: false,
      };
      const token = await signSession(session);
      setSessionCookie(c, token, isSecureFromContext(c));
      return c.json({ user: presentUser({ id: userId, email, name: body.name, is_admin: 0 }) });
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
      const row = loadUserRow(body.email);
      if (!row) return c.json({ error: "Invalid email or password." }, 401);
      const ok = await verifyPassword(body.password, row.password_hash);
      if (!ok) return c.json({ error: "Invalid email or password." }, 401);
      const session: SessionPayload = {
        sub: String(row.id),
        email: row.email,
        name: row.name,
        isAdmin: row.is_admin === 1,
      };
      const token = await signSession(session);
      setSessionCookie(c, token, isSecureFromContext(c));
      return c.json({ user: presentUser(row) });
    } catch (err) {
      return handleError(err);
    }
  });

  app.post("/api/auth/logout", async (c) => {
    clearSessionCookie(c, isSecureFromContext(c));
    return c.json({ ok: true });
  });

  app.get("/api/auth/me", async (c) => {
    const session = await readSessionAsync(c);
    if (!session) return c.json({ user: null });
    const row = loadUserRow(session.email);
    if (!row) {
      clearSessionCookie(c, isSecureFromContext(c));
      return c.json({ user: null });
    }
    return c.json({ user: presentUser(row) });
  });

  // ----- Bookings -----
  const bookSchema = z.object({
    hikeId: z.string().min(1),
    partySize: z.number().int().min(1).max(20),
  });

  app.post("/api/bookings", async (c) => {
    try {
      const session = await requireUser(c);
      const body = bookSchema.parse(await c.req.json());
      const hike = db
        .query<HikeRow, [string]>("SELECT * FROM hikes WHERE id = ?")
        .get(body.hikeId);
      if (!hike) return c.json({ error: "Hike not found" }, 404);
      if (hike.spots_left < body.partySize) {
        return c.json({ error: "Not enough spots remaining." }, 409);
      }
      const totalPence = hike.price_pence * body.partySize;
      const id = newId("bk");

      if (totalPence > 0 && isStripeConfigured()) {
        const origin = new URL(c.req.url).origin;
        const sessionRes = await createCheckoutSession({
          hikeTitle: `${hike.title} x${body.partySize}`,
          amountPence: totalPence,
          successUrl: `${origin}/booking-success?booking=${id}`,
          cancelUrl: `${origin}/hikes/${hike.id}?cancelled=1`,
          customerEmail: session.email,
          metadata: {
            bookingId: id,
            hikeId: hike.id,
            userId: session.sub,
            partySize: String(body.partySize),
          },
        });
        db.run(
          `INSERT INTO bookings (id, user_id, hike_id, party_size, status, payment_status, total_pence, stripe_session_id, created_at)
           VALUES (?, ?, ?, ?, 'pending', 'unpaid', ?, ?, ?)`,
          [id, Number(session.sub), hike.id, body.partySize, totalPence, sessionRes.id, Date.now()],
        );
        return c.json({ bookingId: id, checkoutUrl: sessionRes.url });
      }

      // Free or no Stripe: confirm immediately.
      db.run(
        `INSERT INTO bookings (id, user_id, hike_id, party_size, status, payment_status, total_pence, stripe_session_id, created_at)
         VALUES (?, ?, ?, ?, 'confirmed', 'free', ?, NULL, ?)`,
        [id, Number(session.sub), hike.id, body.partySize, totalPence, Date.now()],
      );
      db.run("UPDATE hikes SET spots_left = spots_left - ? WHERE id = ?", [
        body.partySize,
        hike.id,
      ]);
      return c.json({ bookingId: id, free: true });
    } catch (err) {
      return handleError(err);
    }
  });

  // Stripe webhook to confirm a paid booking.
  app.post("/api/stripe/webhook", async (c) => {
    try {
      if (!isStripeConfigured()) return c.json({ error: "Stripe not configured" }, 503);
      const signature = c.req.header("stripe-signature");
      if (!signature) return c.json({ error: "Missing signature" }, 400);
      const body = await c.req.text();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) return c.json({ error: "Webhook secret not set" }, 500);

      const stripeKey = process.env.STRIPE_SECRET_KEY!;
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
        if (sessionObj.id) {
          const bookingId = sessionObj.metadata?.bookingId;
          if (bookingId) {
            const paid = sessionObj.payment_status === "paid";
            db.run(
              `UPDATE bookings
               SET status = ?, payment_status = ?
               WHERE id = ? AND stripe_session_id = ?`,
              [paid ? "confirmed" : "pending", paid ? "paid" : "unpaid", bookingId, sessionObj.id],
            );
            if (paid) {
              const row = db
                .query<{ hike_id: string; party_size: number }, [string]>(
                  "SELECT hike_id, party_size FROM bookings WHERE id = ?",
                )
                .get(bookingId);
              if (row) {
                db.run("UPDATE hikes SET spots_left = MAX(0, spots_left - ?) WHERE id = ?", [
                  row.party_size,
                  row.hike_id,
                ]);
              }
            }
          }
        }
      }

      return c.json({ received: true });
    } catch (err) {
      return handleError(err);
    }
  });

  // Dev-friendly endpoint that the success page uses to confirm a booking in
  // environments where a real Stripe webhook isn't reachable (e.g. local
  // testing, or when the user lands on the success page before the webhook
  // has fired). Only acts if Stripe actually recorded the session as paid.
  app.get("/api/bookings/:id/confirm", async (c) => {
    try {
      const session = await requireUser(c);
      const id = c.req.param("id");
      const booking = db
        .query<
          {
            id: string;
            user_id: number;
            hike_id: string;
            party_size: number;
            status: string;
            payment_status: string;
            stripe_session_id: string | null;
          },
          [string]
        >(
          "SELECT id, user_id, hike_id, party_size, status, payment_status, stripe_session_id FROM bookings WHERE id = ?",
        )
        .get(id);
      if (!booking) return c.json({ error: "Booking not found" }, 404);
      if (String(booking.user_id) !== session.sub && !session.isAdmin) {
        return c.json({ error: "Not allowed" }, 403);
      }
      if (booking.status === "confirmed") return c.json({ booking });
      if (!isStripeConfigured() || !booking.stripe_session_id) {
        return c.json({ error: "Stripe not configured for this booking." }, 409);
      }
      const sessionObj = await retrieveCheckoutSession(booking.stripe_session_id);
      if (sessionObj.payment_status !== "paid") {
        return c.json({ error: "Stripe hasn't confirmed payment yet." }, 409);
      }
      db.run(
        `UPDATE bookings SET status = 'confirmed', payment_status = 'paid' WHERE id = ?`,
        [id],
      );
      db.run("UPDATE hikes SET spots_left = MAX(0, spots_left - ?) WHERE id = ?", [
        booking.party_size,
        booking.hike_id,
      ]);
      const updated = db
        .query<
          {
            id: string;
            user_id: number;
            hike_id: string;
            party_size: number;
            status: string;
            payment_status: string;
            total_pence: number;
            stripe_session_id: string | null;
            created_at: number;
          },
          [string]
        >(
          "SELECT id, user_id, hike_id, party_size, status, payment_status, total_pence, stripe_session_id, created_at FROM bookings WHERE id = ?",
        )
        .get(id);
      return c.json({ booking: updated && bookingToJson(updated) });
    } catch (err) {
      return handleError(err);
    }
  });

  app.get("/api/my/bookings", async (c) => {
    try {
      const session = await requireUser(c);
      const rows = db
        .query<
          {
            id: string;
            user_id: number;
            hike_id: string;
            party_size: number;
            status: string;
            payment_status: string;
            total_pence: number;
            stripe_session_id: string | null;
            created_at: number;
          },
          [number]
        >(
          "SELECT id, user_id, hike_id, party_size, status, payment_status, total_pence, stripe_session_id, created_at FROM bookings WHERE user_id = ? ORDER BY created_at DESC",
        )
        .all(Number(session.sub));
      return c.json({ bookings: rows.map(bookingToJson) });
    } catch (err) {
      return handleError(err);
    }
  });

  // ----- Contact -----
  const contactSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    subject: z.string().max(120).optional(),
    message: z.string().min(10).max(4000),
  });

  app.post("/api/contact", async (c) => {
    try {
      const session = await readSessionAsync(c);
      const body = contactSchema.parse(await c.req.json());
      db.run(
        "INSERT INTO contact_messages (name, email, subject, message, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [body.name, body.email, body.subject ?? null, body.message, session ? Number(session.sub) : null, Date.now()],
      );
      await sendContactEmail(body);
      return c.json({ ok: true });
    } catch (err) {
      return handleError(err);
    }
  });

  // ----- Admin -----
  app.get("/api/admin/overview", async (c) => {
    try {
      await requireAdmin(c);
      const counts = db
        .query<
          { hikes: number; bookings: number; users: number; messages: number; pending: number; paid: number },
          []
        >(
          `SELECT
              (SELECT COUNT(*) FROM hikes) AS hikes,
              (SELECT COUNT(*) FROM bookings) AS bookings,
              (SELECT COUNT(*) FROM users) AS users,
              (SELECT COUNT(*) FROM contact_messages) AS messages,
              (SELECT COUNT(*) FROM bookings WHERE status = 'pending') AS pending,
              (SELECT COUNT(*) FROM bookings WHERE payment_status = 'paid') AS paid`,
        )
        .get();
      const recentBookings = db
        .query<
          {
            id: string;
            user_id: number;
            hike_id: string;
            party_size: number;
            status: string;
            payment_status: string;
            total_pence: number;
            created_at: number;
            user_name: string;
            user_email: string;
            hike_title: string;
          },
          []
        >(
          `SELECT b.id, b.user_id, b.hike_id, b.party_size, b.status, b.payment_status, b.total_pence, b.created_at,
                  u.name AS user_name, u.email AS user_email, h.title AS hike_title
           FROM bookings b
           JOIN users u ON u.id = b.user_id
           JOIN hikes h ON h.id = b.hike_id
           ORDER BY b.created_at DESC
           LIMIT 25`,
        )
        .all();
      const messages = db
        .query<
          {
            id: number;
            name: string;
            email: string;
            subject: string | null;
            message: string;
            created_at: number;
          },
          []
        >(
          "SELECT id, name, email, subject, message, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 50",
        )
        .all();
      return c.json({
        counts,
        bookings: recentBookings.map((b) => ({
          ...b,
          totalGbp: Math.round(b.total_pence / 100),
        })),
        messages,
      });
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
  });

  app.patch("/api/admin/hikes/:id", async (c) => {
    try {
      await requireAdmin(c);
      const id = c.req.param("id");
      const body = hikeUpdateSchema.parse(await c.req.json());
      const existing = db
        .query<{ id: string; spots_left: number; spots_total: number }, [string]>(
          "SELECT id, spots_left, spots_total FROM hikes WHERE id = ?",
        )
        .get(id);
      if (!existing) return c.json({ error: "Hike not found" }, 404);

      const updates: string[] = [];
      const values: (string | number)[] = [];
      const map: Record<string, string> = {
        title: "title",
        location: "location",
        region: "region",
        date: "date",
        duration: "duration",
        difficulty: "difficulty",
        summary: "summary",
        description: "description",
        image: "image",
        hero: "hero",
        guide: "guide",
      };
      for (const [k, col] of Object.entries(map)) {
        if (body[k as keyof typeof body] !== undefined) {
          updates.push(`${col} = ?`);
          values.push(body[k as keyof typeof body] as string);
        }
      }
      if (body.spotsTotal !== undefined) {
        const taken = existing.spots_total - existing.spots_left;
        const newSpots = Math.max(0, body.spotsTotal);
        const newLeft = Math.max(0, newSpots - taken);
        updates.push("spots_total = ?", "spots_left = ?");
        values.push(newSpots, newLeft);
      }
      if (body.priceGbp !== undefined) {
        updates.push("price_pence = ?");
        values.push(Math.round(body.priceGbp * 100));
      }
      if (body.tags !== undefined) {
        updates.push("tags = ?");
        values.push(body.tags.join(","));
      }
      if (updates.length === 0) return c.json({ ok: true, unchanged: true });
      values.push(id);
      db.run(`UPDATE hikes SET ${updates.join(", ")} WHERE id = ?`, values);
      return c.json({ ok: true });
    } catch (err) {
      return handleError(err);
    }
  });
  return app;
}
