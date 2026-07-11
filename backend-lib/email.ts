// Email helpers. Sends contact-form messages to the enquiries inbox so
// they land in the IMAP inbox. Primary transport: Resend (HTML + text).
// Fallback transport: IONOS SMTP. If both fail, persist to Supabase so
// the message is not lost.
import { Resend } from "resend";
import nodemailer, { type Transporter } from "nodemailer";
import { contactMessageInsert } from "./supabase";
import { logEmailFallback } from "./email-log";

const FROM_FALLBACK = "no-reply@badradventures.co.uk";

function adminEmail(): string {
  return (
    process.env.ADMIN_EMAIL || "enquiries@badradventures.co.uk"
  ).toLowerCase();
}

function ionosFromAddress(): string {
  return (process.env.IONOS_SMTP_USER || adminEmail()).toLowerCase();
}

function resendFrom(): string {
  return process.env.RESEND_FROM || FROM_FALLBACK;
}

function hasResend(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function hasIonosSmtp(): boolean {
  return Boolean(
    process.env.IONOS_SMTP_USER && process.env.IONOS_IMAP_PASSWORD,
  );
}

// ---------- IONOS SMTP transport ----------
//
// IONOS requires that the envelope-from address matches the authenticated
// account. We always send "from" the enquiries inbox itself and put the
// customer's name/email in the visible headers + Reply-To.
let cachedSmtpTransporter: Transporter | null = null;
function getSmtpTransporter(): Transporter {
  if (cachedSmtpTransporter) return cachedSmtpTransporter;
  const port = Number(process.env.IONOS_SMTP_PORT ?? 587);
  cachedSmtpTransporter = nodemailer.createTransport({
    host: process.env.IONOS_SMTP_HOST || "smtp.ionos.co.uk",
    port,
    secure: port === 465, // implicit TLS only on 465; 587 uses STARTTLS
    requireTLS: port === 587,
    auth: {
      user: process.env.IONOS_SMTP_USER as string,
      pass: process.env.IONOS_IMAP_PASSWORD as string,
    },
    tls: {
      // IONOS uses a standard cert; if it ever changes, fail open rather
      // than rejecting all mail.
      rejectUnauthorized: true,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
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
      from: `"${input.fromName} via BadRadventures" <${from}>`,
      to,
      subject: input.subject,
      text: input.body,
      replyTo: input.replyTo,
      envelope: {
        from,
        to,
      },
    });
    console.log("[email] IONOS SMTP: accepted by server", {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
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

// ---------- Resend transport ----------
async function sendViaResend(input: {
  subject: string;
  body: string;
  fromName: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const resend = new Resend(apiKey);
  const from = resendFrom();
  const to = adminEmail();
  console.log(`[email] Resend: sending to ${to} from ${from}`);
  const result = await resend.emails.send({
    from: `${input.fromName} via BadRadventures <${from}>`,
    to: [to],
    subject: input.subject,
    text: input.body,
    replyTo: input.replyTo ? [input.replyTo] : undefined,
  });
  if (result.error) {
    console.error("[email] Resend failed", result.error);
    return false;
  }
  console.log("[email] Resend: accepted", { id: result.data?.id });
  return true;
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
  const subject = input.subject || `New enquiry from ${input.name}`;
  const body = [
    `New contact-form submission`,
    ``,
    `From: ${input.name} <${input.email}>`,
    `Subject: ${input.subject ?? "(none)"}`,
    ``,
    input.message,
    ``,
    `— Sent from the BadRadventures website contact form`,
  ].join("\n");

  // 1) IONOS SMTP — puts the message directly in the enquiries IMAP inbox
  if (hasIonosSmtp()) {
    const ok = await sendViaIonosSmtp({
      subject,
      body,
      fromName: input.name,
      replyTo: input.email,
    });
    if (ok) return { delivered: true, transport: "smtp" };
  }

  // 2) Resend fallback
  if (hasResend()) {
    const ok = await sendViaResend({
      subject,
      body,
      fromName: input.name,
      replyTo: input.email,
    });
    if (ok) return { delivered: true, transport: "resend" };
  }

  // 3) Persist to Supabase so nothing is lost
  try {
    await contactMessageInsert({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
    });
    await logEmailFallback({
      reason: "all transports failed",
      name: input.name,
      email: input.email,
    });
  } catch (err) {
    console.error("[email] supabase persist failed", err);
  }
  return { delivered: false, transport: "stored" };
}
