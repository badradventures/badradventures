// Sitemap and robots.txt endpoints. These bypass the React app so that
// search engines and the new bots.txt fetcher can rely on a stable
// text/xml response.

import type { Context } from "hono";
import { Hono } from "hono";
import { listAllHikes, listAllEquipment } from "../../backend-lib/db";
import "./_shared/load-env";

const app = new Hono();

const SITE_URL = "https://badradventures.co.uk";

// Static routes. Lastmod is a stable build-time value; we don't have a real
// "last content change" per page and Google ignores roughly-equal dates
// across pages, so this is fine.
const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/hikes", changefreq: "weekly", priority: 0.9 },
  { path: "/rent", changefreq: "weekly", priority: 0.9 },
  { path: "/about", changefreq: "monthly", priority: 0.6 },
  { path: "/contact", changefreq: "monthly", priority: 0.5 },
  { path: "/privacy", changefreq: "yearly", priority: 0.2 },
  { path: "/cookies", changefreq: "yearly", priority: 0.2 },
];

const today = () => new Date().toISOString().slice(0, 10);

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, opts: { lastmod?: string; changefreq?: string; priority?: number }): string {
  const parts = [`  <url>`, `    <loc>${xmlEscape(loc)}</loc>`];
  if (opts.lastmod) parts.push(`    <lastmod>${opts.lastmod}</lastmod>`);
  if (opts.changefreq) parts.push(`    <changefreq>${opts.changefreq}</changefreq>`);
  if (opts.priority !== undefined) parts.push(`    <priority>${opts.priority.toFixed(1)}</priority>`);
  parts.push(`  </url>`);
  return parts.join("\n");
}

app.get("/sitemap.xml", async (c) => {
  const last = today();
  const urls: string[] = [];

  for (const r of STATIC_ROUTES) {
    urls.push(urlEntry(`${SITE_URL}${r.path}`, {
      lastmod: last,
      changefreq: r.changefreq,
      priority: r.priority,
    }));
  }

  // Dynamic hike pages.
  try {
    const hikes = await listAllHikes();
    for (const h of hikes) {
      urls.push(urlEntry(`${SITE_URL}/hikes/${h.id}`, {
        lastmod: last,
        changefreq: "weekly",
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error("[sitemap] listAllHikes failed:", err);
  }

  // Equipment detail pages (if any).
  try {
    const items = await listAllEquipment();
    for (const item of items) {
      urls.push(urlEntry(`${SITE_URL}/rent#${item.id}`, {
        lastmod: last,
        changefreq: "weekly",
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error("[sitemap] listAllEquipment failed:", err);
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});

app.get("/robots.txt", (c) => {
  const text = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /sign-in",
    "Disallow: /sign-up",
    "Disallow: /cart",
    "Disallow: /bookings",
    "Disallow: /account",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
});

type NetlifyEventV1 = {
  httpMethod: string;
  path: string;
  rawUrl?: string;
  queryStringParameters?: Record<string, string | undefined> | null;
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
};

function toRequestFromV1Event(event: NetlifyEventV1): Request {
  const url = event.rawUrl || `https://netlify.local${event.path}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(event.headers ?? {})) {
    if (v != null) headers.set(k, v);
  }
  const init: RequestInit = { method: event.httpMethod, headers };
  if (
    event.body !== undefined &&
    event.body !== null &&
    event.httpMethod !== "GET" &&
    event.httpMethod !== "HEAD"
  ) {
    init.body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : event.body;
  }
  return new Request(url, init);
}

export default async (event: Request | NetlifyEventV1): Promise<Response> => {
  const req = event instanceof Request ? event : toRequestFromV1Event(event);
  return app.fetch(req);
};