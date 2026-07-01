import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { usePageSeo, useJsonLd } from "@/lib/seo";
import { blogPostingJsonLd } from "@/lib/json-ld";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMinutes: number;
  category: string;
  excerpt: string;
  keywords: string[];
}

// Pillar content for "Muslim Hiking" + variants. Add more entries here as
// new posts are published; the page will render the list automatically.
export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "muslim-hiking-uk-complete-guide",
    title: "Muslim Hiking in the UK: The Complete Beginner's Guide (2026)",
    description:
      "Everything you need to know about Muslim hiking in the UK — what to wear, prayer on the trail, halal food, women's groups, and the best beginner hikes in the Lake District, Peak District and Snowdonia.",
    date: "2026-06-28",
    readMinutes: 11,
    category: "Guide",
    excerpt:
      "New to hiking and not sure where to start as a Muslim in the UK? This guide covers the whole journey — from what to pack, to finding prayer time on the trail, to joining your first group hike.",
    keywords: [
      "Muslim hiking UK",
      "Muslim hiking for beginners",
      "halal hiking",
      "prayer on a hike",
    ],
  },
];

export default function BlogIndexPage() {
  usePageSeo({
    path: "/blog",
    title: "Muslim Hiking Blog | Guides, Trail Tips & Stories | Badr Adventures",
    description:
      "Read the Badr Adventures blog — practical guides on Muslim hiking in the UK, prayer and halal-friendly trail tips, women's hiking groups, family adventures, and stories from the trail.",
    keywords: [
      "Muslim hiking blog",
      "hiking tips Muslim",
      "halal hiking guide",
      "Islamic outdoor adventures",
    ],
  });

  useJsonLd(
    "blog-index",
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Badr Adventures Field Notes",
      description:
        "Practical guides and honest writing about Muslim hiking in the UK — prayer on the trail, halal food, women's groups, family trips, and the gear that actually holds up in the rain.",
      url: "https://badradventures.co.uk/blog",
      blogPost: BLOG_POSTS.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: `https://badradventures.co.uk/blog/${p.slug}`,
        datePublished: p.date,
      })),
    },
  );

  return (
    <div className="bg-paper text-ink">
      <section className="border-b border-ink/10 bg-paper-2/40 py-16">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">
            Field notes
          </span>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05] sm:text-6xl">
            Muslim hiking, on the record.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            Practical guides and honest writing about Muslim hiking in the UK —
            prayer on the trail, halal food, women's groups, family trips, and
            the gear that actually holds up in the rain.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <div className="grid gap-6">
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group block"
              >
                <Card className="border-ink/10 transition group-hover:border-ink/30">
                  <CardContent className="grid gap-4 p-8 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-3">
                        <Badge variant="outline" className="border-ink/20">
                          {post.category}
                        </Badge>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readMinutes} min read
                        </span>
                      </div>
                      <h2 className="mt-4 font-serif text-2xl font-semibold leading-tight sm:text-3xl">
                        {post.title}
                      </h2>
                      <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-2">
                        {post.excerpt}
                      </p>
                    </div>
                    <ArrowRight className="hidden h-6 w-6 text-ink-3 transition group-hover:translate-x-1 group-hover:text-ink sm:block" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
