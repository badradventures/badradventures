// Sitemap, robots.txt, and secondary sitemaps. These bypass the React app
// so that search engines can rely on a stable text/xml response.
//
// Endpoints:
//   GET /sitemap.xml            -> main sitemap index
//   GET /sitemap-static.xml     -> static pages
//   GET /sitemap-hikes.xml      -> dynamic hike pages
//   GET /sitemap-equipment.xml  -> dynamic equipment pages
//   GET /robots.txt             -> robots policy + sitemap location

import type { Context } from "hono";
import { Hono } from "hono";
import { listAllHikes, listAllEquipment } from "../../backend-lib/db";
import "./_shared/load-env";

const app = new Hono();

const SITE_URL = "https://badradventures.co.uk";

// Static routes. Hike/equipment indexes are separate so they can have their
// own lastmod frequencies (hikes change weekly as dates get added).
const STATIC_ROUTES: Array<{ path: string; changefreq: string; priority: number }> = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/muslim-hiking", changefreq: "weekly", priority: 1.0 },
  { path: "/muslim-hiking/uk", changefreq: "weekly", priority: 0.9 },
  { path: "/blog", changefreq: "weekly", priority: 0.9 },
  { path: "/hikes", changefreq: "weekly", priority: 0.9 },
  { path: "/rent", changefreq: "weekly", priority: 0.9 },
  { path: "/about", changefreq: "monthly", priority: 0.6 },
  { path: "/contact", changefreq: "monthly", priority: 0.5 },
  { path: "/privacy", changefreq: "yearly", priority: 0.2 },
  { path: "/cookies", changefreq: "yearly", priority: 0.2 },
  { path: "/terms", changefreq: "yearly", priority: 0.2 },
  { path: "/refund", changefreq: "yearly", priority: 0.2 },
];

// ============================================================================

interface BlogPostEntry {
  slug: string;
  lastmod: string; // YYYY-MM-DD
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: number;
}

const BLOG_POSTS: BlogPostEntry[] = [
  {
    slug: "muslim-hiking-uk-complete-guide",
    lastmod: "2026-07-01",
    changefreq: "monthly",
    priority: 0.9,
  },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(
  loc: string,
  opts: { lastmod?: string; changefreq?: string; priority?: number; image?: string },
): string {
  const parts = [`  <url>`, `    <loc>${xmlEscape(loc)}</loc>`];
  if (opts.lastmod) parts.push(`    <lastmod>${opts.lastmod}</lastmod>`);
  if (opts.changefreq) parts.push(`    <changefreq>${opts.changefreq}</changefreq>`);
  if (opts.priority !== undefined)
    parts.push(`    <priority>${opts.priority.toFixed(1)}</priority>`);
  // Add hreflang so Google can clearly see the English-GB targeting.
  parts.push(`    <xhtml:link rel="alternate" hreflang="en-GB" href="${xmlEscape(loc)}" />`);
  if (opts.image) {
    parts.push(`    <image:image>`);
    parts.push(`      <image:loc>${xmlEscape(opts.image)}</image:loc>`);
    parts.push(`    </image:image>`);
  }
  parts.push(`  </url>`);
  return parts.join("\n");
}

function buildUrlset(entries: string[]): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset\n` +
    `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `  xmlns:xhtml="http://www.w3.org/1999/xhtml"\n` +
    `  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    entries.join("\n") +
    `\n</urlset>\n`
  );
}

const COMMON_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
};

app.get("/sitemap.xml", (c) => {
  // Sitemap index referencing the per-section sitemaps.
  const last = today();
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <sitemap>\n` +
    `    <loc>${SITE_URL}/sitemap-static.xml</loc>\n` +
    `    <lastmod>${last}</lastmod>\n` +
    `  </sitemap>\n` +
    `  <sitemap>\n` +
    `    <loc>${SITE_URL}/sitemap-hikes.xml</loc>\n` +
    `    <lastmod>${last}</lastmod>\n` +
    `  </sitemap>\n` +
    `  <sitemap>\n` +
    `    <loc>${SITE_URL}/sitemap-equipment.xml</loc>\n` +
    `    <lastmod>${last}</lastmod>\n` +
    `  </sitemap>\n` +
    `  <sitemap>\n` +
    `    <loc>${SITE_URL}/sitemap-blog.xml</loc>\n` +
    `    <lastmod>${last}</lastmod>\n` +
    `  </sitemap>\n` +
    `</sitemapindex>\n`;
  return new Response(xml, { status: 200, headers: COMMON_HEADERS });
});

