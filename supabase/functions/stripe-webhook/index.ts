// Stripe webhook edge function — replaces the in-process Bun webhook.
//
// Handles checkout.session.completed events for:
//   - Single hike bookings (metadata.bookingId)
//   - Single equipment reservations (metadata.kind === "equipment")
//   - Cart checkout (metadata.cart = comma-separated booking IDs)
//
// After confirming a paid booking, it sends the customer a branded
// confirmation email via the send-email edge function.
//
// Env vars:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET
//   RESEND_API_KEY        (needed by send-email, forwarded in the call)

import { supabaseAdmin } from "../_shared/supabase-client.ts";

const STRIPE_API = "https://api.stripe.com/v1";

function stripeSecret(): string {
  const s = Deno.env.get("STRIPE_SECRET_KEY");
  if (!s) throw new Error("STRIPE_SECRET_KEY not set");
  return s;
}

function webhookSecret(): string {
  const s = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!s) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  return s;
}

// ---------------------------------------------------------------------------
// Stripe signature verification (HMAC SHA-256)
// ---------------------------------------------------------------------------

async function verifyStripeSignature(
  body: string,
  header: string,
  secret: string,
): Promise<boolean> {
  const parts = header.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${t}.${body}`),
  );
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time compare
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Booking helpers
// ---------------------------------------------------------------------------

async function decrementHikeSpots(hikeId: string, partySize: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin().rpc("decrement_hike_spots", {
    hike_id: hikeId,
    delta: partySize,
  });
  if (error) {
    console.error("[stripe-webhook] decrement_hike_spots error:", error.message);
    return false;
  }
  return data != null;
}

// ---------------------------------------------------------------------------
// Send-email helper — calls the send-email edge function
// ---------------------------------------------------------------------------

function functionsUrl(): string {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw new Error("SUPABASE_URL not set");
  // https://<project-ref>.supabase.co  ->  https://<project-ref>.supabase.co/functions/v1/send-email
  return `${url.replace(/\/$/, "")}/functions/v1/send-email`;
}

async function sendConfirmationEmail(input: {
  userId: string;
  items: Array<{
    kind: "hike" | "equipment";
    title: string;
    quantity: number;
    totalPence: number;
    date?: string;
    endDate?: string;
    nights?: number;
  }>;
  totalPence: number;
  bookingIds: string[];
}): Promise<void> {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) {
    console.error("[stripe-webhook] cannot send email: SUPABASE_SERVICE_ROLE_KEY not set");
    return;
  }

  // Look up the user's profile
  const { data: profile } = await supabaseAdmin()
    .from("profiles")
    .select("email, name")
    .eq("id", input.userId)
    .maybeSingle();

  if (!profile) {
    console.error("[stripe-webhook] cannot send email: profile not found for", input.userId);
    return;
  }

  const payload = {
    to: (profile as Record<string, unknown>).email as string,
    name: ((profile as Record<string, unknown>).name as string) || "",
    items: input.items,
    totalPence: input.totalPence,
    bookingIds: input.bookingIds,
  };

  try {
    const res = await fetch(functionsUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "unknown");
      console.error("[stripe-webhook] send-email returned", res.status, text);
    } else {
      console.log("[stripe-webhook] confirmation email sent to", payload.to);
    }
  } catch (err) {
    console.error("[stripe-webhook] send-email call failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Process a single hike booking
// ---------------------------------------------------------------------------

async function processHikeBooking(
  bookingId: string,
  paid: boolean,
  customerEmail?: string,
): Promise<void> {
  console.log(`[stripe-webhook] hike booking ${bookingId} paid=${paid}`);

  const { error: updateErr } = await supabaseAdmin()
    .from("bookings")
    .update({
      status: paid ? "confirmed" : "pending",
      payment_status: paid ? "paid" : "unpaid",
    })
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[stripe-webhook] update hike booking error:", updateErr.message);
    return;
  }

  if (!paid) return;

  // Load the booking with hike details
  const { data: booking } = await supabaseAdmin()
    .from("bookings")
    .select("*, hikes:hike_id(title, date)")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    console.error("[stripe-webhook] booking not found after update:", bookingId);
    return;
  }

  const b = booking as Record<string, unknown>;

  await decrementHikeSpots(
    b.hike_id as string,
    b.party_size as number,
  );

  const hikeData = b.hikes as Record<string, unknown> | undefined;

  // Send confirmation email
  await sendConfirmationEmail({
    userId: b.user_id as string,
    items: [{
      kind: "hike",
      title: (hikeData?.title as string) || "Hike",
      quantity: b.party_size as number,
      totalPence: (b.total_pence as number) || 0,
      date: hikeData?.date as string | undefined,
    }],
    totalPence: (b.total_pence as number) || 0,
    bookingIds: [bookingId],
  });
}

// ---------------------------------------------------------------------------
// Process a single equipment reservation
// ---------------------------------------------------------------------------

async function processEquipmentReservation(
  reservationId: string,
  paid: boolean,
): Promise<void> {
  console.log(`[stripe-webhook] equipment reservation ${reservationId} paid=${paid}`);

  const { error: updateErr } = await supabaseAdmin()
    .from("equipment_bookings")
    .update({
      status: paid ? "confirmed" : "pending",
      payment_status: paid ? "paid" : "unpaid",
    })
    .eq("id", reservationId);

  if (updateErr) {
    console.error("[stripe-webhook] update equipment booking error:", updateErr.message);
    return;
  }

  if (!paid) return;

  // Load the reservation with equipment details
  const { data: reservation } = await supabaseAdmin()
    .from("equipment_bookings")
    .select("*, equipment:equipment_id(name)")
    .eq("id", reservationId)
    .maybeSingle();

  if (!reservation) {
    console.error("[stripe-webhook] equipment reservation not found after update:", reservationId);
    return;
  }

  const r = reservation as Record<string, unknown>;
  const equipData = r.equipment as Record<string, unknown> | undefined;

  // Send confirmation email
  await sendConfirmationEmail({
    userId: r.user_id as string,
    items: [{
      kind: "equipment",
      title: (equipData?.name as string) || "Equipment",
      quantity: r.units as number,
      totalPence: (r.total_pence as number) || 0,
      date: r.start_date as string | undefined,
      endDate: r.end_date as string | undefined,
      nights: r.nights as number | undefined,
    }],
    totalPence: (r.total_pence as number) || 0,
    bookingIds: [reservationId],
  });
}

// ---------------------------------------------------------------------------
// Process a cart checkout (multiple bookings in one session)
// ---------------------------------------------------------------------------

async function processCartCheckout(
  bookingIds: string[],
  paid: boolean,
): Promise<void> {
  if (!paid || bookingIds.length === 0) return;

  const items: Array<{
    kind: "hike" | "equipment";
    title: string;
    quantity: number;
    totalPence: number;
    date?: string;
    endDate?: string;
    nights?: number;
  }> = [];
  let totalPence = 0;
  let userId: string | null = null;

  for (const id of bookingIds) {
    // Try hike booking first
    const { data: hikeBooking } = await supabaseAdmin()
      .from("bookings")
      .select("*, hikes:hike_id(title, date)")
      .eq("id", id)
      .maybeSingle();

    if (hikeBooking) {
      const b = hikeBooking as Record<string, unknown>;
      const hikeData = b.hikes as Record<string, unknown> | undefined;
      const pence = (b.total_pence as number) || 0;

      // Confirm it
      await supabaseAdmin()
        .from("bookings")
        .update({ status: "confirmed", payment_status: "paid" })
        .eq("id", id);

      await decrementHikeSpots(
        b.hike_id as string,
        b.party_size as number,
      );

      items.push({
        kind: "hike",
        title: (hikeData?.title as string) || "Hike",
        quantity: b.party_size as number,
        totalPence: pence,
        date: hikeData?.date as string | undefined,
      });

      totalPence += pence;
      userId = userId || (b.user_id as string);
      continue;
    }

    // Try equipment booking
    const { data: equipBooking } = await supabaseAdmin()
      .from("equipment_bookings")
      .select("*, equipment:equipment_id(name)")
      .eq("id", id)
      .maybeSingle();

    if (equipBooking) {
      const r = equipBooking as Record<string, unknown>;
      const equipData = r.equipment as Record<string, unknown> | undefined;
      const pence = (r.total_pence as number) || 0;

      // Confirm it
      await supabaseAdmin()
        .from("equipment_bookings")
        .update({ status: "confirmed", payment_status: "paid" })
        .eq("id", id);

      items.push({
        kind: "equipment",
        title: (equipData?.name as string) || "Equipment",
        quantity: r.units as number,
        totalPence: pence,
        date: r.start_date as string | undefined,
        endDate: r.end_date as string | undefined,
        nights: r.nights as number | undefined,
      });

      totalPence += pence;
      userId = userId || (r.user_id as string);
    }
  }

  if (userId && items.length > 0) {
    await sendConfirmationEmail({
      userId,
      items,
      totalPence,
      bookingIds,
    });
  }
}

// ---------------------------------------------------------------------------
// Request dedup (in-memory set, resets on cold start — acceptable for
// Stripe retries that are at least minutes apart)
// ---------------------------------------------------------------------------

const processedEvents = new Set<string>();

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const secret = webhookSecret();

    const verified = await verifyStripeSignature(body, signature, secret);
    if (!verified) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let event: { type: string; id?: string; data: { object: Record<string, unknown> } };
    try {
      event = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Idempotency check
    if (event.id && processedEvents.has(event.id)) {
      return new Response(JSON.stringify({ received: true, skipped: "duplicate" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (event.id) processedEvents.add(event.id);

    if (event.type === "checkout.session.completed") {
      const obj = event.data.object as Record<string, unknown>;
      const metadata = (obj.metadata || {}) as Record<string, string>;
      const sessionId = obj.id as string | undefined;
      const paymentStatus = (obj.payment_status as string) || "unpaid";
      const paid = paymentStatus === "paid";
      const customerEmail = obj.customer_email as string | undefined;

      // --- Cart checkout (multiple bookings) ---
      const cartIds = metadata.cart;
      if (sessionId && cartIds) {
        const bookingIds = cartIds.split(",").map((s) => s.trim()).filter(Boolean);
        console.log(`[stripe-webhook] cart checkout: ${bookingIds.length} booking(s), paid=${paid}`);
        await processCartCheckout(bookingIds, paid);
      }

      // --- Single hike booking ---
      const bookingId = metadata.bookingId;
      if (sessionId && bookingId) {
        await processHikeBooking(bookingId, paid, customerEmail);
      }

      // --- Single equipment reservation ---
      const kind = metadata.kind;
      const reservationId = metadata.reservationId;
      if (sessionId && kind === "equipment" && reservationId) {
        await processEquipmentReservation(reservationId, paid);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[stripe-webhook] unhandled error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
