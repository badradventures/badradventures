// Scheduled GDPR cleanup edge function.
//
// Deletes contact messages older than the configured threshold (default 365 days).
// Designed to run on a cron schedule via Supabase's cron trigger:
//   SELECT cron.schedule('cleanup-old-messages', '0 3 * * 0', -- weekly at 3am Sunday
//     $$ UPDATE supabase_functions.hooks SET -- or use: SELECT net.http_post(...)
//     $$);
//
// Or trigger directly via HTTP with { olderThanDays }.
//
// Env vars:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   CRON_SECRET              (optional — if set, requests must include Authorization: Bearer <secret>)
//   DEFAULT_CLEANUP_DAYS     (optional, default 365)

Deno.serve(async (req) => {
  try {
    // Auth check if CRON_SECRET is configured (prevents public trigger)
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret) {
      const auth = req.headers.get("authorization") || "";
      if (auth !== `Bearer ${cronSecret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    let olderThanDays = parseInt(
      Deno.env.get("DEFAULT_CLEANUP_DAYS") || "365",
      10,
    );

    // Allow override via request body
    if (req.method === "POST") {
      try {
        const body = await req.json().catch(() => ({})) as Record<string, unknown>;
        if (typeof body.olderThanDays === "number") {
          olderThanDays = body.olderThanDays;
        }
      } catch {
        // ignore
      }
    }

    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

    console.log(
      `[scheduled-cleanup] deleting contact_messages older than ${olderThanDays} days (before ${new Date(cutoff).toISOString()})`,
    );

    // Import supabase client — lazy so it only throws if env vars are missing
    const { supabaseAdmin } = await import("../_shared/supabase-client.ts");
    const admin = supabaseAdmin();

    const { data, error } = await admin
      .from("contact_messages")
      .delete()
      .lt("created_at", cutoff);

    if (error) {
      console.error("[scheduled-cleanup] delete error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // data might be a count or the rows depending on Supabase version
    const deleted = Array.isArray(data) ? data.length : (data as { count?: number })?.count ?? 0;

    console.log(`[scheduled-cleanup] deleted ${deleted} messages`);

    return new Response(
      JSON.stringify({ ok: true, deletedMessages: deleted, olderThanDays }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[scheduled-cleanup] unhandled error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
