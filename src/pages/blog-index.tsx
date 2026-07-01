import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { usePageSeo, useJsonLd } from "@/lib/seo";
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
    slug: "prayer-on-the-trail-muslim-hikers",
    title: "Prayer on the Trail: A Practical Guide for Muslim Hikers",
    description:
      "How to pray salah on a UK hike — wudu with limited water, finding a clean spot, combining prayers, dhuhr at the summit, and what every guide should know about Muslim prayer breaks.",
    date: "2026-06-30",
    readMinutes: 8,
    category: "Faith",
    excerpt:
      "Prayer on a hike is simpler than you think. Here is exactly how to handle wudu, qibla, combining dhuhr with asr, and finding a clean spot on a windy ridge.",
    keywords: [
      "prayer on a hike",
      "Muslim prayer outdoors",
      "salah while hiking",
      "wudu on a hike",
      "dhuhr on a mountain",
    ],
  },
  {
    slug: "muslim-hiking-uk-complete-guide",
    title: "Muslim Hiking in the UK: The Complete Beginner's Guide (2026)",
    description:
      "Everything you need to know about Muslim hiking in the UK - what to wear, prayer on the trail, halal food, women's groups, and the best beginner hikes in the Lake District, Peak District and Snowdonia.",
    date: "2026-06-28",
    readMinutes: 11,
    category: "Guide",
    excerpt:
      "New to hiking and not sure where to start as a Muslim in the UK? This guide covers the whole journey - from what to pack, to finding prayer time on the trail, to joining your first group hike.",
    keywords: [
      "Muslim hiking UK",
      "Muslim hiking for beginners",
      "halal hiking",
      "prayer on a hike",
    ],
  },
  {
    slug: "muslim-womens-hiking-groups-uk",
    title: "Muslim Women's Hiking Groups in the UK: A 2026 List",
    description:
      "A directory of Muslim women's hiking groups across the UK — sisters-only hikes, mixed groups with separate turn-outs, and beginner-friendly weekend walks in the Lake District, Peak District, Snowdonia and the South East.",
    date: "2026-06-30",
    readMinutes: 9,
    category: "Community",
    excerpt:
      "The fastest-growing segment of UK Muslim outdoor recreation is women-only hiking. Here are the groups running regular sisters' hikes in 2026, where to find them, and what to expect.",
    keywords: [
      "Muslim women hiking UK",
      "sisters hiking group",
      "women only hiking",
      "Muslim women's outdoor group",
    ],
  },
  {
    slug: "halal-friendly-hiking-pack-eat-stop",
    title: "Halal-Friendly Hiking: What to Pack, What to Eat, Where to Stop",
    description:
      "A practical field guide to keeping halal on a UK day hike — from the food you pack in your bag, to the pub lunch you can still order, to finding halal food near popular national parks.",
    date: "2026-06-30",
    readMinutes: 7,
    category: "Practical",
    excerpt:
      "Halal hiking is mostly about planning ahead. Here is the packing list, the lunchbox playbook, and the restaurant shortcuts that make a day on the fells work for every diet.",
    keywords: [
      "halal hiking",
      "halal food on a hike",
      "Muslim hiking food",
      "halal pub lunch",
    ],
  },
  {
    slug: "family-friendly-hikes-muslim-families-uk",
    title: "The Best Family-Friendly Hikes for Muslim Families in the UK",
    description:
      "Six short, pushchair-friendly, pram-accessible, and genuinely fun hikes for Muslim families with young children — from Grizedale Forest to Padley Gorge, with prayer-friendly stops marked on the route.",
    date: "2026-06-30",
    readMinutes: 6,
    category: "Family",
    excerpt:
      "Hiking with kids under five is a different sport. These six routes are short, shaded, and have a cafe, toilets, and a flat spot for prayer within thirty minutes of the car park.",
    keywords: [
      "family Muslim hiking",
      "hikes with kids UK",
      "pushchair friendly walks",
      "Muslim family days out",
    ],
  },
  {
    slug: "islamic-perspective-hiking-outdoors",
    title: "The Islamic Perspective on Hiking and the Outdoors: Why It Matters",
    description:
      "From the Prophet's ﷺ love of travel to the Quranic call to reflect on the mountains, the Islamic case for getting outside is older than the UK national parks. A short, sourced read.",
    date: "2026-06-30",
    readMinutes: 5,
    category: "Reflection",
    excerpt:
      "Tawaf around the Kaaba, the seven circuits, the breath of the mountains, the Quranic ayah about the standing still of the stars — there is a deep Islamic case for being outside.",
    keywords: [
      "Islamic perspective on hiking",
      "Muslim outdoor adventure",
      "Islam and nature",
      "reflection on mountains Islam",
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
