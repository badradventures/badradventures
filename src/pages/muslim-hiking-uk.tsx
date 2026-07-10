import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Mountain,
  Sparkles,
  Star,
} from "lucide-react";
import { usePageSeo, useJsonLd } from "@/lib/seo";
import { faqJsonLd, breadcrumbJsonLd } from "@/lib/json-ld";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RegionGuide {
  slug: string;
  name: string;
  intro: string;
  peaks: string;
  best_for: string;
  travel: string;
  highlights: string[];
}

const REGIONS: RegionGuide[] = [
  {
    slug: "lake-district",
    name: "Lake District",
    intro:
      "The spiritual home of British Muslim hiking. England's only mountain national park, with forty-plus fells above 2,000 ft, glacial valleys, and well-marked paths suitable for first-time scramblers.",
    peaks: "Scafell Pike (978 m) · Helvellyn (950 m) · Skiddaw (931 m)",
    best_for: "Beginner-friendly ascents, family weekends, weekend trips from Manchester & Leeds.",
    travel: "2h 30 from Manchester · 4h 30 from London · 1h 30 from Glasgow",
    highlights: [
      "Helvellyn via Striding Edge (classic scramble)",
      "Catbells sunset hike with Maghrib on the ridge",
      "Scafell Pike dawn ascent in summer",
    ],
  },
  {
    slug: "peak-district",
    name: "Peak District",
    intro:
      "England's oldest national park and the closest mountains to the Midlands. Quick to reach, gentler underfoot, and packed with weekend routes for Muslim hiking beginners.",
    peaks: "Kinder Scout (636 m) · Mam Tor (517 m) · Stanage Edge",
    best_for: "First hikes, group days, families with younger children.",
    travel: "1h from Manchester · 1h 30 from Birmingham · 2h 30 from London",
    highlights: [
      "Kinder Scout plateau loop (the 'right to roam' walk)",
      "Stanage Edge sunset with tea in Hathersage",
      "Mam Tor & the Great Ridge",
    ],
  },
  {
    slug: "snowdonia",
    name: "Snowdonia (Eryri)",
    intro:
      "Wales's mountain heartland. Steeper, more dramatic and considerably quieter than the Lakes. Best for Muslim hikers who want a proper mountain day and don't mind a bit of cloud.",
    peaks: "Snowdon / Yr Wyddfa (1,085 m) · Glyder Fawr (1,001 m) · Tryfan (918 m)",
    best_for: "Intermediate to advanced hikers, full-day mountain days.",
    travel: "3h 30 from London · 2h 30 from Birmingham · 1h 30 from Liverpool",
    highlights: [
      "Snowdon via the Llanberis Path (easiest, family-friendly)",
      "Tryfan north ridge (Grade 1 scramble)",
      "Glyderau ridge walk with the Cantilever",
    ],
  },
  {
    slug: "scottish-highlands",
    name: "Scottish Highlands",
    intro:
      "The serious stuff. Britain's only true alpine terrain, with fifteen Munros above 4,000 ft. Multi-day options and wild camping by right under the Scottish Outdoor Access Code.",
    peaks: "Ben Nevis (1,345 m) · Cairn Gorm (1,245 m) · Buachaille Etive Mòr",
    best_for: "Multi-day expeditions, wild camping, experienced Muslim hiking groups.",
    travel: "2h 30 from Edinburgh · 2h from Glasgow · 7h from London",
    highlights: [
      "Ben Nevis via the Mountain Track",
      "Cuillin ridge on Skye (for experienced only)",
      "Glen Coe winter skills weekends",
    ],
  },
  {
    slug: "south-downs",
    name: "South Downs",
    intro:
      "Gentle chalk hills, rolling vineyards, and long-distance paths. The Muslim hiking beginner's playground — and a quiet option for families wanting a long walk without altitude.",
    peaks: "Butser Hill (270 m) · Blackdown Hill (280 m) · Ditchling Beacon (248 m)",
    best_for: "First-time hikers, parents with buggies, Ramadan iftars on the trail.",
    travel: "1h from London · 2h from Birmingham",
    highlights: [
      "Seven Sisters to Birling Gap coastal walk",
      "Butser Hill loop with Iftar at the summit",
      "South Downs Way long-distance multi-day",
    ],
  },
  {
    slug: "brecon-beacons",
    name: "Brecon Beacons (Bannau Brycheiniog)",
    intro:
      "South Wales's answer to the Lakes. Compact, wetter than you expect, with a 886 m summit that punches well above its weight. Brilliant Muslim hiking day-trip territory from Bristol or Cardiff.",
    peaks: "Pen y Fan (886 m) · Corn Du · Cribyn",
    best_for: "Day trips, beginner-intermediate group hikes.",
    travel: "1h from Cardiff · 1h from Bristol · 3h from London",
    highlights: [
      "Pen y Fan from the Storey Arms (most popular route)",
      "Fan y Big horseshoe",
      "Waterfall country walk in the Brecon valleys",
    ],
  },
];

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "What is the best region in the UK for Muslim hiking?",
    answer:
      "For most Muslim hikers, the Lake District and the Peak District are the best starting points. Both have a high density of well-marked paths, multiple guided Muslim hiking weekends, and decent transport links from London, Manchester, and Birmingham. Snowdonia and the Scottish Highlands are the next step up once you have a few peaks under your belt.",
  },
  {
    question: "Do you organise Muslim hiking weekends in the Lake District?",
    answer:
      "Yes — most months we run a Lake District Muslim hiking weekend, typically a Saturday Helvellyn or Catbells ascent followed by a Sunday Scafell Pike or lower fell. Prayer breaks are built into the route, food is halal, and groups are women-friendly and family-friendly by default.",
  },
  {
    question: "Is Muslim hiking suitable for beginners?",
    answer:
      "Absolutely. The majority of our community started with no hiking experience. Around 60% of our 2025 trips were graded 'easy' or 'moderate'. We pace every group to its slowest member, run dedicated beginner weekends in the Peak District, and lend kit (boots, waterproofs, rucksacks) where we can.",
  },
  {
    question: "How do prayer times work on a Muslim hike?",
    answer:
      "Each route is built around the day's prayer times. The hike leader carries a prayer timetable and we stop for Fajr, Dhuhr, Asr, Maghrib and Isha as needed — typically with a 10–20 minute break woven into the route. For groups with brothers and sisters we arrange separate prayer spaces.",
  },
  {
    question: "Do you run women-only Muslim hiking groups?",
    answer:
      "Yes. We run regular sisters-only weekends (Lake District, Snowdonia, Peak District) led by qualified female guides. Mixed groups are also available. All group compositions are clearly marked on each trip page.",
  },
  {
    question: "Is the food halal?",
    answer:
      "Yes — every meal on every Muslim hiking trip is halal. We cook on the trail (one-pot meals, halal meat from a Muslim butcher, vegetarian options always available) and pre-prep all summit food with halal ingredients. Bring any specific dietary needs and we'll plan around them.",
  },
  {
    question: "Can children come on a Muslim hiking trip?",
    answer:
      "Most trips are family-friendly from age 8 upward, with shorter routes (Catbells, Mam Tor, Butser Hill) sized for younger legs. We mark every trip with a minimum age and offer dedicated family weekends twice a year.",
  },
  {
    question: "What kit do I need to start Muslim hiking?",
    answer:
      "Three things: waterproof boots with ankle support, a waterproof jacket, and a 25–30L rucksack. Everything else (tents, stoves, maps, group kit) is provided on our guided weekends. We have a kit guide at /blog and can lend gear if you message us before the trip.",
  },
];

