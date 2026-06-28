// Auth helpers. The previous version signed HS256 JWTs and stored them in a
// `badr_session` cookie. We now delegate to Supabase Auth on the client: the
// browser calls `supabase.auth.signInWithPassword` (or signUp) and Supabase
// returns an access token that the client persists in localStorage and
// sends back as `Authorization: Bearer <token>` on every API call.
//
// On the server we verify that Bearer token with the service-role client
// (it can call `auth.getUser(token)` to validate a user access token) and
// load the matching `profiles` row to get the name and admin flag.
//
// The cookie-based session helpers below remain as a thin compatibility
// layer for the Telegram bot and admin back-office flows that still issue
// their own session (the bot doesn't have a browser to put a Supabase
// session in). When called from a route that received a Supabase Bearer
// token, the cookie helpers are unused.

import type { Context } from "hono";
import { supabaseAdmin } from "./supabase";

export const BEARER_PREFIX = "Bearer ";

export class HTTPError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type SessionPayload = {
  sub: string; // Supabase auth user id (uuid)
  email: string;
  name: string;
  isAdmin: boolean;
};

export function isSecureFromContext(c: Context): boolean {
  const url = new URL(c.req.url);
  return url.protocol === "https:";
}

// ---------- Bearer token (Supabase) ----------

export function readBearerToken(c: Context): string | null {
  const h = c.req.header("authorization") || c.req.header("Authorization");
  if (!h || !h.startsWith(BEARER_PREFIX)) return null;
  return h.slice(BEARER_PREFIX.length).trim() || null;
}

export function readBearerSession(c: Context): Promise<SessionPayload | null> {
  const token = readBearerToken(c);
  if (!token) return Promise.resolve(null);
  return sessionFromAccessToken(token);
}

export async function sessionFromAccessToken(
  token: string,
): Promise<SessionPayload | null> {
  // Supabase's getUser verifies the JWT signature, expiry, and audience
  // against the configured JWT secret. It returns the underlying user.
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  const user = data.user;

  // Look up the profile row to get the display name and admin flag.
  // RLS allows the user to read their own profile, but we use the service
  // role here so we always see it regardless of the row's RLS state.
  const { data: profile } = await admin
    .from("profiles")
    .select("name, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const name =
    (profile?.name as string | null | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Member";

  return {
    sub: user.id,
    email: user.email ?? "",
    name,
    isAdmin: Boolean(profile?.is_admin),
  };
}

// ---------- Backwards-compatible cookie helpers ----------
//
// The Telegram admin UI and the success-page `confirm` endpoint used to set
// a `badr_session` cookie. The Supabase browser SDK doesn't need that, but
// a handful of admin/server-to-server flows still issue a session via
// `setSessionCookie` after creating a user. We keep the same API; the
// cookie now stores the Supabase access token instead of a self-signed
// JWT, and `readSessionAsync` validates it.

const COOKIE_NAME = "badr_session";

export function setSessionCookie(c: Context, token: string, secure: boolean) {
  c.header(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax${
      secure ? "; Secure" : ""
    }; Max-Age=${60 * 60 * 24 * 7}`,
  );
}

export function clearSessionCookie(c: Context, secure: boolean) {
  c.header(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax${
      secure ? "; Secure" : ""
    }; Max-Age=0`,
  );
}

export function readSession(c: Context): SessionPayload | null {
  // Synchronous version is best-effort: it cannot await the Supabase
  // verification. Only use it for non-security paths.
  return null;
}

export async function readSessionAsync(
  c: Context,
): Promise<SessionPayload | null> {
  // 1. Bearer header (browser Supabase SDK path).
  const bearer = await readBearerSession(c);
  if (bearer) return bearer;

  // 2. Legacy badr_session cookie (server-to-server/admin flows).
  const raw = c.req.header("cookie") || "";
  const match = raw
    .split(/;\s*/)
    .map((p) => p.split("="))
    .find(([k]) => k === COOKIE_NAME);
  if (!match) return null;
  const token = decodeURIComponent(match.slice(1).join("="));
  return sessionFromAccessToken(token);
}

// ---------- Guards ----------

export async function requireUser(c: Context): Promise<SessionPayload> {
  const session = await readSessionAsync(c);
  if (!session) throw new HTTPError(401, "You need to be signed in.");
  return session;
}

export async function requireAdmin(c: Context): Promise<SessionPayload> {
  const session = await requireUser(c);
  if (!session.isAdmin) throw new HTTPError(403, "Admin access only.");
  return session;
}

// ---------- Server-side user / password helpers ----------
//
// These used to be the implementation of register/login. We now expose
// thin wrappers around the Supabase admin SDK so the rest of the code
// (and the Telegram bot) can still create / delete users with a one-liner.

export async function adminCreateUser(input: {
  email: string;
  password: string;
  fullName: string;
  isAdmin?: boolean;
}): Promise<{ id: string; email: string }> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.fullName },
  });
  if (error || !data.user) {
    throw new HTTPError(
      400,
      error?.message ?? "Could not create user in Supabase.",
    );
  }
  if (input.isAdmin) {
    await admin
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", data.user.id);
  }
  return { id: data.user.id, email: data.user.email ?? input.email };
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const admin = supabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new HTTPError(500, `Could not delete user: ${error.message}`);
  }
}
