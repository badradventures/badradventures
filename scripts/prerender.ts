// Build-time prerender. After `vite build`, walk the routes in
// prerender/config.ts, SSR each one with react-dom/server, extract
// <title>/<meta>/<link>/<script type="application/ld+json"> tags
// from the rendered HTML, and emit a real HTML file per route into
// dist/<route>/index.html (or dist/index.html for the homepage).
//
// This is what makes the site crawlable by Google and AI search
// engines. Without it, every route returns the empty SPA shell.
//
// Run via:  bun run prerender
// Or wired into the build via the `postbuild` script in package.json.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import React, { type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter, Routes, Route } from "react-router-dom";

import { ROUTES, HIDDEN_ROUTES, SITE_BASE } from "../prerender/config";
import { MetaTags, JsonLd } from "../src/lib/seo";
import { organizationJsonLd, websiteJsonLd } from "../src/lib/json-ld";
import { CartProvider } from "../src/lib/cart-context";
import { SiteShell } from "../src/components/site-shell";
import { ThemeProvider } from "../src/components/theme-provider";

const distDir = resolve(process.cwd(), "dist");
const templatePath = join(distDir, "index.html");

type CreateFn = (type: React.ComponentType<unknown>, props: Record<string, unknown> | null, ...children: ReactNode[]) => React.ReactElement;
const ce = React.createElement as unknown as CreateFn;

type AnyComp = React.ComponentType<any>;
const createAny: (type: AnyComp | string, props: any, ...children: ReactNode[]) => React.ReactElement =
  React.createElement as any;
const siteShell = SiteShell as unknown as AnyComp;
const routesComp = Routes as unknown as AnyComp;
const routeComp = Route as unknown as AnyComp;

function buildBodyHtml(route: (typeof ROUTES)[number]): string {
  const pageComp = route.Page as unknown as AnyComp;
  const seoProps = {
    title: route.seo.title,
    description: route.seo.description,
    path: route.path,
    ogType: route.seo.ogType,
    publishedTime: route.seo.publishedTime,
    modifiedTime: route.seo.modifiedTime,
    keywords: route.seo.keywords,
  };

  // React 19 hoists <title> and <meta> out of the wrapping <div>, but
  // leaves <link> and <script> inside. We render the head bits as a
  // list of top-level elements inside a hidden wrapper, then strip
  // every head-worthy tag from the body before injecting into <head>.
  // This avoids the "non-greedy <div>" problem where the strip regex
  // used to stop at the first </div> and leave <link>/<script> behind.
  const headBits: ReactNode[] = [
    React.createElement(MetaTags, { key: "meta", seo: seoProps }),
    ...(route.jsonLd ?? []).map((data, i) =>
      React.createElement(JsonLd, { key: `ld-${i}`, data }),
    ),
    React.createElement(JsonLd, { key: "org", data: organizationJsonLd() }),
    React.createElement(JsonLd, { key: "site", data: websiteJsonLd() }),
  ];
  const headComponents = React.createElement(
    "div",
    { "data-prerender-head": "true", style: { display: "none" } },
    headBits,
  );

  const pageBody = createAny(
    "div",
    { "data-prerender-body": "true" },
    createAny(
      Routes as AnyComp,
      null,
      createAny(Route as AnyComp, {
        key: "home",
        path: "/",
        element: createAny(pageComp, null),
      }),
      // /blog/:slug — useParams reads :slug from the matched route
      createAny(Route as AnyComp, {
        key: "blog-slug",
        path: "/blog/:slug",
        element: createAny(pageComp, null),
      }),
      // /hikes/:id — hike detail pages
      createAny(Route as AnyComp, {
        key: "hike-id",
        path: "/hikes/:id",
        element: createAny(pageComp, null),
      }),
      // Catch-all for static pages (any non-param path)
      createAny(Route as AnyComp, {
        key: "static",
        path: "*",
        element: createAny(pageComp, null),
      }),
    ),
  );

  // Mirror the live App.tsx tree shape so page components get the
  // same providers (ThemeProvider, CartProvider, SiteShell).
  const tree = createAny(
    StaticRouter as AnyComp,
    { location: route.path },
    createAny(
      ThemeProvider as AnyComp,
      { defaultTheme: "light" },
      createAny(
        CartProvider as AnyComp,
        null,
        createAny(
          SiteShell as AnyComp,
          null,
          headComponents,
          pageBody,
        ),
      ),
    ),
  );

  return renderToString(tree);
}

type Extracted = {
  title?: string;
  metaTags: string[];
  links: string[];
  jsonLd: string[];
};

function extractHeadTags(html: string): Extracted {
  const out: Extracted = { metaTags: [], links: [], jsonLd: [] };
  let title: string | undefined;

  // Match each head-worthy tag: <title>...</title>, <meta .../>, <link .../>,
  // and <script type="application/ld+json">...</script>.
  const re =
    /<title[^>]*>[\s\S]*?<\/title>|<meta[^>]*\/?>|<link[^>]*\/?>|<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    if (/^<title/i.test(tag)) {
      title = tag.replace(/<\/?title>/gi, "");
    } else if (/^<script\s+type="application\/ld\+json"/i.test(tag)) {
      out.jsonLd.push(tag);
    } else if (/^<meta/i.test(tag)) {
      out.metaTags.push(tag);
    } else if (/^<link/i.test(tag)) {
      out.links.push(tag);
    }
  }
  out.title = title;
  return out;
}

