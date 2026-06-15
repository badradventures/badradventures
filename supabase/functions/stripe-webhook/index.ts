// Stripe webhook edge function — replaces the in-process Bun webhook.
//
// Handles checkout.session.completed events for both hike bookings
// (metadata.bookingId) and equipment reservations (metadata.kind === "equipment").
//
// Env vars:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   STRIPE_WEBHOOK_SECRET

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

async function hexToBytes(hex: string): Promise<Uint8Array> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

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

      // --- Hike booking ---
      const bookingId = metadata.bookingId;
      if (sessionId && bookingId) {
        console.log(`[stripe-webhook] hike booking ${bookingId} paid=${paid}`);

        const { error: updateErr } = await supabaseAdmin()
          .from("bookings")
          .update({
            status: paid ? "confirmed" : "pending",
            payment_status: paid ? "paid" : "unpaid",
          })
          .eq("id", bookingId);

        if (updateErr) {
          console.error("[stripe-webhook] update booking error:", updateErr.message);
        } else if (paid) {
          // Load the booking to get hike_id and party_size
          const { data: booking } = await supabaseAdmin()
            .from("bookings")
            .select("hike_id, party_size")
            .eq("id", bookingId)
            .maybeSingle();

          if (booking) {
            await decrementHikeSpots(
              booking.hike_id as string,
              booking.party_size as number,
            );
          }
        }
      }

      // --- Equipment reservation ---
      const kind = metadata.kind;
      const reservationId = metadata.reservationId;
      if (sessionId && kind === "equipment" && reservationId) {
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
        }
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
