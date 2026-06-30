import { Hono } from "hono";
import { mountRoutes } from "../../backend-lib/routes";
import "./_shared/load-env";
// The backend module reads process.env at import time (e.g. supabase.ts
// builds its client lazily, but routes.ts checks things like isStripeConfigured
// at request time, and the SUPABASE_URL/SERVICE_ROLE_KEY pair is validated
// on first supabaseAdmin() call). Re-exporting mountRoutes triggers all
// the right initialisation.
const app = new Hono();
mountRoutes(app);
// The function handler is the default export. Netlify Functions v2 calls
// it with a Request; `netlify dev` (v1 runner) calls it with an event
// object. Detect by duck-typing on `event instanceof Request`.
export default async (event) => {
    try {
        const req = event instanceof Request
            ? event
            : toRequestFromV1Event(event);
        return await app.fetch(req);
    }
    catch (err) {
        console.error("[netlify] unhandled error in /api handler:", err);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
};
function toRequestFromV1Event(event) {
    const url = event.rawUrl ||
        buildUrl(event.path, event.queryStringParameters ?? {});
    const headers = new Headers();
    for (const [k, v] of Object.entries(event.headers ?? {})) {
        if (v == null)
            continue;
        headers.set(k, v);
    }
    const init = {
        method: event.httpMethod,
        headers,
    };
    if (event.body !== undefined &&
        event.body !== null &&
        event.httpMethod !== "GET" &&
        event.httpMethod !== "HEAD") {
        if (event.isBase64Encoded) {
            init.body = Buffer.from(event.body, "base64");
        }
        else {
            init.body = event.body;
        }
    }
    return new Request(url, init);
}
function buildUrl(path, query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
        if (v != null && v !== "")
            qs.set(k, v);
    }
    const q = qs.toString();
    // Hono only reads URL components, not the origin, so a synthetic URL
    // with a placeholder host works for routing.
    return `https://netlify.local${path}${q ? `?${q}` : ""}`;
}
