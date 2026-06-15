// Admin notification edge function.
//
// Triggered when events happen (new signup, new booking, new contact message).
// Sends email notifications to the admin via Resend.
//
// POST /  with { type: "signup" | "booking" | "contact", payload: {...} }
//
// Env vars:
//   RESEND_API_KEY
//   ADMIN_EMAIL           (defaults to jefferygo0o@gmail.com)
//   EMAIL_FROM            (defaults to "Badr Adventures <onboarding@resend.dev>")
//   NOTIFY_SECRET         (optional — bearer token to prevent public access)

const RESEND_URL = "https://api.resend.com/emails";

function adminEmail(): string {
  return Deno.env.get("ADMIN_EMAIL") || "jefferygo0o@gmail.com";
}

function fromAddress(): string {
  return Deno.env.get("EMAIL_FROM") || "Badr Adventures <onboarding@resend.dev>";
}

function resendKey(): string | null {
  return Deno.env.get("RESEND_API_KEY") || null;
}

async function sendEmail(
  subject: string,
  body: string,
): Promise<boolean> {
  const key = resendKey();
  if (!key) {
    console.warn("[admin-notify] RESEND_API_KEY not configured");
    return false;
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [adminEmail()],
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      console.error("[admin-notify] Resend failed", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[admin-notify] send error:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Notification builders
// ---------------------------------------------------------------------------

function buildSignupMessage(payload: Record<string, unknown>): { subject: string; body: string } {
  const name = payload.name || "Unknown";
  const email = payload.email || "unknown@example.com";
  const time = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });

  return {
    subject: `New user signed up: ${name}`,
    body: [
      `New user signed up for Badr Adventures`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      `Time: ${time}`,
      ``,
      `— From the admin-notify edge function`,
    ].join("\n"),
  };
}

function buildBookingMessage(payload: Record<string, unknown>): { subject: string; body: string } {
  const userName = payload.userName || "Unknown";
  const userEmail = payload.userEmail || "unknown@example.com";
  const hikeTitle = payload.hikeTitle || "Unknown hike";
  const partySize = payload.partySize || "?";
  const totalGbp = payload.totalGbp || "0";
  const time = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });

  return {
    subject: `New booking: ${hikeTitle} (x${partySize})`,
    body: [
      `New booking received`,
      ``,
      `Customer: ${userName} (${userEmail})`,
      `Hike: ${hikeTitle}`,
      `Party size: ${partySize}`,
      `Total: £${totalGbp}`,
      `Time: ${time}`,
      ``,
      `— From the admin-notify edge function`,
    ].join("\n"),
  };
}

function buildContactMessage(payload: Record<string, unknown>): { subject: string; body: string } {
  const name = payload.name || "Unknown";
  const email = payload.email || "unknown@example.com";
  const subject = payload.subject || "No subject";
  const message = payload.message || "No message";
  const time = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });

  return {
    subject: `Contact form: ${subject}`,
    body: [
      `New contact form submission`,
      ``,
      `From: ${name} <${email}>`,
      `Subject: ${subject}`,
      `Time: ${time}`,
      ``,
      `Message:`,
      message,
      ``,
      `— From the admin-notify edge function`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  try {
    // Auth check if NOTIFY_SECRET is configured
    const notifySecret = Deno.env.get("NOTIFY_SECRET");
    if (notifySecret) {
      const auth = req.headers.get("authorization") || "";
      if (auth !== `Bearer ${notifySecret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({})) as {
      type?: string;
      payload?: Record<string, unknown>;
    };

    const type = body.type || "unknown";
    const payload = body.payload || {};

    let subject: string;
    let text: string;

    switch (type) {
      case "signup":
        ({ subject, body: text } = buildSignupMessage(payload));
        break;
      case "booking":
        ({ subject, body: text } = buildBookingMessage(payload));
        break;
      case "contact":
        ({ subject, body: text } = buildContactMessage(payload));
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown notification type: ${type}` }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
    }

    const delivered = await sendEmail(subject, text);

    return new Response(
      JSON.stringify({ ok: true, delivered, type }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[admin-notify] unhandled error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
