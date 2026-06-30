// Booking confirmation edge function.
//
// Fallback for when the Stripe webhook hasn't fired yet (occasional delay).
// The site redirects users to this URL on the success page.
//
// POST /  with { bookingId: string }
//   or
// GET /?bookingId=<id>  (simple fallback)
//
// Checks the Stripe session status and confirms the booking if paid.
//
// Env vars:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   STRIPE_SECRET_KEY
import { supabaseAdmin } from "../_shared/supabase-client.ts";
const STRIPE_API = "https://api.stripe.com/v1";
function stripeSecret() {
    const s = Deno.env.get("STRIPE_SECRET_KEY");
    if (!s)
        throw new Error("STRIPE_SECRET_KEY not set");
    return s;
}
function basicAuth() {
    const encoded = btoa(`${stripeSecret()}:`);
    return { Authorization: `Basic ${encoded}` };
}
// ---------------------------------------------------------------------------
// Stripe helpers
// ---------------------------------------------------------------------------
async function retrieveCheckoutSession(sessionId) {
    try {
        const res = await fetch(`${STRIPE_API}/checkout/sessions/${sessionId}`, {
            headers: basicAuth(),
        });
        if (!res.ok)
            return null;
        return await res.json();
    }
    catch {
        return null;
    }
}
// ---------------------------------------------------------------------------
// Booking processing
// ---------------------------------------------------------------------------
async function decrementHikeSpots(hikeId, partySize) {
    const { data, error } = await supabaseAdmin().rpc("decrement_hike_spots", {
        hike_id: hikeId,
        delta: partySize,
    });
    if (error) {
        console.error("[confirm-booking] decrement error:", error.message);
        return false;
    }
    return data != null;
}
async function confirmHikeBooking(bookingId) {
    // Load booking
    const { data: booking, error: loadErr } = await supabaseAdmin()
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();
    if (loadErr || !booking) {
        return { ok: false, error: "Booking not found" };
    }
    const b = booking;
    // Already confirmed
    if (b.status === "confirmed") {
        return { ok: true, status: "confirmed" };
    }
    const stripeSessionId = b.stripe_session_id;
    if (!stripeSessionId) {
        return { ok: false, error: "No Stripe session for this booking" };
    }
    // Check with Stripe
    const session = await retrieveCheckoutSession(stripeSessionId);
    if (!session) {
        return { ok: false, error: "Could not verify payment with Stripe" };
    }
    if (session.payment_status !== "paid") {
        return { ok: false, error: "Payment not yet confirmed by Stripe" };
    }
    // Confirm the booking
    const { error: updateErr } = await supabaseAdmin()
        .from("bookings")
        .update({ status: "confirmed", payment_status: "paid" })
        .eq("id", bookingId);
    if (updateErr) {
        return { ok: false, error: updateErr.message };
    }
    await decrementHikeSpots(b.hike_id, b.party_size);
    return { ok: true, status: "confirmed" };
}
// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
    try {
        const url = new URL(req.url);
        // Accept both GET and POST
        let bookingId = null;
        if (req.method === "POST") {
            const body = await req.json().catch(() => ({}));
            bookingId = body.bookingId || null;
        }
        else if (req.method === "GET") {
            bookingId = url.searchParams.get("bookingId");
        }
        if (!bookingId) {
            return new Response(JSON.stringify({ error: "Missing bookingId parameter" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
        const result = await confirmHikeBooking(bookingId);
        if (!result.ok) {
            return new Response(JSON.stringify(result), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
        });
    }
    catch (err) {
        console.error("[confirm-booking] unhandled error:", err);
        return new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
