// Email helpers. Sends contact-form messages to the enquiries inbox so
// they land in the IMAP inbox and can be read from the admin panel.
//
// Transport selection (first available wins):
//   1. IONOS SMTP (IONOS_SMTP_USER / IONOS_SMTP_PASSWORD) — preferred, the
//      message then appears in the same IMAP inbox we read from.
//   2. Resend (RESEND_API_KEY) — fallback.
//   3. Store only in `contact_messages` (no email is sent).

import nodemailer, { type Transporter } from "nodemailer";

const RESEND_URL = "https://api.resend.com/emails";

export function adminEmail(): string {
  return process.env.ADMIN_EMAIL || "enquiries@badradventures.co.uk";
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function isIonosSmtpConfigured(): boolean {
  return Boolean(
    (process.env.IONOS_SMTP_USER ?? "").trim() &&
      (process.env.IONOS_SMTP_PASSWORD ?? "").trim(),
  );
}

function resendFromAddress(): string {
  return process.env.EMAIL_FROM || "Badr Adventures <onboarding@resend.dev>";
}

function ionosFromAddress(): string {
  return (
    process.env.IONOS_SMTP_FROM ||
    process.env.IONOS_SMTP_USER ||
    adminEmail()
  );
}

async function sendViaResend(input: {
  subject: string;
  body: string;
  fromName: string;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromAddress(),
      to: [adminEmail()],
      subject: input.subject,
      text: input.body,
      reply_to: input.replyTo,
    }),
  });
  if (!res.ok) {
    console.error("[email] Resend failed", res.status, await res.text());
    return false;
  }
  return true;
}

let cachedSmtpTransporter: Transporter | null = null;
function getSmtpTransporter(): Transporter {
  if (cachedSmtpTransporter) return cachedSmtpTransporter;
  cachedSmtpTransporter = nodemailer.createTransport({
    host: process.env.IONOS_SMTP_HOST || "smtp.ionos.co.uk",
    port: Number(process.env.IONOS_SMTP_PORT ?? 587),
    secure: Number(process.env.IONOS_SMTP_PORT ?? 587) === 465,
    requireTLS: true,
    auth: {
      user: process.env.IONOS_SMTP_USER!,
      pass: process.env.IONOS_SMTP_PASSWORD!,
    },
    connectionTimeout: 15_000,
    socketTimeout: 15_000,
  });
  return cachedSmtpTransporter;
}

async function sendViaIonosSmtp(input: {
  subject: string;
  body: string;
  fromName: string;
  replyTo?: string;
}): Promise<boolean> {
  const from = ionosFromAddress();
  const to = adminEmail();
  console.log(`[email] IONOS SMTP: sending to ${to} from ${from}`);
  try {
    const info = await getSmtpTransporter().sendMail({
      from: `${input.fromName} <${from}>`,
      to,
      subject: input.subject,
      text: input.body,
      replyTo: input.replyTo,
    });
    console.log("[email] IONOS SMTP: accepted by server", {
      messageId: info.messageId,
      response: info.response,
    });
    return true;
  } catch (err) {
    console.error(
      "[email] IONOS SMTP failed",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

export async function sendContactEmail(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<{
  delivered: boolean;
  transport: "smtp" | "resend" | "stored";
}> {
  const subject =
    input.subject?.trim() || `New contact form message from ${input.name}`;
  const body = [
    `From: ${input.name} <${input.email}>`,
    `Subject: ${subject}`,
    "",
    input.message,
    "",
    "— Sent from the Badr Adventures website contact form.",
  ].join("\n");

  // Prefer SMTP so the message lands in the IMAP inbox.
  if (isIonosSmtpConfigured()) {
    const ok = await sendViaIonosSmtp({
      subject,
      body,
      fromName: input.name,
      replyTo: input.email,
    });
    if (ok) return { delivered: true, transport: "smtp" };
  }

  if (isResendConfigured()) {
    const ok = await sendViaResend({
      subject,
      body,
      fromName: "Badr Adventures Contact",
      replyTo: input.email,
    });
    if (ok) return { delivered: true, transport: "resend" };
  }
  return { delivered: false, transport: "stored" };
}
