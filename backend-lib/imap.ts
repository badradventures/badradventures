// IMAP client for the enquiries@badradventures.co.uk inbox (IONOS).
//
// Netlify Functions run on AWS Lambda, so we can't hold a long-lived IMAP
// connection. Every public function in this module opens a fresh connection,
// runs the requested operation, and closes the connection in a `finally`.
// Re-connecting per request is slow but predictable on Lambda; the enquiry
// inbox is low-volume so the trade-off is fine.
//
// Configuration (set in the Netlify dashboard under "Environment variables"):
//   IONOS_IMAP_HOST  - default imap.ionos.co.uk
//   IONOS_IMAP_PORT  - default 993
//   IONOS_IMAP_USER  - default enquiries@badradventures.co.uk
//   IONOS_IMAP_PASSWORD - required
//
// If the password is missing, every public function throws a clear error
// that the admin UI can surface ("IMAP not configured").

import { ImapFlow, type ImapFlowOptions, type FetchMessageObject } from "imapflow";
import { simpleParser, type AddressObject, type ParsedMail } from "mailparser";

const DEFAULT_HOST = "imap.ionos.co.uk";
const DEFAULT_PORT = 993;
const DEFAULT_USER = "enquiries@badradventures.co.uk";
// IONOS caps the time we'll wait for a connection. 15s is enough for a
// healthy TLS handshake; we don't want a hung server to keep a Lambda warm.
const DEFAULT_TIMEOUT = 15_000;

export type ImapConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  timeout: number;
};

export function imapConfig(): ImapConfig {
  const password = (process.env.IONOS_IMAP_PASSWORD ?? "").trim();
  if (!password) {
    throw new Error(
      "IMAP is not configured. Set IONOS_IMAP_PASSWORD in the environment.",
    );
  }
  return {
    host: (process.env.IONOS_IMAP_HOST ?? DEFAULT_HOST).trim() || DEFAULT_HOST,
    port: Number(process.env.IONOS_IMAP_PORT ?? DEFAULT_PORT) || DEFAULT_PORT,
    user:
      (process.env.IONOS_IMAP_USER ?? DEFAULT_USER).trim() || DEFAULT_USER,
    password,
    timeout: Number(process.env.IONOS_IMAP_TIMEOUT ?? DEFAULT_TIMEOUT) || DEFAULT_TIMEOUT,
  };
}

export function isImapConfigured(): boolean {
  return Boolean((process.env.IONOS_IMAP_PASSWORD ?? "").trim());
}

type ImapLogger = ImapFlowOptions["logger"];

const silentLogger: ImapLogger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

// `withClient` runs a callback with a freshly-logged-in ImapFlow client, then
// always logs out and closes the socket — even if the callback throws. We
// only open the INBOX mailbox by default because that's where the
// enquiries land; call `client.mailboxOpen("Other")` inside the callback if
// you need a different folder.
export async function withClient<T>(
  fn: (client: ImapFlow) => Promise<T>,
  opts?: { mailbox?: string },
): Promise<T> {
  const cfg = imapConfig();
  const client = new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: true, // IONOS requires SSL on 993
    auth: { user: cfg.user, pass: cfg.password },
    logger: silentLogger,
    // Disable IDLE — we're not holding a long-lived connection.
    disableAutoEnable: true,
    tls: { rejectUnauthorized: true },
    // Slight QoS settings: keep the connection tight.
    socketTimeout: cfg.timeout,
    greetingTimeout: cfg.timeout,
  });
  try {
    await client.connect();
    const lock = await client.getMailboxLock(opts?.mailbox ?? "INBOX");
    try {
      return await fn(client);
    } finally {
      lock.release();
    }
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore — best-effort close
    }
  }
}

// ---------- shape returned to the admin UI ----------

export type InboxMessage = {
  uid: number;
  seq: number;
  from: string;
  fromName: string | null;
  to: string;
  subject: string;
  date: string; // ISO
  preview: string;
  seen: boolean;
  flagged: boolean;
  answered: boolean;
  hasAttachments: boolean;
  sizeBytes: number;
};

export type InboxMessageFull = InboxMessage & {
  html: string | null;
  text: string | null;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
  messageId: string | null;
  references: string[];
  rawHeaders: Array<{ name: string; value: string }>;
};

export type InboxSummary = {
  total: number;
  unread: number;
  flagged: number;
};

