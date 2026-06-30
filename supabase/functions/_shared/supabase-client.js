// Shared Supabase admin client for edge functions.
// Uses SERVICE_ROLE_KEY from environment (set via supabase secrets).
import { createClient } from "npm:@supabase/supabase-js@2";
let _admin = null;
export function supabaseAdmin() {
    if (_admin)
        return _admin;
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
        throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    }
    _admin = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    return _admin;
}
export function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type, stripe-signature",
    };
}
