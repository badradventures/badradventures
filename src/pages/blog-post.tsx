import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { usePageSeo, useJsonLd } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/json-ld";
import { Badge } from "@/components/ui/badge";
import { BLOG_POSTS } from "./blog-index";
import { RENDERED_POSTS } from "./blog-content";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const meta = BLOG_POSTS.find((p) => p.slug === slug);
  const html = slug ? RENDERED_POSTS[slug] : undefined;

  usePageSeo({
    path: `/blog/${slug ?? ""}`,
    title: meta
      ? meta.title
      : "Article not found | Badr Adventures Muslim Hiking Blog",
    description: meta?.description,
    ogType: "article",
    publishedTime: meta ? new Date(meta.date).toISOString() : undefined,
    modifiedTime: meta ? new Date(meta.date).toISOString() : undefined,
    keywords: meta?.keywords,
  });

  if (!meta || !html) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="font-serif text-4xl">Post not found</h1>
        <p className="mt-4 text-ink-2">
          The article you're looking for has moved or doesn't exist.
        </p>
        <Link
          to="/blog"
          className="mt-8 inline-flex items-center gap-2 text-ink underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to the blog
        </Link>
      </div>
    );
  }

  useJsonLd(
    "blog-article",
    articleJsonLd({
      headline: meta.title,
      description: meta.description,
      author: "Saif Mahmood",
      publisher: "Badr Adventures UK Ltd",
      datePublished: meta.date,
      dateModified: meta.date,
      image: "/og-default.png",
      mainEntityOfPage: `/blog/${meta.slug}`,
    }),
  );
  useJsonLd(
    "blog-breadcrumb",
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: meta.title, path: `/blog/${meta.slug}` },
    ]),
  );

  return (
    <article className="bg-paper text-ink">
      <header className="border-b border-ink/10 bg-paper-2/40 py-16">
        <div className="mx-auto max-w-3xl px-6 sm:px-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 hover:text-ink"
          >
            <ArrowLeft className="h-3 w-3" /> Back to the blog
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-3">
            <Badge variant="outline" className="border-ink/20">
              {meta.category}
            </Badge>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(meta.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {meta.readMinutes} min read
            </span>
          </div>
          <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.1] sm:text-5xl">
            {meta.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-2">
            {meta.excerpt}
          </p>
        </div>
      </header>

      <div
        className="prose-badr mx-auto max-w-3xl px-6 py-16 sm:px-8"
        // Pre-rendered article HTML lives in blog-content.tsx. Sanitised at
        // build time (no user input, all strings are static).
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <section className="border-t border-ink/10 bg-paper-2/40 py-12">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 sm:px-8">
          <Link
            to="/muslim-hiking"
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium hover:border-ink/40"
          >
            <ArrowLeft className="h-4 w-4" /> Muslim Hiking UK
          </Link>
          <Link
            to="/hikes"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-5 py-2.5 text-sm font-medium text-ink"
          >
            See upcoming hikes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}
