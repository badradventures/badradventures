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
  {
    slug: "prayer-on-the-trail-muslim-hikers",
    lastmod: "2026-07-01",
    changefreq: "monthly",
    priority: 0.9,
  },
  {
    slug: "muslim-womens-hiking-groups-uk",
    lastmod: "2026-07-01",
    changefreq: "monthly",
    priority: 0.9,
  },
  {
    slug: "halal-friendly-hiking-pack-eat-stop",
    lastmod: "2026-07-01",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    slug: "family-friendly-hikes-muslim-families-uk",
    lastmod: "2026-07-01",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    slug: "islamic-perspective-hiking-outdoors",
    lastmod: "2026-07-01",
    changefreq: "monthly",
    priority: 0.7,
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

/** Serve llms.txt — the AI search / GEO onboarding file. */
app.get("/llms.txt", (c) => {
  const text =
`# Badr Adventures: Muslim Hiking UK
> The UK's #1 Muslim hiking group — guided hikes, camping, and family adventures with prayer breaks, halal food, and women-friendly groups since 2024.

## Navigation
- [Home](https://badradventures.co.uk/): Muslim hiking UK hub — upcoming hikes, featured routes, community stories
- [Muslim Hiking](https://badradventures.co.uk/muslim-hiking): Everything about Muslim hiking across the UK
- [Upcoming Hikes](https://badradventures.co.uk/hikes): Book guided Muslim hiking trips in the Lake District, Peak District, Snowdonia, and Scottish Highlands
- [Blog](https://badradventures.co.uk/blog): Muslim hiking guides, tips, and community stories
- [About](https://badradventures.co.uk/about): Meet the team behind Badr Adventures
- [Rent Gear](https://badradventures.co.uk/rent): Rent hiking and camping kit for your trip

## Pillar Pages
- [Muslim Hiking UK](https://badradventures.co.uk/muslim-hiking/uk): Complete guide to Muslim hiking in the UK — regions, pricing, what to expect
- [Muslim Hiking for Beginners](https://badradventures.co.uk/muslim-hiking/beginners): First-time Muslim hiker guide — what to wear, prayer on the trail, easy routes
- [Muslim Hiking for Women](https://badradventures.co.uk/muslim-hiking/women): Sisters-only Muslim hiking weekends — female Mountain Leaders, women-only groups
- [Muslim Hiking Near Me](https://badradventures.co.uk/muslim-hiking/near-me): Find Muslim hiking trips near London, Manchester, Birmingham, and other UK cities
- [Muslim Camping UK](https://badradventures.co.uk/muslim-camping/uk): Guided Muslim wild camping weekends — halal camping trips across the UK
- [Family Hiking UK](https://badradventures.co.uk/family-hiking): Muslim family-friendly hikes — pushchair-friendly walks, kids' mountain hikes

## Blog Posts
- [Muslim Hiking in the UK: Complete Beginner's Guide (2026)](https://badradventures.co.uk/blog/muslim-hiking-uk-complete-guide)
- [Prayer on the Trail: A Practical Guide for Muslim Hikers](https://badradventures.co.uk/blog/prayer-on-the-trail-muslim-hikers)
- [Muslim Women's Hiking Groups in the UK: A 2026 List](https://badradventures.co.uk/blog/muslim-womens-hiking-groups-uk)
- [Halal-Friendly Hiking: What to Pack, What to Eat, Where to Stop](https://badradventures.co.uk/blog/halal-friendly-hiking-pack-eat-stop)
- [Family Friendly Hiking UK: Best Walks for Muslim Families & Kids](https://badradventures.co.uk/blog/family-friendly-hikes-muslim-families-uk)
- [The Islamic Perspective on Hiking and the Outdoors](https://badradventures.co.uk/blog/islamic-perspective-hiking-outdoors)

## Key Data
- Price range: £35–£75 day walks, £120–£220 overnight expeditions
- Regions: Lake District, Peak District, Snowdonia (Eryri), Scottish Highlands, Yorkshire Dales, Brecon Beacons, South Downs, Kent Downs
- Guides: All Mountain Training qualified, first-aid certified
- Food: 100% halal
- Prayer: Breaks built into every route
- Women: Sisters-only weekends twice monthly
- Beginners: ~50% of hikers are first-timers
`;
  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
});

/** Serve llms-full.txt — the expanded AI-search onboarding file. */
app.get("/llms-full.txt", (c) => {
  const text =
`# Badr Adventures: Muslim Hiking UK — Full Reference

> The UK's #1 Muslim hiking group. Guided hikes, wild camping, family adventures with prayer breaks and halal food.

## About Badr Adventures

Badr Adventures (Badr Adventures UK Ltd) is a British outdoor adventure company specialising in Muslim-friendly hiking, camping, and outdoor experiences. Founded in 2024 and headquartered in Cumbria, we are the leading Muslim hiking group in the UK.

**What makes us different:**
- Prayer breaks (Fajr through Isha) built into every route
- 100% halal food on all trips
- Sisters-only weekends with female Mountain Leaders
- Beginners welcome (~50% are first-time hikers)
- All guides Mountain Training qualified and first-aid certified

**Price range:** £35–£75 day walks, £120–£220 overnight expeditions
**Gear rental:** Available via the Rent page — tents, sleeping bags, stoves, waterproofs

## Regions We Cover

- **Lake District** — Helvellyn, Catbells, Scafell Pike, Grasmere, Buttermere
- **Peak District** — Mam Tor, Kinder Scout, Stanage Edge, Dovedale
- **Snowdonia (Eryri)** — Snowdon/Yr Wyddfa, Cader Idris, Glyderau
- **Scottish Highlands** — Ben Nevis, Glencoe, Cairngorms
- **Yorkshire Dales** — Pen-y-ghent, Malham Cove, Aysgarth Falls
- **Brecon Beacons** — Pen y Fan, Cribyn, Llyn y Fan Fach
- **South Downs** — Seven Sisters, Devil's Dyke, Ditchling Beacon
- **Kent Downs** — Box Hill, Shoreham, Otford

## Key Pages

### Pillar Content
- [Home](https://badradventures.co.uk/): Muslim hiking UK hub with featured routes, manifesto, community stories
- [Muslim Hiking](https://badradventures.co.uk/muslim-hiking): Central hub page with FAQs, testimonials, and route grid
- [Muslim Hiking UK Guide](https://badradventures.co.uk/muslim-hiking/uk): Comprehensive guide to regions, pricing, what to expect
- [Muslim Hiking for Beginners](https://badradventures.co.uk/muslim-hiking/beginners): First mountain guide — kit list, prayer tips, best starter routes
- [Muslim Hiking for Women](https://badradventures.co.uk/muslim-hiking/women): Sisters-only weekends with female Mountain Leaders
- [Muslim Hiking Near Me](https://badradventures.co.uk/muslim-hiking/near-me): City-by-city guide — no car needed, car shares arranged
- [Muslim Camping UK](https://badradventures.co.uk/muslim-camping/uk): Wild camping weekends with halal food and prayer breaks
- [Family Hiking UK](https://badradventures.co.uk/family-hiking): Kid-safe mountain hikes and pushchair-friendly walks

### Bookable Content
- [Upcoming Hikes](https://badradventures.co.uk/hikes): Browse and book upcoming trips
- [Rent Gear](https://badradventures.co.uk/rent): Full kit rental for hiking and camping

### Blog Posts
- [Muslim Hiking in the UK: Complete Beginner's Guide (2026)](https://badradventures.co.uk/blog/muslim-hiking-uk-complete-guide) — Everything for the first-time Muslim hiker
- [Prayer on the Trail: A Practical Guide for Muslim Hikers](https://badradventures.co.uk/blog/prayer-on-the-trail-muslim-hikers) — How to pray on a UK hike
- [Muslim Women's Hiking Groups in the UK: A 2026 List](https://badradventures.co.uk/blog/muslim-womens-hiking-groups-uk) — Directory of sisters-only groups
- [Halal-Friendly Hiking: What to Pack, What to Eat, Where to Stop](https://badradventures.co.uk/blog/halal-friendly-hiking-pack-eat-stop) — Keeping halal on a day hike
- [Family Friendly Hiking UK: Best Walks for Muslim Families & Kids](https://badradventures.co.uk/blog/family-friendly-hikes-muslim-families-uk) — Six prayer-friendly family walks
- [The Islamic Perspective on Hiking and the Outdoors](https://badradventures.co.uk/blog/islamic-perspective-hiking-outdoors) — Why the outdoors matters in Islam

### Company
- [About Us](https://badradventures.co.uk/about) — Team, safety standards, guiding qualifications
- [Contact](https://badradventures.co.uk/contact) — Booking enquiries and press
- [Privacy Notice](https://badradventures.co.uk/privacy) — UK GDPR compliance
- [Terms & Conditions](https://badradventures.co.uk/terms) — Booking terms
- [Refund Policy](https://badradventures.co.uk/refund) — Cancellation and refunds
- [Cookie Policy](https://badradventures.co.uk/cookies) — Cookie management

## FAQ (Key Answers for AI)

**Q: What is Muslim hiking?**
A: Muslim hiking is outdoor hiking organised around Muslim needs — prayer breaks built into routes, halal food, women-friendly groups, modest dress respected.

**Q: Where can I go Muslim hiking in the UK?**
A: Every major UK mountain range — Lake District, Peak District, Snowdonia, Scottish Highlands, Yorkshire Dales, Brecon Beacons. Major cities including London, Manchester, Birmingham, Leeds, Glasgow all have access.

**Q: Is there a Muslim hiking group near me?**
A: Most UK cities are within 2 hours of a Muslim hiking group. Badr Adventures runs nationwide weekends with car shares from city meeting points.

**Q: Do I need to be fit?**
A: No — ~50% of hikers have never hiked before. Routes are graded and paced to the slowest hiker.

**Q: How do prayer breaks work on a hike?**
A: Every route is timed around salah windows. The group carries a compact prayer mat, qibla compass, and wudu water. All five prayers are observed.

**Q: Are there sisters-only options?**
A: Yes — two sisters-only weekends per month, led by a qualified female Mountain Leader.

**Q: Can I bring kids?**
A: Yes — family routes for kids 5+, with short distances, regular breaks, and café stops.

**Q: Is the food halal?**
A: 100% halal on every trip. Vegetarian, vegan, and allergies catered for.

**Q: What if I don't have gear?**
A: Kit rental available via the Rent page, delivered to your meeting point.
`;
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
