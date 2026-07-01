import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Compass,
  Heart,
  MapPin,
  Mountain,
  Shield,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { usePageSeo, useJsonLd } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/json-ld";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const REGIONS = [
  { name: "Lake District", slug: "lake-district", blurb: "Helvellyn, Scafell Pike, the Langdale Pikes. England's most dramatic Muslim hiking routes, with prayer breaks at the summits.", image: "/images/region-lake-district.jpg" },
  { name: "Peak District", slug: "peak-district", blurb: "Kinder Scout, Stanage Edge, the Roaches. The friendliest introduction to Muslim hiking in the UK — perfect for first-timers.", image: "/images/region-peak-district.jpg" },
  { name: "Snowdonia (Eryri)", slug: "snowdonia", blurb: "Snowdon, Tryfan, the Glyderau. Wales's finest ridges, with halal meals and Dhuhr on the summit.", image: "/images/region-snowdonia.jpg" },
  { name: "Scottish Highlands", slug: "scottish-highlands", blurb: "Ben Nevis, Glencoe, the Cuillin. Multi-day Muslim hiking expeditions with full camp support.", image: "/images/region-scottish-highlands.jpg" },
];

const FEATURES = [
  { icon: Shield, title: "Prayer breaks, always", body: "Every route is plotted with prayer times in mind. We carry a compact prayer mat, qibla compass and wudu water — and we stop for Salah, even on a summit." },
  { icon: Heart, title: "100% halal food", body: "Trail snacks, summit lunches, expedition dinners. We cook halal, we cook well, and we always pack extra for the slowest member of the group." },
  { icon: Users, title: "Women-friendly groups", body: "Regular women-only hiking weekends, sisters-only camping trips, and mixed-group hikes where modesty and comfort are the default, not the exception." },
  { icon: Mountain, title: "Qualified mountain leaders", body: "Every guide holds a Mountain Training qualification, first-aid certification, and a genuine love of both the hills and the deen." },
  { icon: Compass, title: "Beginners very welcome", body: "About half our group has never hiked before. We grade every route, pace every day, and pair you with someone who's done it before." },
  { icon: Calendar, title: "Small groups, year-round", body: "Maximum 12 hikers per group, all-year calendar. Book one weekend, you'll be back for the next one." },
];

const TESTIMONIALS = [
  { name: "Aisha M.", location: "Manchester", quote: "I'd never hiked a mountain in my life. Badr took me up Helvellyn last spring — I cried at the top. They've thought of every detail for a Muslim hiker." },
  { name: "Yusuf & family", location: "London", quote: "We took the kids (ages 7 and 10) on a Peak District weekend. Prayer breaks felt completely natural, the food was incredible, and the kids are already asking when we're going back." },
  { name: "Bilal H.", location: "Birmingham", quote: "Finally — a hiking group that doesn't make me choose between my fitness and my faith. The guides are qualified, the vibes are immaculate, and the views are unreal." },
];

const FAQS = [
  { q: "What is Muslim hiking?", a: "Muslim hiking is outdoor hiking (walking up mountains, hills and nature trails) organised around the needs of Muslim participants. That means prayer breaks built into the route, halal food on every trip, women-friendly group options, modest dress respected, and a community where deen and the outdoors go hand in hand. Badr Adventures is the UK's leading Muslim hiking group." },
  { q: "Do I need to be fit to come on a Muslim hiking trip?", a: "Not at all. About half our group has never hiked before they joined us. We grade every route from 'gentle first mountain' to 'multi-day expedition', and we pace every day to the slowest hiker." },
  { q: "Is the food halal?", a: "Yes — 100%. Trail snacks, lunches on the summit, expedition dinners, even the emergency chocolate. Everything is halal, and we can cater for vegetarian, vegan, and common allergies with advance notice." },
  { q: "How do prayer breaks work on a hike?", a: "Every route is plotted with prayer times in mind. We carry a compact prayer mat, a qibla compass, and a bottle of wudu water in every group. We stop for Fajr, Dhuhr, Asr, Maghrib and Isha — even if we're 20 minutes from the summit." },
  { q: "Do you run women-only Muslim hiking trips?", a: "Yes. We run a regular programme of sisters-only hiking weekends, women-only camping trips, and modest mixed-group hikes. Browse upcoming dates on our hikes page." },
  { q: "Where in the UK do you run Muslim hiking trips?", a: "All over. The Lake District, Peak District, Snowdonia (Eryri), Scottish Highlands, Yorkshire Dales, Brecon Beacons, the South Downs, and the Kent Downs. If there's a hill, we'll take you up it." },
  { q: "How do I book a Muslim hiking trip?", a: "Browse upcoming hikes on our hikes page, pick a date and route, and book online. A small deposit secures your place, and the balance is due 4 weeks before the trip." },
];