// IMAP `Date` is the internal receive date; `envelope.date` is the Date
// header from the sender. We surface the latter for the list view (it's
// what users expect) and use the former as a stable sort key.
async function fetchMessage(
  client: ImapFlow,
  uid: number,
  options: { envelopeOnly?: boolean } = {},
): Promise<InboxMessage | InboxMessageFull> {
  // Range syntax: "UID" returns the message addressed by that UID.
  const result = await client.fetchOne(
    String(uid),
    {
      uid: true,
      envelope: true,
      flags: true,
      internalDate: true,
      size: true,
      bodyStructure: true,
      ...(options.envelopeOnly ? {} : { source: true }),
    },
    { uid: true },
  );
  if (!result) {
    throw new Error(`Message ${uid} not found.`);
  }
  return result as never;
}

function buildAddressList(addrs: AddressObject | AddressObject[] | undefined): string {
  if (!addrs) return "";
  const list = Array.isArray(addrs) ? addrs : [addrs];
  return list
    .flatMap((a) => a.value ?? [])
    .map((v) => (v.name ? `${v.name} <${v.address}>` : v.address))
    .join(", ");
}

function buildFirstAddress(addrs: AddressObject | AddressObject[] | undefined): string {
  if (!addrs) return "";
  const list = Array.isArray(addrs) ? addrs : [addrs];
  const first = list[0];
  if (!first) return "";
  const v = first.value?.[0];
  if (!v) return "";
  return v.address ?? "";
}

function buildFirstName(addrs: AddressObject | AddressObject[] | undefined): string | null {
  if (!addrs) return null;
  const list = Array.isArray(addrs) ? addrs : [addrs];
  const v = list[0]?.value?.[0];
  return v?.name ?? null;
}

function buildPreview(text: string, max = 200): string {
  const normalised = text.replace(/\s+/g, " ").trim();
  return normalised.length > max ? `${normalised.slice(0, max)}…` : normalised;
}

// ---------- public functions ----------

export async function getInboxSummary(): Promise<InboxSummary> {
  return withClient(async (client) => {
    const status = await client.status("INBOX", { messages: true, unseen: true });
    const flaggedStatus = await client.search({ flagged: true });
    return {
      total: typeof status.messages === "number" ? status.messages : 0,
      unread: typeof status.unseen === "number" ? status.unseen : 0,
      flagged: Array.isArray(flaggedStatus) ? flaggedStatus.length : 0,
    };
  });
}

export async function listInboxMessages(opts: {
  mailbox?: string;
  limit?: number;
  cursor?: number | null;
  unreadOnly?: boolean;
  search?: string;
}): Promise<{
  messages: InboxMessage[];
  nextCursor: number | null;
}> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  return withClient(
    async (client) => {
      const search = buildSearch({
        before: opts.cursor ?? null,
        unreadOnly: Boolean(opts.unreadOnly),
        searchText: opts.search?.trim() || null,
      });
      // Sort by arrival date descending (newest first). UID order on most
      // servers equals arrival order, but `search` returns UIDs out of order
      // so we sort explicitly.
      const uids = (await client.search(search)) as number[] | false;
      if (!uids || uids.length === 0) {
        return { messages: [], nextCursor: null };
      }
      uids.sort((a, b) => a - b);
      const ordered = uids.slice(-limit).reverse();
      const fetcher = client.fetch(
        ordered.join(","),
        {
          uid: true,
          envelope: true,
          flags: true,
          internalDate: true,
          size: true,
          bodyStructure: true,
        },
        { uid: true },
      );
      const messages: InboxMessage[] = [];
      for await (const msg of fetcher) {
        messages.push(envelopeToMessage(msg));
      }
      const oldestShown = messages.length > 0 ? messages[messages.length - 1].uid : null;
      const nextCursor = messages.length === limit ? oldestShown : null;
      return { messages, nextCursor };
    },
    { mailbox: opts.mailbox },
  );
}

export async function getInboxMessage(uid: number): Promise<InboxMessageFull> {
  return withClient(async (client) => {
    const msg = (await client.fetchOne(
      String(uid),
      {
        uid: true,
        envelope: true,
        flags: true,
        internalDate: true,
        size: true,
        bodyStructure: true,
        source: true,
      },
      { uid: true },
    )) as ImapFlowFetched | null;
    if (!msg) throw new Error(`Message ${uid} not found.`);
    return await fullMessageFromFetched(client, msg);
  });
}

type ImapFlowFetched = FetchMessageObject;

function envelopeToMessage(msg: ImapFlowFetched): InboxMessage {
  const flags = msg.flags ?? new Set<string>();
  const env = msg.envelope ?? {};
  const from = env.from?.[0];
  const fromName = from?.name ?? null;
  const fromAddress = from?.address ?? "";
  const preview = "";
  return {
    uid: msg.uid,
    seq: msg.seq,
    from: fromAddress,
    fromName: fromAddress
      ? fromName
        ? `${fromName} <${fromAddress}>`
        : fromAddress
      : "",
    to: buildAddressList(env.to as AddressObject | AddressObject[] | undefined),
    subject: env.subject ?? "(no subject)",
    date: (env.date instanceof Date ? env.date : msg.internalDate instanceof Date ? msg.internalDate : new Date()).toISOString(),
    preview,
    seen: flags.has("\\Seen"),
    flagged: flags.has("\\Flagged"),
    answered: flags.has("\\Answered"),
    hasAttachments: detectAttachments(msg.bodyStructure),
    sizeBytes: msg.size ?? 0,
  };
}

