import { Link } from "react-router-dom";
import { ArrowRight, Calendar, CheckCircle2, Clock, MapPin, Mountain, Star } from "lucide-react";
import { usePageSeo, useJsonLd } from "@/lib/seo";
import { faqJsonLd, breadcrumbJsonLd, howToJsonLd, speakableJsonLd } from "@/lib/json-ld";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  { title: "Pick your level", desc: "We grade every route from Gentle First Mountain to Multi-Day Expedition. First-timers start on our easy day-walks (3–5 miles, gentle ascent). Kids aged 5+ can manage most beginner routes." },
  { title: "Book online", desc: "Pick a date, pay a deposit, and we'll send you the joining instructions — meeting point, kit list, car-share options, and prayer timetable for the day." },
  { title: "Pack your kit", desc: "Boots, waterproof, daypack, prayer mat, qibla compass, water bottle. Full kit list is on every trip page. We can lend gear — just ask." },
  { title: "Arrive and hike", desc: "Meet the group, meet your guide. We do a safety brief, a kit check, then head out. Prayer stops are on the route card — Fajr, Dhuhr, Asr, Maghrib and Isha all plotted." },
  { title: "Summit, pray, eat, descend", desc: "Every hike includes a summit stop for Dhuhr (or whichever prayer falls mid-mountain), a hot halal lunch, and a safe descent before the weather turns." },
];

const SECTIONS = [
  {
    title: "Choose your region",
    icon: MapPin,
    items: [
      "Peak District — Kinder Scout, Mam Tor, Stanage Edge. 2h from London, 1h from Manchester. Best for first-timers.",
      "Lake District — Helvellyn, Scafell Pike, Catbells. 3h from Manchester. Best for a full weekend.",
      "Snowdonia (Eryri) — Snowdon, Tryfan, Glyderau. 3.5h from Birmingham. Best for ridge walks.",
      "Scottish Highlands — Ben Nevis, Glencoe, Cairngorms. For experienced hikers with 4+ days.",
    ],
  },
  {
    title: "Prayer on the trail",
    icon: Star,
    items: [
      "Every route planned around prayer times — stop for all five salah whether you're on the summit or in the valley.",
      "Group kit includes: compact prayer mat, qibla compass, wudu bottle, spare water for wudu.",
      "Dhuhr is usually the summit prayer — head down after for a safe descent.",
      "Jama'ah (congregation) encouraged when the group stops together — if not, pray individually.",
    ],
  },
  {
    title: "Halal food on the hill",
    icon: CheckCircle2,
    items: [
      "Trail snacks: halal jerky, dates, nuts, flapjacks — provided on every trip.",
      "Summit lunch: halal wraps, sandwiches, or hot food on winter trips.",
      "Dinner on overnight trips: full halal meal cooked at camp or bunkhouse. Vegetarian/vegan available.",
      "Emergency chocolate is always halal-certified.",
    ],
  },
];

const FAQS = [
  { question: "Is Muslim hiking suitable for complete beginners?", answer: "Yes — about half our group has never hiked before they join. We grade every route and pace the day to the slowest hiker. Beginners start on our Green (Gentle) or Blue (Moderate) routes before working up to harder terrain." },
  { question: "What should I wear for a Muslim hike?", answer: "Comfortable modest clothing that dries quickly — joggers or lightweight trousers, long-sleeved top, waterproof jacket, hiking boots or sturdy trainers, and a sun hat or beanie depending on the season. Avoid cotton as it stays wet." },
  { question: "How do women hike with hijab on the trail?", answer: "We recommend a lightweight sports hijab or wicking scarf that dries fast. Many of our sisters wear a breathable underscarf with a loose sports hijab over it. On windy summits, a buff under the hijab stops it lifting." },
  { question: "Can I pray on a hike?", answer: "Yes — every Badr Adventures route is planned with prayer times. We carry group prayer kits (mat, compass, wudu bottle) and stop for all five salah. Dhuhr is usually the summit stop." },
  { question: "How much does a guided Muslim hike cost?", answer: "Day-walks £35–£75 per person (guide fees, packed lunch, group kit). Weekend expeditions £120–£220 per person (guide, meals, accommodation, group kit)." },
  { question: "What if I don't have hiking gear?", answer: "We lend basic kit on a first-come basis for day-walks. For overnight trips, you can rent full kit from our Rent page — tents, sleeping bags, stoves, waterproofs — delivered to your meeting point." },
  { question: "Do you run co-ed Muslim hikes?", answer: "Yes — most of our trips are mixed-gender. We also run a regular sisters-only programme with female Mountain Leaders for those who prefer women-only groups." },
  { question: "How many people are in a group?", answer: "We cap groups at 12 hikers per guide for safety and quality. Popular trips may have 2–3 guides, split into smaller teams on the hill." },
];

export default function MuslimHikingGuidePage() {
  return (
    <main className="min-h-screen bg-[#faf9f6]">
      {/* Open Graph / SEO */}
      <usePageSeo />
      <useJsonLd />

      {/* Hero */}
      <section className="border-b border-stone-200 bg-stone-900 text-stone-100">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <Badge className="mb-4 bg-amber-500/20 text-amber-300">Complete Guide</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            Muslim Hiking UK: The Complete Guide to <span className="text-amber-400">Guided Hikes, Prayer & Halal Adventures</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-stone-300">
            Everything you need to know before your first Muslim-guided hike in the UK — from what to pack
            and how prayer works on the trail, to choosing the right region and booking your first trip.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-400">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 10 min read</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Updated July 2026</span>
          </div>
        </div>
      </section>

      {/* How it works — step-by-step */}
      <section className="border-b border-stone-200 bg-white" aria-label="How Muslim hiking works">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-stone-900 sm:text-3xl">How a Muslim-guided hike works</h2>
          <p className="mt-2 text-stone-500">From booking to the summit — five steps, no surprises.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={i} className="rounded-xl border border-stone-200 bg-[#faf9f6] p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-stone-900">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-stone-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sections grid */}
      {SECTIONS.map((section) => (
        <section key={section.title} className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
            <div className="flex items-center gap-3">
              <section.icon className="h-6 w-6 text-amber-600" />
              <h2 className="text-2xl font-bold text-stone-900 sm:text-3xl">{section.title}</h2>
            </div>
            <ul className="mt-8 space-y-4">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-stone-600">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* CTA: Browse hikes */}
      <section className="bg-stone-900 text-stone-100">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to book your first Muslim hike?</h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-400">
            Browse upcoming trips — all guided, halal-fed, and plotted with prayer breaks.
            Beginners welcome on every route.
          </p>
          <Link
            to="/hikes"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-stone-900 transition-colors hover:bg-amber-400"
          >
            See upcoming hikes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-stone-900 sm:text-3xl">Frequently asked questions</h2>
          <div className="mt-8 space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="group rounded-xl border border-stone-200 open:border-amber-500/30">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-medium text-stone-900">
                  {faq.question}
                  <span className="ml-2 shrink-0 text-stone-400 transition group-open:rotate-180">▼</span>
                </summary>
                <div className="border-t border-stone-100 px-5 py-4 text-sm leading-relaxed text-stone-500">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related pages */}
      <section className="border-t border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">More Muslim hiking guides</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: "/muslim-hiking/beginners", label: "For Beginners" },
              { to: "/muslim-hiking/women", label: "For Women" },
              { to: "/muslim-hiking/near-me", label: "Near Me" },
              { to: "/muslim-hiking/uk", label: "UK Guide" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-amber-500/30 hover:text-amber-700"
              >
                <Mountain className="h-4 w-4 text-amber-500" />
                {link.label}
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-stone-300" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