export default function MuslimHikingPage() {
  usePageSeo({
    path: "/muslim-hiking",
    title: "Muslim Hiking UK | Guided Hikes, Camping & Adventures | Badr Adventures",
    description:
      "Muslim hiking across the UK with Badr Adventures. Guided hikes, wild camping and family adventures in the Lake District, Peak District, Snowdonia and Scottish Highlands — with prayer breaks, halal food and women-friendly groups. Beginners welcome.",
    keywords: [
      "Muslim hiking",
      "Muslim hiking UK",
      "Muslim hikers",
      "halal hiking",
      "Islamic hiking group",
      "Muslim hiking club UK",
      "women's Muslim hiking",
      "family Muslim hiking",
      "Muslim hiking beginners",
      "Muslim hiking Lake District",
      "Muslim hiking Peak District",
      "Muslim hiking Snowdonia",
      "Muslim hiking Scotland",
    ],
  });

  useJsonLd(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Muslim Hiking", path: "/muslim-hiking" }]));
  useJsonLd(faqJsonLd(FAQS.map((f) => ({ question: f.q, answer: f.a }))));

  return (
    <div className="bg-paper text-ink">
      <section className="relative overflow-hidden border-b border-ink/10 bg-gradient-to-b from-[#0d1f1a] via-[#102a23] to-[#0d1f1a] text-paper">
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-paper/80 backdrop-blur">
            <Sparkles className="h-3 w-3 text-[var(--ochre)]" />
            The UK's #1 Muslim hiking community
          </span>
          <h1 className="mt-8 max-w-4xl font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-[88px]">
            Muslim hiking, <span className="italic text-[var(--ochre)]">done properly.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/80">
            Badr Adventures is the UK's leading Muslim hiking group. We run guided hikes, wild camping weekends and family adventures in the Lake District, Peak District, Snowdonia and Scottish Highlands — with prayer breaks built in, halal food on every trip, women-friendly groups, and qualified mountain leaders. Beginners welcome.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link to="/hikes" className="group inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-[0_18px_40px_-12px_rgba(232,168,75,0.6)] transition hover:bg-[#f0b75e]">
              See upcoming Muslim hiking trips
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/about" className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-6 py-3 text-sm font-medium text-paper backdrop-blur transition hover:border-paper/50 hover:bg-paper/10">
              How Badr Adventures works
            </Link>
          </div>
          <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-sm border border-paper/15 bg-paper/10 font-mono text-paper sm:grid-cols-4">
            {[
              { k: "40+", l: "Routes mapped" },
              { k: "500+", l: "Muslim hikers guided" },
              { k: "4.9 / 5", l: "Average rating" },
              { k: "100%", l: "Qualified guides" },
            ].map((s) => (
              <div key={s.l} className="bg-ink/40 p-5 backdrop-blur">
                <dt className="font-serif text-3xl text-[var(--ochre)]">{s.k}</dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.24em] text-paper/70">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="max-w-3xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">What we do</span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">The Muslim hiking group, built around the deen.</h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-2">
            We started Badr Adventures because we wanted to hike — and we wanted to do it as Muslims, not in spite of it. Every detail of every trip, from the route card to the meal plan to the prayer timetable, is built around the fact that we pray five times a day, eat halal, value modesty, and turn up with families in mind. This is hiking that fits the rest of your life, not the other way round.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="border-ink/10 bg-paper">
              <CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rust/10 text-rust">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-xl font-semibold">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-paper-2/40">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">Where we go</span>
              <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Muslim hiking across the UK.</h2>
              <p className="mt-6 text-lg leading-relaxed text-ink-2">From the Lake District to the Highlands, we run Muslim hiking trips in every major UK range. Pick a region and see upcoming dates.</p>
            </div>
            <Link to="/hikes" className="group inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/40">
              See all upcoming hikes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {REGIONS.map((r) => (
              <Link key={r.slug} to={`/hikes?region=${r.slug}`} className="group">
                <Card className="h-full border-ink/10 bg-paper transition group-hover:border-rust/40 group-hover:shadow-lg">
                  <CardContent className="p-6">
                    <MapPin className="h-5 w-5 text-rust" />
                    <h3 className="mt-4 font-serif text-2xl font-semibold">{r.name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-2">{r.blurb}</p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-rust">
                      Browse hikes <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="max-w-3xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">From the community</span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">What Muslim hikers say about Badr.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="border-ink/10 bg-paper">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 text-[var(--ochre)]">
                  {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="h-4 w-4 fill-current" />))}
                </div>
                <p className="mt-4 font-serif text-lg leading-snug text-ink">"{t.quote}"</p>
                <p className="mt-5 text-sm font-medium text-ink-2">{t.name}</p>
                <p className="text-xs text-ink-3">{t.location}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-paper-2/40">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8 lg:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">FAQ</span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Muslim hiking — questions answered.</h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-ink/10 bg-paper p-6 open:border-rust/40">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-serif text-lg font-medium">
                  {f.q}
                  <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink-2 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24 text-center sm:px-8 lg:px-10">
        <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Ready for your first Muslim hiking trip?</h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">Pick a date, pick a route, and we'll do the rest. No kit list panic, no awkwardness, no compromises. Just mountains, community, and a packed prayer mat.</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/hikes" className="group inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-[0_18px_40px_-12px_rgba(232,168,75,0.6)] transition hover:bg-[#f0b75e]">
            See upcoming hikes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/40">
            Ask a question
          </Link>
        </div>
      </section>
    </div>
  );
}