function injectIntoTemplate(
  template: string,
  head: Extracted,
  bodyHtml: string,
): string {
  // Clear the SPA body for prerendered content. Keep the module script
  // tag so React hydrates on the client and buttons/forms/routing work.
  const rootCleared = template
    .replace(/<title[^>]*>[\s\S]*?<\/title>/i, "")
    .replace(
      /<div\s+id="root"[^>]*>[\s\S]*?<\/div>/i,
      '<div id="root">__PRERENDER_BODY__</div>',
    );

  // Build a new <head> insertion. Place the title first (browsers care
  // about its position), then OG, then JSON-LD last.
  const headTags = [
    head.title ? `<title>${head.title}</title>` : "",
    ...head.metaTags,
    ...head.links,
    ...head.jsonLd,
  ]
    .filter(Boolean)
    .join("\n    ");

  const withHead = rootCleared.replace(
    "</head>",
    `    ${headTags}\n  </head>`,
  );

  return withHead.replace("__PRERENDER_BODY__", bodyHtml);
}

function outputPathFor(routePath: string): string {
  if (routePath === "/") return join(distDir, "index.html");
  if (routePath === "/404") return join(distDir, "404.html");
  return join(distDir, routePath.replace(/^\//, ""), "index.html");
}

async function writeRoute(template: string, route: (typeof ROUTES)[number]) {
  const bodyHtml = buildBodyHtml(route);
  const head = extractHeadTags(bodyHtml);
  // Strip EVERY head-worthy tag from the body before injection. React 19
  // hoists <title>/<meta> out of the wrapping <div> but leaves <link>
  // and <script type="application/ld+json"> nested inside, so the old
  // "non-greedy <div>" strip left duplicates in the body. Stripping all
  // head tags up front is robust and keeps the served HTML clean.
  const headTagPattern =
    /<title[^>]*>[\s\S]*?<\/title>|<meta[^>]*\/?>|<link[^>]*\/?>|<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi;
  const bodyCleaned = bodyHtml.replace(headTagPattern, "");
  // Also drop the now-empty hidden wrapper.
  const visibleBody = bodyCleaned.replace(
    /<div\s+data-prerender-head="true"[^>]*>\s*<\/div>/i,
    "",
  );
  const finalHtml = injectIntoTemplate(template, head, visibleBody);
  const outPath = outputPathFor(route.path);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, finalHtml, "utf8");
  return outPath;
}

async function writeSitemap() {
  const urls = ROUTES.filter(
    (r) => !HIDDEN_ROUTES.has(r.path) && r.path !== "/404",
  ).map((r) => {
    const loc = `${SITE_BASE}${r.path === "/" ? "/" : r.path}`;
    const lastmod = r.seo.modifiedTime ?? r.seo.publishedTime ?? "2026-06-30";
    const changefreq =
      r.path === "/" || r.path === "/blog" ? "weekly" : "monthly";
    const priority = r.path === "/muslim-hiking" || r.path === "/"
      ? "1.0"
      : r.path.startsWith("/muslim-hiking")
        ? "0.9"
        : r.path.startsWith("/blog/")
          ? "0.8"
          : "0.7";
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join("\n") +
    `\n</urlset>\n`;
  await writeFile(join(distDir, "sitemap.xml"), xml, "utf8");
  return join(distDir, "sitemap.xml");
}

async function writeRobots() {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /bookings
Disallow: /bookings/
Disallow: /sign-in
Disallow: /sign-up
Disallow: /cart
Disallow: /api/

# AI search crawlers — explicitly allowed.
User-agent: GPTBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: CCBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: ${SITE_BASE}/sitemap.xml
`;
  await writeFile(join(distDir, "robots.txt"), robots, "utf8");
  return join(distDir, "robots.txt");
}

async function writeLlmsTxt() {
  // llms.txt is a proposed standard for helping LLM crawlers understand
  // a site's structure. See https://llmstxt.org/
  const lines: string[] = [];
  lines.push("# Badr Adventures");
  lines.push("");
  lines.push(
    "> Guided hiking, wild camping and family adventures across the UK's most beautiful landscapes. Badr Adventures is the UK's leading Muslim hiking group, with prayer breaks, halal food, women-friendly groups, and qualified Mountain Training guides.",
  );
  lines.push("");
  lines.push(
    "Badr Adventures runs guided hiking trips across the Lake District, Peak District, Snowdonia (Eryri), Yorkshire Dales, Brecon Beacons, South Downs and the Scottish Highlands. Day walks from £35, overnight weekends from £120.",
  );
  lines.push("");
  lines.push("## Core pages");
  lines.push("");
  lines.push(
    "- [Muslim Hiking UK — the main pillar page](https://badradventures.co.uk/muslim-hiking): the definitive UK guide to Muslim hiking — what's involved, where to go, and how to book.",
  );
  lines.push(
    "- [Muslim Hiking in the UK: A 2026 Guide](https://badradventures.co.uk/muslim-hiking/uk): a longer-form guide focused on the UK specifically, with FAQs about regions, costs, kit, and sisters-only groups.",
  );
  lines.push(
    "- [Upcoming hikes & adventures](https://badradventures.co.uk/hikes): the live calendar of upcoming guided trips.",
  );
  lines.push(
    "- [Muslim Hiking Near Me UK](https://badradventures.co.uk/muslim-hiking/near-me): find Muslim hiking trips near you — London, Manchester, Birmingham, Glasgow and more.",
  );
  lines.push(
    "- [Muslim Hiking for Beginners](https://badradventures.co.uk/muslim-hiking/beginners): start your first UK mountain, from zero to summit, with no experience needed.",
  );
  lines.push(
    "- [Sisters-Only Muslim Hiking UK](https://badradventures.co.uk/muslim-hiking/women): women-only Muslim hiking weekends led by female Mountain Leaders.",
  );
  lines.push(
    "- [About Badr Adventures](https://badradventures.co.uk/about): the team, qualifications, and how the trips are run.",
  );
  lines.push(
    "- [Blog: field notes on Muslim hiking](https://badradventures.co.uk/blog): the latest guides, trail tips and stories.",
  );
  lines.push("");
  lines.push("## Featured blog posts");
  lines.push("");
  lines.push(
    "- [Prayer on the Trail: A Practical Guide for Muslim Hikers](https://badradventures.co.uk/blog/prayer-on-the-trail-muslim-hikers)",
  );
  lines.push(
    "- [Muslim Hiking in the UK: The Complete Beginner's Guide (2026)](https://badradventures.co.uk/blog/muslim-hiking-uk-complete-guide)",
  );
  lines.push(
    "- [Muslim Women's Hiking Groups in the UK: A 2026 List](https://badradventures.co.uk/blog/muslim-womens-hiking-groups-uk)",
  );
  lines.push(
    "- [Halal-Friendly Hiking: What to Pack, What to Eat, Where to Stop](https://badradventures.co.uk/blog/halal-friendly-hiking-pack-eat-stop)",
  );
  lines.push(
    "- [The Best Family-Friendly Hikes for Muslim Families in the UK](https://badradventures.co.uk/blog/family-friendly-hikes-muslim-families-uk)",
  );
  lines.push(
    "- [The Islamic Perspective on Hiking and the Outdoors](https://badradventures.co.uk/blog/islamic-perspective-hiking-outdoors)",
  );
  lines.push("");
  lines.push("## What we offer");
  lines.push("");
  lines.push(
    "- Guided Muslim hiking days and weekends (Lake District, Peak District, Snowdonia, Highlands, Yorkshire Dales, Brecon Beacons, South Downs)",
  );
  lines.push("- Sisters-only and women-friendly Muslim hiking groups");
  lines.push("- Family-friendly Muslim hiking trips (kids from age 5)");
  lines.push(
    "- Hiking and camping kit rental, delivered to your meeting point",
  );
  lines.push("- Beginner-friendly grades 1–3 routes, all year round");
  lines.push(
    "- Qualified Mountain Training guides (Hill and Moorland, Lowland, Winter Mountain Leader)",
  );
  lines.push(
    "- Halal food, prayer breaks, and modest-kit-friendly groups as standard",
  );
  lines.push("");
  lines.push("## Optional");
  lines.push("");
  lines.push("- [Privacy Notice](https://badradventures.co.uk/privacy)");
  lines.push("- [Cookie Policy](https://badradventures.co.uk/cookies)");
  lines.push("- [Terms & Conditions](https://badradventures.co.uk/terms)");
  lines.push("- [Refund Policy](https://badradventures.co.uk/refund)");
  lines.push("");
  lines.push("## Company");
  lines.push("");
  lines.push(
    "Badr Adventures UK Ltd · Company no. 15921546 · Registered office: 106 Castlesteads Drive, Carlisle, CA2 7XD, UK · Email: enquiries@badradventures.co.uk",
  );
  await writeFile(
    join(distDir, "llms.txt"),
    lines.join("\n") + "\n",
    "utf8",
  );
  return join(distDir, "llms.txt");
}

async function main() {
  const template = await readFile(templatePath, "utf8");
  const results: string[] = [];
  for (const route of ROUTES) {
    const out = await writeRoute(template, route);
    console.log(`prerender: ${route.path} -> ${out}`);
    results.push(out);
  }
  const sitemap = await writeSitemap();
  console.log(`prerender: sitemap -> ${sitemap}`);
  const robots = await writeRobots();
  console.log(`prerender: robots  -> ${robots}`);
  const llms = await writeLlmsTxt();
  console.log(`prerender: llms.txt -> ${llms}`);
  console.log(`\nprerender: done. ${results.length} routes written.`);
}

main().catch((err) => {
  console.error("prerender failed:", err);
  process.exit(1);
});
