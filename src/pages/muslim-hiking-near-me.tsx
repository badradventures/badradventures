import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Compass,
  MapPin,
  Mountain,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { usePageSeo, useJsonLd } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/json-ld";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CITIES = [
  {
    name: "London",
    slug: "london",
    travel: "1h by train to nearest trailheads (Chilterns, Surrey Hills, South Downs)",
    hikes: "Box Hill, Seven Sisters, Ditchling Beacon",
    group: "Muslim Hikers London chapter + Badr Adventures South Downs weekends",
    mosque: "London Central Mosque (Regent's Park) or East London Mosque",
  },
  {
    name: "Manchester",
    slug: "manchester",
    travel: "45min–1h to Peak District trailheads",
    hikes: "Kinder Scout, Mam Tor, Stanage Edge, Edale Skyline",
    group: "Badr Adventures runs regular Peak District trips from Manchester",
    mosque: "Manchester Central Mosque (Victoria Park)",
  },
  {
    name: "Birmingham",
    slug: "birmingham",
    travel: "1h 15min to Peak District · 2h to Snowdonia",
    hikes: "Mam Tor, the Roaches, Pen y Fan for day trips",
    group: "Birmingham Sisters Hike + Badr Adventures Midlands meet-ups",
    mosque: "Green Lane Masjid & Central Mosque Birmingham",
  },
  {
    name: "Leeds & Bradford",
    slug: "leeds-bradford",
    travel: "45min to Yorkshire Dales · 1h 30min to Lake District",
    hikes: "Ilkley Moor, Malham Cove, Yorkshire Three Peaks",
    group: "Yorkshire Moors Sisters + Badr Adventures Dales weekends",
    mosque: "Leeds Grand Mosque / Bradford Central Mosque",
  },
  {
    name: "Glasgow",
    slug: "glasgow",
    travel: "45min to Loch Lomond · 2h to Glencoe",
    hikes: "Ben Lomond, The Cobbler, Conic Hill",
    group: "Edinburgh/Glasgow Muslim Hikers + Badr Adventures Highlands trips",
    mosque: "Glasgow Central Mosque",
  },
  {
    name: "Cardiff & Bristol",
    slug: "cardiff-bristol",
    travel: "30min–1h to Brecon Beacons trailheads",
    hikes: "Pen y Fan, Fan y Big, Sugarloaf, Four Falls Walk",
    group: "Badr Adventures Brecon Beacons day trips + Snowdonia Sisters Hike",
    mosque: "Cardiff Muslim Centre / Bristol Jamia Mosque",
  },
  {
    name: "Leicester",
    slug: "leicester",
    travel: "1h 15min to Peak District",
    hikes: "Bradgate Park, Beacon Hill, Kinder Scout (day trip)",
    group: "Badr Adventures Peak District meet-ups from Leicester",
    mosque: "Leicester Central Mosque",
  },
  {
    name: "Nottingham",
    slug: "nottingham",
    travel: "1h to Peak District",
    hikes: "Mam Tor, Stanage Edge, Dovedale",
    group: "Nottingham Outdoor Sisters + Badr Adventures group trips",
    mosque: "Nottingham Central Mosque / Al-Rashid Islamic Centre",
  },
];

const FAQS = [
  {
    question: "Is there Muslim hiking near me?",
    answer:
      "Most major UK cities are within 1–2 hours of a national park or Area of Outstanding Natural Beauty with Muslim hiking groups. London, Manchester, Birmingham, Leeds, Glasgow, Cardiff, Bristol, Leicester and Nottingham all have active communities. Badr Adventures runs guided Muslim hiking trips from all these cities — we organise car shares so you don't need a car.",
  },
  {
    question: "How do I find a Muslim hiking group near me?",
    answer:
      "The fastest way is to search for 'Muslim hiking near me' on Instagram or Facebook — most groups post their events there. Badr Adventures runs guided Muslim hiking weekends from 8 cities across the UK, with transport arranged from a central meeting point. You can also check the Muslim Hikers network at muslimhikers.com for local chapters.",
  },
  {
    question: "I don't drive — can I still join a Muslim hiking trip?",
    answer:
      "Yes. Most Badr Adventures trips arrange car shares from a major train station or city-centre meeting point. We also run trips that start from trailheads accessible by train. Message us for the nearest pick-up point to you.",
  },
  {
    question: "What's the closest mountain to London for Muslim hiking?",
    answer:
      "The South Downs and the Chilterns are your closest options — Box Hill (45 min by train from London Victoria), Seven Sisters (1h 15min from London Bridge), and Ditchling Beacon (1h from London Victoria). For proper mountain terrain, the Peak District is 2h by train from St Pancras.",
  },
  {
    question: "Do you run Muslim hiking trips from Manchester?",
    answer:
      "Yes — Manchester is our busiest hub. We run regular Peak District trips (Mam Tor, Kinder Scout, Stanage Edge) from Manchester Piccadilly, and Lake District weekends (Helvellyn, Catbells) from Manchester Victoria. Most trips depart Saturday morning and return Sunday evening.",
  },
];

