// Email helpers. Sends contact-form messages to the enquiries inbox so
// they land in the IMAP inbox admins read on the /admin page.
//
// Primary transport: IONOS SMTP (so messages hit the enquiries inbox
// directly). Fallback: Resend, then log to Supabase.
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import { logEmailFallback } from "./email-log";

const FROM_HEADER = "Bad Radventures <enquiries@badradventures.co.uk>";
const FALLBACK_TO = "enquiries@badradventures.co.uk";

let cachedSmtpTransporter: Transporter | null = null;
let smtpAttempted = false;

function getIonosSmtpTransporter(): Transporter | null {
  if (smtpAttempted) return cachedSmtpTransporter;
  smtpAttempted = true;

  const user = process.env.IONOS_SMTP_USER;
  const pass = process.env.IONOS_SMTP_PASSWORD;
  const host = process.env.IONOS_SMTP_HOST ?? "smtp.ionos.co.uk";
  const port = Number(process.env.IONOS_SMTP_PORT ?? 587);

  if (!user || !pass) {
    console.warn("[email] IONOS_SMTP_USER/PASSWORD not set — skipping SMTP");
    return null;
  }

  cachedSmtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false, minVersion: "TLSv1.2" },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 10_000,
  });
  return cachedSmtpTransporter;
}

async function sendViaIonosSmtp(input: {
  subject: string;
  body: string;
  fromName: string;
  replyTo: string;
}): Promise<{ delivered: boolean; error?: string }> {
  const transporter = getIonosSmtpTransporter();
  if (!transporter) return { delivered: false, error: "no transporter" };

  try {
    const info = await transporter.sendMail({
      from: FROM_HEADER,
      to: FALLBACK_TO,
      subject: input.subject,
      text: input.body,
      replyTo: input.replyTo,
      headers: {
        "X-BadRad-Source": "contact-form",
      },
    });
    console.log("[email] SMTP delivered", { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected });
    if ((info.rejected ?? []).length > 0 || (info.accepted ?? []).length === 0) {
      return { delivered: false, error: `rejected=${JSON.stringify(info.rejected)}` };
    }
    return { delivered: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] SMTP send failed", { message, code: (err as { code?: string })?.code });
    return { delivered: false, error: message };
  }
}

export type SendContactEmailResult = {
  delivered: boolean;
  transport: "ionos-smtp" | "resend" | "stored";
  smtpError?: string;
};

export async function sendContactEmail(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<SendContactEmailResult> {
  const subject = input.subject?.trim() || `Website enquiry from ${input.name}`;
  const body = `From: ${input.name} <${input.email}>\n\n${input.message}\n\n— Sent from the badradventures.co.uk contact form`;

  // 1) Try IONOS SMTP — sends directly into the enquiries inbox.
  const smtp = await sendViaIonosSmtp({
    subject,
    body,
    fromName: input.name,
    replyTo: input.email,
  });
  if (smtp.delivered) {
    return { delivered: true, transport: "ionos-smtp" };
  }

  // 2) Log the fallback so we can debug.
  await logEmailFallback({
    transport: "ionos-smtp",
    from: input.email,
    to: FALLBACK_TO,
    subject,
    body,
    error: smtp.error ?? "unknown",
  });

  return { delivered: false, transport: "stored", smtpError: smtp.error };
}