app.get("/sitemap-static.xml", (c) => {
  const last = today();
  const entries = STATIC_ROUTES.map((r) =>
    urlEntry(`${SITE_URL}${r.path}`, {
      lastmod: last,
      changefreq: r.changefreq,
      priority: r.priority,
    }),
  );
  return new Response(buildUrlset(entries), { status: 200, headers: COMMON_HEADERS });
});

app.get("/sitemap-hikes.xml", async (c) => {
  const last = today();
  const entries: string[] = [];
  entries.push(
    urlEntry(`${SITE_URL}/hikes`, { lastmod: last, changefreq: "daily", priority: 0.9 }),
  );
  try {
    const hikes = await listAllHikes();
    for (const h of hikes) {
      // Prefer hike.date for lastmod when it's a valid future-ish date.
      const hikeDate = h.date ? new Date(h.date) : null;
      const lastmod =
        hikeDate && !isNaN(hikeDate.getTime())
          ? hikeDate.toISOString().slice(0, 10)
          : last;
      const image = h.hero || h.image
        ? (h.hero || h.image).startsWith("http")
          ? (h.hero || h.image)
          : `${SITE_URL}${h.hero || h.image}`
        : undefined;
      entries.push(
        urlEntry(`${SITE_URL}/hikes/${h.id}`, {
          lastmod,
          changefreq: "weekly",
          priority: 0.8,
          image,
        }),
      );
    }
  } catch (err) {
    console.error("[sitemap] listAllHikes failed:", err);
  }
  return new Response(buildUrlset(entries), { status: 200, headers: COMMON_HEADERS });
});

app.get("/sitemap-equipment.xml", async (c) => {
  const last = today();
  const entries: string[] = [];
  entries.push(
    urlEntry(`${SITE_URL}/rent`, { lastmod: last, changefreq: "weekly", priority: 0.9 }),
  );
  try {
    const items = await listAllEquipment();
    for (const item of items) {
      // Equipment has no dedicated /rent/:id page yet, so we use hash-fragment
      // linking from the index. When a real detail page exists, switch to
      // /equipment/${item.id}.
      const image = item.image
        ? item.image.startsWith("http")
          ? item.image
          : `${SITE_URL}${item.image}`
        : undefined;
      entries.push(
        urlEntry(`${SITE_URL}/rent#${item.id}`, {
          lastmod: last,
          changefreq: "weekly",
          priority: 0.7,
          image,
        }),
      );
    }
  } catch (err) {
    console.error("[sitemap] listAllEquipment failed:", err);
  }
  return new Response(buildUrlset(entries), { status: 200, headers: COMMON_HEADERS });
});

app.get("/sitemap-blog.xml", (c) => {
  const entries = BLOG_POSTS.map((p) =>
    urlEntry(`${SITE_URL}/blog/${p.slug}`, {
      lastmod: p.lastmod,
      changefreq: p.changefreq ?? "monthly",
      priority: p.priority ?? 0.7,
    }),
  );
  // Always include the blog index as the first entry.
  entries.unshift(
    urlEntry(`${SITE_URL}/blog`, {
      lastmod: today(),
      changefreq: "weekly",
      priority: 0.9,
    }),
  );
  return new Response(buildUrlset(entries), { status: 200, headers: COMMON_HEADERS });
});

app.get("/robots.txt", (c) => {
  const text = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /account",
    "Disallow: /bookings",
    "Disallow: /bookings/",
    "Disallow: /sign-in",
    "Disallow: /sign-up",
    "Disallow: /cart",
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

// ============================================================================
// Blog posts. Add new posts here as you ship them. Keep newest first.