export default function MuslimHikingNearMePage() {
  usePageSeo({
    path: "/muslim-hiking/near-me",
    title:
      "Muslim Hiking Near Me | Find Guided Muslim Hikes Near UK Cities | Badr Adventures",
    description:
      "Find Muslim hiking trips near you. Guided Muslim hikes from London, Manchester, Birmingham, Leeds, Glasgow, Cardiff, Bristol, Leicester, Nottingham and across the UK. Prayer breaks, halal food, women-friendly groups. Book a weekend near your city.",
    keywords: [
      "Muslim hiking near me",
      "Muslim hiking near London",
      "Muslim hiking near Manchester",
      "Muslim hiking near Birmingham",
      "Muslim hiking Glasgow",
      "Muslim hiking Leeds",
      "Muslim hiking Nottingham",
      "Muslim hiking Bristol",
      "Muslim hiking Cardiff",
      "sisters hiking near me",
      "guided Muslim hikes near me",
      "Muslim hiking weekend near me",
    ],
  });

  useJsonLd(
    "near-me-breadcrumb",
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Muslim Hiking", path: "/muslim-hiking" },
      { name: "Near Me", path: "/muslim-hiking/near-me" },
    ]),
  );
  useJsonLd("near-me-faq", faqJsonLd(FAQS));

  return (
    <div className="bg-paper text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink/10 bg-gradient-to-b from-[#0d1f1a] via-[#102a23] to-[#0d1f1a] text-paper">
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-paper/80 backdrop-blur">
            <Sparkles className="h-3 w-3 text-[var(--ochre)]" />
            Find Muslim hiking near you · 2026
          </span>
          <h1 className="mt-8 max-w-4xl font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-[80px]">
            Muslim hiking{" "}
            <span className="italic text-[var(--ochre)]">near you.</span>
          </h1>
          <p
            data-speakable="true"
            className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/80"
          >
            Badr Adventures runs guided Muslim hiking trips from London,
            Manchester, Birmingham, Leeds, Glasgow, Cardiff, Bristol, Leicester
            and Nottingham. Every trip includes prayer breaks, halal food,
            women-friendly groups, and a qualified mountain leader. We arrange
            car shares so you don't need a car. Pick your city below and find
            your nearest Muslim hiking weekend.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/hikes"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-[0_18px_40px_-12px_rgba(232,168,75,0.6)] transition hover:bg-[#f0b75e]"
            >
              See upcoming Muslim hiking trips
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/muslim-hiking"
              className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-6 py-3 text-sm font-medium text-paper backdrop-blur transition hover:border-paper/50 hover:bg-paper/10"
            >
              Muslim Hiking hub
            </Link>
          </div>
        </div>
      </section>

      {/* Intro answer block for AI search */}
      <section className="border-b border-ink/10 bg-paper-2/40 py-16">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
            The 3-minute answer
          </span>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            How to find Muslim hiking near you in the UK
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-2">
            The UK has over a dozen active Muslim hiking groups operating from
            every major city. Badr Adventures runs guided Muslim hiking weekends
            from London, Manchester, Birmingham, Leeds, Glasgow, Cardiff,
            Bristol, Leicester and Nottingham — with organised car shares so you
            don't need your own transport. Each trip is led by a qualified
            Mountain Leader, includes prayer breaks mapped to the day's salah
            times, halal food, and women-friendly or sisters-only options.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">
            If you're asking "is there Muslim hiking near me?", the answer is
            almost certainly yes. Most major UK cities are within 1–2 hours of a
            national park with an active Muslim hiking community. Scroll down
            for your city, or check our upcoming hikes for the next trip near
            you.
          </p>
        </div>
      </section>

      {/* City grid */}
      <section className="border-b border-ink/10 py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Muslim hiking near UK cities
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">
            Click your city to see nearby Muslim hiking trips, local groups, and
            how to get there without a car.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CITIES.map((city) => (
              <Card
                key={city.slug}
                className="border-ink/10 bg-paper transition hover:border-[var(--ochre)]/50 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <MapPin className="h-5 w-5 text-rust" />
                    <Badge
                      variant="outline"
                      className="border-ink/20 bg-transparent font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2"
                    >
                      Muslim hiking
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-serif text-2xl font-semibold">
                    {city.name}
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-ink-2">
                    <div className="flex gap-2">
                      <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ochre)]" />
                      <span>{city.travel}</span>
                    </div>
                    <div className="flex gap-2">
                      <Mountain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ochre)]" />
                      <span>{city.hikes}</span>
                    </div>
                    <div className="flex gap-2">
                      <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ochre)]" />
                      <span>{city.group}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Near me FAQ */}
      <section className="border-b border-ink/10 bg-paper-2/40 py-20">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
            FAQ
          </span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Muslim hiking near me — questions answered.
          </h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.question}
                className="group rounded-2xl border border-ink/10 bg-paper p-6 open:border-rust/40"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-serif text-lg font-medium">
                  {f.question}
                  <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink-2 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 leading-relaxed text-ink-2">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center sm:px-8 lg:px-10">
        <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Find Muslim hiking near you this weekend
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          London, Manchester, Birmingham, Leeds, Glasgow, Cardiff, Bristol,
          Leicester, Nottingham — we run guided Muslim hiking weekends from
          every major UK city. Pick a date, pick a route, and we'll do the rest.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/hikes"
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-[0_18px_40px_-12px_rgba(232,168,75,0.6)] transition hover:bg-[#f0b75e]"
          >
            See upcoming Muslim hiking trips
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/40"
          >
            Ask about your city
          </Link>
        </div>
      </section>
    </div>
  );
}
