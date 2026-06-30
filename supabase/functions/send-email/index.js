"use strict";
// Send branded confirmation emails via Resend.
//
// Called by the stripe-webhook edge function after a successful
// payment. Constructs a full HTML email with the Badr Adventures
// brand identity (logo, colours, typography).
//
// Env vars:
//   RESEND_API_KEY
//   EMAIL_FROM          (default: "Badr Adventures <onboarding@resend.dev>")
//
// POST /
//   { to, name, items, totalPence, bookingIds }
// ---------------------------------------------------------------------------
// Brand constants
// ---------------------------------------------------------------------------
const BRAND = {
    name: "Badr Adventures UK",
    primary: "#2d4a3a", // moss / pine
    primaryLight: "#4a6b56", // moss-light / sage
    accent: "#b85a3a", // terracotta / rust
    accentBright: "#d26a44",
    gold: "#c89b3c", // ochre
    background: "#f3ede0", // paper
    card: "#faf6ec",
    ink: "#1f1a14",
    muted: "#5a4f3f",
    border: "rgba(31,26,20,0.14)",
    logoUrl: "https://kkthenuttah.zo.space/images/logo-white.png",
    siteUrl: "https://kkthenuttah.zo.space",
    fontDisplay: "'Georgia', 'Times New Roman', serif",
    fontBody: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', sans-serif",
};
// ---------------------------------------------------------------------------
// Email HTML template
// ---------------------------------------------------------------------------
function formatGbp(pence) {
    return `£${(pence / 100).toFixed(2)}`;
}
function buildConfirmationHtml(input) {
    const itemsHtml = input.items
        .map((item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.border};">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family: ${BRAND.fontBody}; font-size: 14px; color: ${BRAND.ink};">
                  <strong>${item.title}</strong>
                  ${item.kind === "hike"
        ? item.date
            ? `<br><span style="color: ${BRAND.muted}; font-size: 13px;">${item.date}</span>`
            : ""
        : item.date
            ? `<br><span style="color: ${BRAND.muted}; font-size: 13px;">${item.date} – ${item.endDate}${item.nights ? ` (${item.nights} night${item.nights > 1 ? "s" : ""})` : ""}</span>`
            : ""}
                </td>
                <td align="right" style="font-family: ${BRAND.fontBody}; font-size: 14px; color: ${BRAND.ink}; white-space: nowrap;">
                  ${item.quantity > 1 ? `${item.quantity} × ` : ""}${formatGbp(item.totalPence)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `)
        .join("");
    const reference = input.bookingIds.length > 0
        ? `<p style="font-family: ${BRAND.fontBody}; font-size: 11px; color: ${BRAND.muted}; margin: 16px 0 0;">
        Reference${input.bookingIds.length > 1 ? "s" : ""}: ${input.bookingIds.slice(0, 3).join(", ")}${input.bookingIds.length > 3 ? ` +${input.bookingIds.length - 3} more` : ""}
       </p>`
        : "";
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.background};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.background};">
    <tr>
      <td align="center" style="padding: 40px 16px 40px;">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">

          <!-- Header / Logo -->
          <tr>
            <td style="padding: 32px 32px 12px; background-color: ${BRAND.primary}; border-radius: 12px 12px 0 0; text-align: center;">
              <img src="${BRAND.logoUrl}" alt="${BRAND.name}" width="100" style="display: block; margin: 0 auto; max-width: 100px; height: auto;">
              <h1 style="font-family: ${BRAND.fontDisplay}; font-size: 24px; font-weight: 600; color: #faf6ec; margin: 16px 0 4px; letter-spacing: -0.02em;">
                Booking confirmed
              </h1>
              <p style="font-family: ${BRAND.fontBody}; font-size: 14px; color: rgba(250, 246, 236, 0.75); margin: 0;">
                Thanks for booking with us — we can't wait to see you on the trail.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 8px 32px 32px; background-color: ${BRAND.card}; border-radius: 0 0 12px 12px;">

              <!-- Greeting -->
              <p style="font-family: ${BRAND.fontBody}; font-size: 15px; color: ${BRAND.ink}; margin: 20px 0 8px;">
                Hi${input.name ? ` ${input.name}` : ""},
              </p>
              <p style="font-family: ${BRAND.fontBody}; font-size: 14px; color: ${BRAND.muted}; margin: 0 0 20px; line-height: 1.5;">
                Your booking has been received and your payment is confirmed. Here's a summary of what you've booked:
              </p>

              <!-- Items table -->
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                <tr>
                  <td style="font-family: ${BRAND.fontDisplay}; font-size: 18px; font-weight: 600; color: ${BRAND.ink};">
                    Total paid
                  </td>
                  <td align="right" style="font-family: ${BRAND.fontDisplay}; font-size: 18px; font-weight: 600; color: ${BRAND.ink};">
                    ${formatGbp(input.totalPence)}
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="height: 1px; background-color: ${BRAND.border}; margin: 24px 0;"></div>

              <!-- Info boxes -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 0 8px 8px 0; vertical-align: top;">
                    <table width="100%" cellpadding="12" cellspacing="0" style="background-color: ${BRAND.background}; border-radius: 8px;">
                      <tr>
                        <td style="font-family: ${BRAND.fontBody}; font-size: 13px; color: ${BRAND.ink};">
                          <strong style="color: ${BRAND.primary};">✓</strong> Payment held securely by Stripe
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding: 0 0 8px 8px; vertical-align: top;">
                    <table width="100%" cellpadding="12" cellspacing="0" style="background-color: ${BRAND.background}; border-radius: 8px;">
                      <tr>
                        <td style="font-family: ${BRAND.fontBody}; font-size: 13px; color: ${BRAND.ink};">
                          <strong style="color: ${BRAND.primary};">✓</strong> Kit list emailed 48 hours before
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 8px 8px 0 0; vertical-align: top;">
                    <table width="100%" cellpadding="12" cellspacing="0" style="background-color: ${BRAND.background}; border-radius: 8px;">
                      <tr>
                        <td style="font-family: ${BRAND.fontBody}; font-size: 13px; color: ${BRAND.ink};">
                          <strong style="color: ${BRAND.primary};">✓</strong> Pace set to the slowest member
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding: 8px 0 0 8px; vertical-align: top;">
                    <table width="100%" cellpadding="12" cellspacing="0" style="background-color: ${BRAND.background}; border-radius: 8px;">
                      <tr>
                        <td style="font-family: ${BRAND.fontBody}; font-size: 13px; color: ${BRAND.ink};">
                          <strong style="color: ${BRAND.primary};">✓</strong> No additional charges
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${reference}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: ${BRAND.primary}; border-radius: 999px; padding: 12px 32px;">
                          <a href="${BRAND.siteUrl}/bookings" style="font-family: ${BRAND.fontBody}; font-size: 14px; font-weight: 500; color: #faf6ec; text-decoration: none; display: inline-block;">
                            View my bookings
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center;">
              <p style="font-family: ${BRAND.fontBody}; font-size: 11px; color: ${BRAND.muted}; margin: 0;">
                ${BRAND.name} &middot;
                <a href="${BRAND.siteUrl}" style="color: ${BRAND.muted}; text-decoration: underline;">${BRAND.siteUrl}</a>
              </p>
              <p style="font-family: ${BRAND.fontBody}; font-size: 10px; color: ${BRAND.muted}; margin: 8px 0 0;">
                This email was sent automatically after a successful payment on our website.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
// ---------------------------------------------------------------------------
// Resend API
// ---------------------------------------------------------------------------
const RESEND_URL = "https://api.resend.com/emails";
function resendFromAddress() {
    return Deno.env.get("EMAIL_FROM") || "Badr Adventures <onboarding@resend.dev>";
}
function resendApiKey() {
    const key = Deno.env.get("RESEND_API_KEY");
    if (!key)
        throw new Error("RESEND_API_KEY not set");
    return key;
}
async function sendViaResend(input) {
    try {
        const res = await fetch(RESEND_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${resendApiKey()}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: resendFromAddress(),
                to: [input.to],
                subject: input.subject,
                html: input.html,
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { ok: false, error: `Resend ${res.status}: ${JSON.stringify(data)}` };
        }
        return { ok: true, id: data.id };
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}
// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
    try {
        // Accept only POST
        if (req.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method not allowed" }), {
                status: 405,
                headers: { "Content-Type": "application/json" },
            });
        }
        // Auth check: require service-role key as Bearer token for internal calls
        const authHeader = req.headers.get("authorization") || "";
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!authHeader.startsWith("Bearer ") || authHeader.slice(7) !== serviceKey) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }
        const payload = await req.json();
        // Validate
        if (!payload.to || !payload.items?.length) {
            return new Response(JSON.stringify({ error: "Missing required fields: to, items" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        // Build and send the confirmation email
        const subject = payload.items.length === 1
            ? `Booking confirmed: ${payload.items[0].title}`
            : `Booking confirmed — ${payload.items.length} item${payload.items.length > 1 ? "s" : ""}`;
        const html = buildConfirmationHtml({
            name: payload.name,
            items: payload.items,
            totalPence: payload.totalPence,
            bookingIds: payload.bookingIds,
        });
        const result = await sendViaResend({ to: payload.to, subject, html });
        if (!result.ok) {
            console.error("[send-email] failed:", result.error);
            return new Response(JSON.stringify(result), {
                status: 502,
                headers: { "Content-Type": "application/json" },
            });
        }
        console.log("[send-email] delivered:", result.id, "to", payload.to);
        return new Response(JSON.stringify({ ok: true, id: result.id }), {
            headers: { "Content-Type": "application/json" },
        });
    }
    catch (err) {
        console.error("[send-email] unhandled error:", err);
        return new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