export default function MuslimHikingUkPage() {
  usePageSeo({
    path: "/muslim-hiking/uk",
    title:
      "Muslim Hiking in the UK | Best Regions, Routes & Guided Trips | Badr Adventures",
    description:
      "A complete guide to Muslim hiking in the UK. Lake District, Peak District, Snowdonia, Scottish Highlands, South Downs, Brecon Beacons — prayer-friendly routes, halal food, women-only groups, and family weekends run by the UK's leading Muslim hiking community.",
    keywords: [
      "Muslim hiking UK",
      "Muslim hiking in the UK",
      "Muslim hiking Lake District",
      "Muslim hiking Peak District",
      "Muslim hiking Snowdonia",
      "Muslim hiking Scotland",
      "halal hiking UK",
      "Muslim hiking beginners",
      "women's Muslim hiking UK",
      "family Muslim hiking UK",
    ],
  });

  useJsonLd("muslim-hiking-uk-faq", faqJsonLd(FAQ));
  useJsonLd(
    "muslim-hiking-uk-breadcrumb",
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Muslim Hiking", path: "/muslim-hiking" },
      { name: "UK Regions", path: "/muslim-hiking/uk" },
    ]),
  );

  return (
    <div className="bg-paper text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink/10 bg-gradient-to-b from-[var(--ochre)]/15 via-paper to-paper py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Badge
            variant="outline"
            className="mb-6 border-ink/20 bg-transparent font-mono text-[10px] uppercase tracking-[0.24em] text-ink-2"
          >
            <Sparkles className="mr-1 h-3 w-3 text-rust" />
            The UK guide · updated 2026
          </Badge>
          <h1 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Muslim hiking in the UK — every region, every season.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-2">
            From the Lake District to Snowdonia, from the South Downs to the
            Cuillin — here's where the UK's Muslim hiking community is heading
            this year, and how to join in. Prayer-friendly routes, halal food,
            women-friendly groups, family weekends, and beginners always
            welcome.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/hikes"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-sm transition hover:bg-[#f0b75e]"
            >
              See upcoming Muslim hiking weekends
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/muslim-hiking"
              className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/40"
            >
              Back to the Muslim Hiking hub
            </Link>
          </div>
        </div>
      </section>

      {/* Cross-link to camping */}
      <section className="border-b border-ink/10 bg-paper-2/40 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-ink-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rust">Also from Badr: </span>
            <Link to="/muslim-camping/uk" className="font-medium text-ink underline underline-offset-2 hover:text-rust">
              Muslim Camping UK
            </Link>
            <span className="mx-2 text-ink-3">·</span>
            <Link to="/family-hiking" className="font-medium text-ink underline underline-offset-2 hover:text-rust">
              Family-Friendly Hiking
            </Link>
          </p>
        </div>
      </section>

      {/* Intro paragraph for SEO / AEO */}
      <section className="border-b border-ink/10 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-semibold text-ink">
            Where to go Muslim hiking in the UK
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-2">
            The UK is one of the most under-rated Muslim hiking destinations in
            the world. Fifteen national parks, four hundred kilometres of long-
            distance paths, and a right-to-roam culture that makes wild camping
            legal across most of Scotland and the Lake District. For Muslim
            hikers, the UK also has an unmatched community infrastructure —
            halal food is widely available, mosques are within an hour of most
            major peaks, and there's a growing network of Muslim-led hiking
            groups operating every weekend of the year.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">
            Below is our region-by-region guide to the best Muslim hiking in
            the UK, written by the Badr Adventures team and the guides who lead
            our trips. Each section includes the best peaks, the routes we
            recommend, how to get there from London, Manchester, Birmingham,
            Glasgow and Edinburgh, and the kind of Muslim hiking weekend we run
            there.
          </p>
        </div>
      </section>

      {/* Region guides */}
      <section className="border-b border-ink/10 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {REGIONS.map((region) => (
              <Card
                key={region.slug}
                className="border-ink/10 bg-paper transition hover:border-[var(--ochre)]/50"
              >
                <CardContent className="p-7">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h3 className="font-serif text-2xl font-semibold text-ink">
                      Muslim hiking in the {region.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-ink/20 bg-transparent font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2"
                    >
                      <MapPin className="mr-1 h-3 w-3" />
                      UK
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-2">
                    {region.intro}
                  </p>

                  <div className="mt-5 space-y-3 border-t border-ink/10 pt-5 text-xs">
                    <div className="flex gap-3">
                      <Mountain className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ochre)]" />
                      <div>
                        <div className="font-mono uppercase tracking-[0.18em] text-ink-3">
                          Key peaks
                        </div>
                        <div className="text-ink-2">{region.peaks}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Star className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ochre)]" />
                      <div>
                        <div className="font-mono uppercase tracking-[0.18em] text-ink-3">
                          Best for
                        </div>
                        <div className="text-ink-2">{region.best_for}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ochre)]" />
                      <div>
                        <div className="font-mono uppercase tracking-[0.18em] text-ink-3">
                          Travel
                        </div>
                        <div className="text-ink-2">{region.travel}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-ink/10 pt-5">
                    <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
                      Top Muslim hiking routes
                    </div>
                    <ul className="space-y-1.5 text-sm text-ink-2">
                      {region.highlights.map((h) => (
                        <li key={h} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ochre)]" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why us block */}
      <section className="border-b border-ink/10 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-semibold text-ink">
            What makes our Muslim hiking weekends different
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-2">
            Every Muslim hiking weekend we run is designed around three
            principles: prayer, people, and pace. Prayer — we build the day's
            route around the prayer times and stop for Fajr, Dhuhr, Asr, Maghrib
            and Isha as a group, with separate spaces for brothers and sisters.
            People — every group is led by a qualified Mountain Leader who is
            themselves Muslim, so questions about fiqh of the outdoors, wudu on
            the trail, and athan at the summit get a knowledgeable answer.
            Pace — we walk to the slowest member, not the fastest. The hill
            will be there next weekend.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">
            We're not the only Muslim hiking group in the UK, but we're the
            only one that combines qualified Mountain Leaders (summer and
            winter), a published safeguarding policy, halal food on every trip,
            and a community of over 500 hikers who come back year after year.
            Our next Lake District weekend is just below.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-ink/10 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-semibold text-ink">
            Muslim hiking in the UK — frequently asked
          </h2>
          <div className="mt-8 space-y-4">
            {FAQ.map(({ question, answer }) => (
              <details
                key={question}
                className="group rounded-lg border border-ink/10 bg-paper-2/30 p-5 transition open:border-[var(--ochre)]/40 open:bg-paper"
              >
                <summary className="cursor-pointer list-none text-lg font-medium text-ink">
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink/20 text-xs font-mono text-ink-2">
                      Q
                    </span>
                    <span>{question}</span>
                  </span>
                </summary>
                <p className="mt-4 pl-9 text-base leading-relaxed text-ink-2">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
            Ready to start Muslim hiking in the UK?
          </h2>
          <p className="mt-4 text-lg text-ink-2">
            We run guided Muslim hiking weekends every month. Lake District,
            Peak District, Snowdonia, the Highlands — prayer-friendly, halal,
            women-friendly, family-friendly. Bring a friend, or come solo and
            meet the community.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/hikes"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-sm transition hover:bg-[#f0b75e]"
            >
              <Calendar className="h-4 w-4" />
              See upcoming Muslim hiking weekends
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/40"
            >
              Ask us a question
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
