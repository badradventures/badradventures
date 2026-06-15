// Centralised Supabase clients for the server.
//
// We use the service-role key for all database access on the server, because
// the API routes already enforce their own auth + authorisation checks (admin
// gates, ownership checks, etc.) and the RLS policies on the database are
// scoped to the authenticated user's id (`auth.uid()`) which we don't have
// at the call site without round-tripping the user's access token through
// the PostgREST client.
//
// The service-role key must NEVER be exposed to the browser. It lives only
// in this server module. Frontend code calls the same API routes it
// always has; it never sees the Supabase URL or key.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

function readConfig(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.",
    );
  }
  return { url, key };
}

export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const { url, key } = readConfig();
  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}

// Lightweight ping for /api/health. Wrapped so the rest of the code can
// catch configuration errors as ordinary 500s instead of crashing the
// request handler.
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

// Reset cached client (useful for tests / hot-reload).
export function _resetSupabaseClient() {
  _admin = null;
}