function detectAttachments(bs: unknown): boolean {
  if (!bs || typeof bs !== "object") return false;
  const node = bs as { disposition?: string; type?: string; childNodes?: unknown[]; parameter?: Record<string, string> };
  if (typeof node.disposition === "string" && /attachment/i.test(node.disposition)) return true;
  if (node.parameter?.filename) return true;
  if (Array.isArray(node.childNodes)) {
    return node.childNodes.some((c) => detectAttachments(c));
  }
  return false;
}

async function fullMessageFromFetched(
  client: ImapFlow,
  msg: ImapFlowFetched,
): Promise<InboxMessageFull> {
  // We need the raw RFC822 source to feed mailparser. We may have already
  // fetched it inline; if not, re-fetch.
  let raw: Buffer | undefined = msg.source;
  if (!raw) {
    raw = (await client.download(String(msg.uid), undefined, { uid: true })) as unknown as Buffer;
  }
  const parsed: ParsedMail = await simpleParser(raw);
  const summary = envelopeToMessage(msg);
  // Build preview from text body if available, otherwise strip HTML.
  const previewSource = parsed.text || stripHtml(parsed.html || "") || "";
  const references = Array.isArray(parsed.references)
    ? parsed.references
    : typeof parsed.references === "string"
      ? [parsed.references]
      : [];
  const cc = parsed.cc ? buildAddressList(parsed.cc as AddressObject | AddressObject[]) : "";
  const to = parsed.to
    ? buildAddressList(parsed.to as AddressObject | AddressObject[])
    : summary.to;
  return {
    ...summary,
    preview: buildPreview(previewSource, 240),
    from: parsed.from
      ? buildFirstAddress(parsed.from as AddressObject | AddressObject[])
      : summary.from,
    fromName: parsed.from
      ? buildFirstName(parsed.from as AddressObject | AddressObject[])
      : summary.fromName,
    to: [to, cc].filter(Boolean).join(", "),
    html: typeof parsed.html === "string" ? parsed.html : null,
    text: parsed.text || null,
    attachments: (parsed.attachments ?? []).map((a) => ({
      filename: a.filename || "attachment",
      contentType: a.contentType || "application/octet-stream",
      size: a.size || 0,
    })),
    messageId: parsed.messageId || null,
    references,
    rawHeaders: collectHeaders(parsed.headers),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function collectHeaders(
  headers: Map<string, string | string[]> | undefined,
): Array<{ name: string; value: string }> {
  if (!headers) return [];
  const out: Array<{ name: string; value: string }> = [];
  headers.forEach((value, name) => {
    if (name.toLowerCase() === "from" || name.toLowerCase() === "to") return;
    const v = Array.isArray(value) ? value.join(", ") : value;
    out.push({ name, value: v });
  });
  return out;
}

type SearchCriteria = Record<string, unknown>;

function buildSearch(opts: {
  before: number | null;
  unreadOnly: boolean;
  searchText: string | null;
}): SearchCriteria {
  const criteria: SearchCriteria = {};
  if (opts.unreadOnly) criteria.seen = false;
  if (opts.searchText) {
    // IMAP `OR` of Subject / From / Body so the same text box works for
    // all three. ESCAPE_QUOTES isn't a thing here; we wrap in quotes so
    // spaces are treated literally.
    criteria.or = [
      { subject: opts.searchText },
      { from: opts.searchText },
      { body: opts.searchText },
    ];
  }
  if (opts.before != null) {
    // UID is monotonically increasing on IONOS (1 = oldest). Cursor of
    // the last message in the previous page; show only older than that.
    criteria.uid = `1:${Math.max(1, opts.before - 1)}`;
  }
  return criteria;
}

// ---------- flag mutations ----------

export async function setMessageSeen(uid: number, seen: boolean): Promise<void> {
  await withClient(async (client) => {
    if (seen) {
      await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
    } else {
      await client.messageFlagsRemove(String(uid), ["\\Seen"], { uid: true });
    }
  });
}

export async function setMessageFlagged(uid: number, flagged: boolean): Promise<void> {
  await withClient(async (client) => {
    if (flagged) {
      await client.messageFlagsAdd(String(uid), ["\\Flagged"], { uid: true });
    } else {
      await client.messageFlagsRemove(String(uid), ["\\Flagged"], { uid: true });
    }
  });
}
