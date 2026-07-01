// Per-page SEO helpers.
//
// Two ways to drive meta + JSON-LD for a page:
//
//   1. Hook (client-side nav): usePageSeo({...})
//      Updates document.title, meta tags, and canonical via useEffect
//      after the component mounts. Used for client-side route changes.
//
//   2. Declarative (SSR + CSR): <MetaTags seo={...} /> and <JsonLd data={...} />
//      Render real DOM during render. Use these in page components so
//      the prerender pass can extract them into the <head>.
//
// To keep behaviour identical between SSR and CSR, the hook form
// simply mounts the declarative form inside an effect — same markup,
// same order.

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
  /** Optional list of keywords. Renders as <meta name="keywords">. */
  keywords?: string[];
};

const DEFAULT_OG_IMAGE = "/og-default.png";
const DEFAULT_DESCRIPTION =
  "Badr Adventures runs guided hikes across the Lake District, Peak District, Snowdonia and beyond. Small groups, qualified guides, real trips.";

function fullTitle(t: string) {
  return t.includes(SITE_NAME) ? t : `${t} · ${SITE_NAME}`;
}

/**
 * Declarative <head> tags. Render this anywhere in the page tree;
 * it produces <title>, <meta>, <link rel="canonical"> elements that
 * end up in the rendered HTML. During prerender, the build pipeline
 * extracts them and re-injects into the page's <head>.
 */
export function MetaTags({ seo }: { seo: PageSeo }) {
  const title = fullTitle(seo.title);
  const description = seo.description || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${seo.path}`;
  const image = seo.ogImage || DEFAULT_OG_IMAGE;
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;
  const ogType = seo.ogType || "website";
  const keywords = seo.keywords?.join(", ");

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={SITE_LOCALE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={title} />
      {seo.publishedTime && (
        <meta property="article:published_time" content={seo.publishedTime} />
      )}
      {seo.modifiedTime && (
        <meta property="article:modified_time" content={seo.modifiedTime} />
      )}
      {seo.noindex ? (
        <>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
        </>
      ) : (
        <>
          <meta name="robots" content="index, follow" />
          <meta
            name="googlebot"
            content="index, follow, max-image-preview:large, max-snippet:-1"
          />
        </>
      )}
    </>
  );
}

/**
 * Render a JSON-LD blob as an inline <script>. The prerender
 * pipeline picks it up and inlines it into <head>.
 */
export function JsonLd({ data, id }: { data: unknown; id?: string }) {
  const json = JSON.stringify(data);
  return (
    <script
      type="application/ld+json"
      id={id}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

/**
 * Hook form. Mounts the same <MetaTags> declaratively inside an effect,
 * so client-side route changes get the right meta. Equivalent in
 * output to the declarative form.
 */
export function usePageSeo(seo: PageSeo): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const title = fullTitle(seo.title);
    const description = seo.description || DEFAULT_DESCRIPTION;
    const url = `${SITE_URL}${seo.path}`;
    const image = seo.ogImage || DEFAULT_OG_IMAGE;
    const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;
    const ogType = seo.ogType || "website";
    const keywords = seo.keywords?.join(", ");

    document.title = title;

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    const setLink = (rel: string, href: string) => {
      let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    // GSC ownership.
    setMeta("google-site-verification", "PfybD_SraSLP5ic-c3N6mZLaWSCPe55vfRx-jREmceo");
    setMeta("description", description);
    if (keywords) setMeta("keywords", keywords);
    setLink("canonical", url);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", url, "property");
    setMeta("og:type", ogType, "property");
    setMeta("og:image", imageUrl, "property");
    setMeta("og:image:alt", title, "property");
    setMeta("og:site_name", SITE_NAME, "property");
    setMeta("og:locale", SITE_LOCALE, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", imageUrl);
    setMeta("twitter:image:alt", title);
    if (seo.publishedTime) setMeta("article:published_time", seo.publishedTime, "property");
    if (seo.modifiedTime) setMeta("article:modified_time", seo.modifiedTime, "property");
    if (seo.noindex) {
      setMeta("robots", "noindex, nofollow");
      setMeta("googlebot", "noindex, nofollow");
    } else {
      setMeta("robots", "index, follow");
      setMeta("googlebot", "index, follow, max-image-preview:large, max-snippet:-1");
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
    seo.keywords?.join(","),
  ]);
}

/**
 * Hook form for JSON-LD. Mounts the same script inside an effect,
 * so subsequent route changes replace it. Idempotent on re-render.
 */
export function useJsonLd(dataOrId: string | unknown, maybeData?: unknown): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = typeof dataOrId === "string" ? dataOrId : `jsonld-${Math.random().toString(36).slice(2, 9)}`;
    const data = typeof dataOrId === "string" ? maybeData : dataOrId;
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
  }, [typeof dataOrId === "string" ? dataOrId : undefined, JSON.stringify(typeof dataOrId === "string" ? maybeData : dataOrId)]);
}
