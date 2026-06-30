// Per-page SEO helper. Sets document.title, meta description, canonical URL,
// and Open Graph / Twitter Card tags from a single config object.
//
// React 19's metadata management is still new and React-Helmet hasn't been
// updated for React 19 server components, so we use a small effect-driven
// hook. Effects run on every page nav because the hook is called in each
// page component, so this is the right place to keep it.

import { useEffect } from "react";

export const SITE_NAME = "Badr Adventures";
export const SITE_TAGLINE = "Guided hikes across the UK";
export const SITE_URL = "https://badradventures.co.uk";
export const SITE_LOCALE = "en_GB";

export type PageSeo = {
  title: string;
  description?: string;
  /** Path under SITE_URL, no domain. Include leading slash. */
  path: string;
  /** When true, search engines skip this page (e.g. /cart, /admin). */
  noindex?: boolean;
  /** Override the default OG image (must be uploaded to space assets). */
  ogImage?: string;
  /** og:type. Defaults to "website". Use "article" for blog posts. */
  ogType?: "website" | "article" | "product";
  /** Optional published/modified ISO date for articles. */
  publishedTime?: string;
  modifiedTime?: string;
};

const DEFAULT_OG_IMAGE = "/og-default.png";
const DEFAULT_DESCRIPTION =
  "Badr Adventures runs guided hikes across the Lake District, Peak District, Snowdonia and beyond. Small groups, qualified guides, real trips.";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${name}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function removeLink(rel: string) {
  if (typeof document === "undefined") return;
  const el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

function removeMeta(name: string, attr: "name" | "property" = "name") {
  if (typeof document === "undefined") return;
  const el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

/** Apply per-page metadata. Call once at the top of each page component. */
export function usePageSeo(seo: PageSeo): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const {
      path,
      title,
      description: rawDescription,
      noindex = false,
      ogImage = DEFAULT_OG_IMAGE,
      ogType = "website",
      publishedTime,
      modifiedTime,
    } = seo;
    const description = rawDescription || DEFAULT_DESCRIPTION;

    // Title. Append site name if it isn't already.
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;
    document.title = fullTitle;

    const url = `${SITE_URL}${path}`;
    const imageUrl = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;

    // Core meta.
    setMeta("description", description);

    // Canonical.
    setLink("canonical", url);

    // Open Graph.
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", url, "property");
    setMeta("og:type", ogType, "property");
    setMeta("og:image", imageUrl, "property");
    setMeta("og:image:alt", fullTitle, "property");
    setMeta("og:site_name", SITE_NAME, "property");
    setMeta("og:locale", SITE_LOCALE, "property");

    // Twitter.
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", imageUrl);
    setMeta("twitter:image:alt", fullTitle);

    // Optional article metadata.
    if (publishedTime) {
      setMeta("article:published_time", publishedTime, "property");
    } else {
      removeMeta("article:published_time", "property");
    }
    if (modifiedTime) {
      setMeta("article:modified_time", modifiedTime, "property");
    } else {
      removeMeta("article:modified_time", "property");
    }

    // Robots.
    if (noindex) {
      setMeta("robots", "noindex, nofollow");
      setMeta("googlebot", "noindex, nofollow");
    } else {
      setMeta("robots", "index, follow");
      setMeta(
        "googlebot",
        "index, follow, max-image-preview:large, max-snippet:-1",
      );
    }
  }, [
    seo.title,
    seo.description,
    seo.path,
    seo.noindex,
    seo.ogImage,
    seo.ogType,
    seo.publishedTime,
    seo.modifiedTime,
  ]);
}

/** Inject a JSON-LD blob. Replaces any previous blob with the same id. */
export function useJsonLd(id: string, data: unknown): void;
export function useJsonLd(data: unknown): void;
export function useJsonLd(arg1: string | unknown, arg2?: unknown): void {
  const id = typeof arg1 === "string" ? arg1 : `jsonld-${Math.random().toString(36).slice(2, 9)}`;
  const data = typeof arg1 === "string" ? arg2 : arg1;
  useEffect(() => {
    if (typeof document === "undefined") return;
    const existing = document.getElementById(id);
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };
  }, [id, JSON.stringify(data)]);
}