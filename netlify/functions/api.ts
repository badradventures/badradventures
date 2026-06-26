// Single Netlify Function that hosts the entire Hono backend.
//
// Netlify Functions v2 (the current runtime) takes a web-standard Request
// and expects a web-standard Response. Hono's `app.fetch(request)` accepts
// exactly that shape, so we can mount the existing `mountRoutes(app)`
// app (defined in backend-lib/routes.ts) without modifying any of the
// route handlers. We also need to support the v1 event shape so that
// `netlify dev` (which uses the v1 runner) still works.
import type { Context } from "hono";
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

// V1 event shape — used by `netlify dev` and any callers passing the
// legacy AWS-Lambda-ish event object.
type NetlifyEventV1 = {
  httpMethod: string;
  path: string;
  rawUrl?: string;
  queryStringParameters?: Record<string, string | undefined> | null;
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
};

// The function handler is the default export. Netlify Functions v2 calls
// it with a Request; `netlify dev` (v1 runner) calls it with an event
// object. Detect by duck-typing on `event instanceof Request`.
export default async (event: Request | NetlifyEventV1): Promise<Response> => {
  try {
    const req =
      event instanceof Request
        ? event
        : toRequestFromV1Event(event as NetlifyEventV1);
    return await app.fetch(req);
  } catch (err) {
    console.error("[netlify] unhandled error in /api handler:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

function toRequestFromV1Event(event: NetlifyEventV1): Request {
  const url =
    event.rawUrl ||
    buildUrl(event.path, event.queryStringParameters ?? {});

  const headers = new Headers();
  for (const [k, v] of Object.entries(event.headers ?? {})) {
    if (v == null) continue;
    headers.set(k, v);
  }

  const init: RequestInit = {
    method: event.httpMethod,
    headers,
  };
  if (
    event.body !== undefined &&
    event.body !== null &&
    event.httpMethod !== "GET" &&
    event.httpMethod !== "HEAD"
  ) {
    if (event.isBase64Encoded) {
      init.body = Buffer.from(event.body, "base64");
    } else {
      init.body = event.body;
    }
  }
  return new Request(url, init);
}

function buildUrl(
  path: string,
  query: Record<string, string | undefined>,
): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v != null && v !== "") qs.set(k, v);
  }
  const q = qs.toString();
  // Hono only reads URL components, not the origin, so a synthetic URL
  // with a placeholder host works for routing.
  return `https://netlify.local${path}${q ? `?${q}` : ""}`;
}
