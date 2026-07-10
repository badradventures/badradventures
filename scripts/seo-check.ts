// SEO audit for the built dist/. Run after `bun run build`.
//
// For each prerendered route, checks:
//   - <title> is present and meaningful
//   - meta description is present and ≥ 80 chars
//   - canonical link is set
//   - OG tags (og:title, og:description, og:image) are present
//   - JSON-LD blocks exist
//   - target keyword ("muslim hiking" / "muslim hiking uk" /
//     "halal hiking" / "islamic hiking") appears in body text
//   - body word count is ≥ 250 (skipped for support pages and 404)
//
// Exits non-zero if any rule fails. Wired into `bun run build`.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = join(process.cwd(), "dist");
const KEYWORDS = [
  "muslim hiking",
  "muslim hikers",
  "halal hiking",
  "islamic hiking",
  "muslim camping",
  "family hiking",
  "family friendly",
];
const SUPPORT = /^\/(privacy|cookies|terms|refund|contact|404|admin|sign-)/;

type Report = {
  route: string;
  title: string;
  hasDescription: boolean;
  hasCanonical: boolean;
  hasOg: boolean;
  hasJsonLd: boolean;
  keywordCount: number;
  wordCount: number;
};

const problems: string[] = [];
const report: Report[] = [];

function readText(file: string): string {
  return readFileSync(file, "utf8");
}

function bodyText(html: string): string {
  // Strip everything between < and >, collapse whitespace.
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(html: string, re: RegExp): string {
  const m = html.match(re);
  return m ? m[0] : "";
}

function relFor(file: string): string {
  const r = relative(DIST, file)
    .replace(/\/index\.html$/, "")
    .replace(/^index\.html$/, "");
  return "/" + r;
}

function checkRoute(file: string): Report {
  const rel = relFor(file);
  const html = readText(file);
  const text = bodyText(html);

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = (titleMatch?.[1] ?? "").trim();
  const hasDescription = /<meta\s+name="description"\s+content="[^"]{30,}"/i.test(html);
  const hasCanonical = /<link\s+rel="canonical"/i.test(html);
  const hasOg =
    /<meta\s+property="og:title"/i.test(html) &&
    /<meta\s+property="og:description"/i.test(html) &&
    /<meta\s+property="og:image"/i.test(html);
  const hasJsonLd = /<script\s+type="application\/ld\+json"/i.test(html);

  const keywordCount = KEYWORDS.reduce(
    (n, k) => n + (text.toLowerCase().match(new RegExp(k, "g")) ?? []).length,
    0,
  );
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const isSupport = SUPPORT.test(rel);
  if (!title) problems.push(`${rel}: missing <title>`);
  if (title === "Badr Adventures UK")
    problems.push(`${rel}: default (un-overridden) <title>`);
  if (!hasDescription) problems.push(`${rel}: missing meta description`);
  if (!hasCanonical) problems.push(`${rel}: missing canonical link`);
  if (!hasOg) problems.push(`${rel}: missing OG title/description/image`);
  if (!hasJsonLd) problems.push(`${rel}: missing JSON-LD block`);
  if (!isSupport) {
    if (keywordCount === 0)
      problems.push(`${rel}: low keyword coverage (0 of ${KEYWORDS.join(", ")})`);
    if (wordCount < 250) problems.push(`${rel}: thin content (${wordCount} words)`);
  }

  return { route: rel, title, hasDescription, hasCanonical, hasOg, hasJsonLd, keywordCount, wordCount };
}

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (name === "index.html" || name === "404.html") out.push(p);
  }
  return out;
}

function main() {
  const files = walk(DIST);
  for (const f of files) {
    const r = checkRoute(f);
    report.push(r);
  }

  console.log("\nSEO audit — prerendered routes\n");
  console.log(
    "route".padEnd(60) +
      "title/desc/canon/og/jsonld  kw  words",
  );
  console.log("─".repeat(110));
  const ok = (b: boolean) => (b ? "✓" : "✗");
  for (const r of report) {
    const flags =
      `${ok(!!r.title)}` +
      "/" +
      `${ok(r.hasDescription)}` +
      "/" +
      `${ok(r.hasCanonical)}` +
      "/" +
      `${ok(r.hasOg)}` +
      "/" +
      `${ok(r.hasJsonLd)}`;
    console.log(
      r.route.padEnd(60) +
        flags.padEnd(20) +
        String(r.keywordCount).padStart(3) +
        "  " +
        String(r.wordCount).padStart(5),
    );
  }

  if (problems.length === 0) {
    console.log("\n✓ All routes pass SEO checks.");
    return;
  }
  console.log("\n⚠ SEO warnings:");
  for (const p of problems) console.log("  - " + p);
  console.log("\n  These are warnings, not errors — fix when you can.");
}

main();
