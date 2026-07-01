import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Heart,
  MapPin,
  Mountain,
  Shield,
  Sparkles,
  Star,
  Users,
  Tent,
  Sun,
} from "lucide-react";
import { usePageSeo, useJsonLd } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/json-ld";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const UPCOMING_WOMENS = [
  {
    title: "Sisters-only Lake District weekend",
    region: "Lake District",
    date: "Saturday–Sunday",
    blurb:
      "Helvellyn Saturday, Catbells Sunday. Female Mountain Leader, sisters-only prayer space, halal hot meal Saturday night.",
  },
  {
    title: "Sisters-only Snowdonia weekend",
    region: "Snowdonia (Eryri)",
    date: "Saturday–Sunday",
    blurb:
      "Snowdon via the Llanberis path, then a Sunday ridge walk. Modest kit, no mixed-group photos, no compromises.",
  },
  {
    title: "Sisters-only Peak District day",
    region: "Peak District",
    date: "Saturday",
    blurb:
      "Mam Tor & the Great Ridge, with a long lunch stop and a chance to plan the next sisters' trip together.",
  },
  {
    title: "Ramadan trail — sisters' iftar hikes",
    region: "Across the UK",
    date: "During Ramadan",
    blurb:
      "Sunset-only hikes timed to iftar on the trail. Short, social, and finished in time for maghrib wherever you are.",
  },
];

const WHAT_TO_EXPECT = [
  {
    icon: Shield,
    title: "Female Mountain Leaders",
    body: "Every sisters-only trip is led by a qualified female Mountain Leader (summer or winter Mountain Training award), with current first-aid and safeguarding certification.",
  },
  {
    icon: Heart,
    title: "Sisters-only prayer space",
    body: "We set up a dedicated, screened prayer space at the trailhead, the summit, and the campsite. Wudu water, prayer mats, and a qibla compass — all provided.",
  },
  {
    icon: Users,
    title: "Modest by default",
    body: "Modest dress is the default, not the exception. We hike in long sleeves, long trousers (or hiking skirts/zip-offs) and headscarves where asked. No mixed-group photos without consent.",
  },
  {
    icon: Tent,
    title: "Sisters-only camping",
    body: "All overnight trips run with a sisters-only tent area, sisters-only bathroom rota, and a male-free camp kitchen. Brothers-only trips are scheduled separately.",
  },
  {
    icon: Sun,
    title: "Beginners very welcome",
    body: "The majority of women on our sisters-only weekends have never hiked a mountain before. We pair first-timers with someone who's done it before and pace every day to the slowest hiker.",
  },
  {
    icon: Mountain,
    title: "Across the UK, all year",
    body: "Lake District, Peak District, Snowdonia, Brecon Beacons, South Downs, Scottish Highlands. Sisters-only weekends run at least twice a month, plus sisters-only day walks in between.",
  },
];

const FAQS = [
  {
    question: "What is a sisters-only Muslim hiking trip?",
    answer:
      "A sisters-only Muslim hiking trip is a guided hike or weekend run for Muslim women only. The trip is led by a qualified female Mountain Leader, the group is women-only, the prayer space is sisters-only, the camp is sisters-only, and the kit expectations are modest by default. Mixed-group trips are also available for those who prefer them.",
  },
  {
    question: "Do I need to wear a headscarf on a sisters-only hike?",
    answer:
      "Headscarves are welcome but never required. Most sisters on our trips wear a sports hijab, a buff, or a brimmed hat — whatever feels right. The only kit that genuinely matters is waterproof boots, a waterproof jacket, and a modest base layer.",
  },
  {
    question: "Are children welcome on sisters-only Muslim hiking trips?",
    answer:
      "Yes — most of our sisters-only weekends are family-friendly from age 8 upward, with shorter routes sized for younger legs. We run dedicated mother-and-daughters weekends twice a year, usually in the Lake District and the Peak District.",
  },
  {
    question: "How fit do I need to be for a sisters-only hike?",
    answer:
      "Not very. About 60% of our community has never hiked before joining. We grade every route from 'first-mountain gentle' to 'multi-day expedition' and pace every day to the slowest hiker. The mountains will still be there next weekend.",
  },
  {
    question: "Is sisters-only Muslim hiking available across the UK?",
    answer:
      "Yes. We run sisters-only weekends in the Lake District, Peak District, Snowdonia, Brecon Beacons, the South Downs and the Scottish Highlands, with at least two sisters-only weekends a month. Day walks are also available in most regions.",
  },
  {
    question: "How do I book a sisters-only Muslim hiking trip?",
    answer:
      "Browse upcoming hikes on our hikes page, filter by 'sisters-only', pick a date, and book online. A small deposit secures your place. If you're unsure, message us and we'll help you pick the right trip for your level.",
  },
  {
    question: "Can I come alone?",
    answer:
      "Most women on our sisters-only weekends come alone the first time. By the end of the weekend, you've usually got a WhatsApp group, a list of future trips, and a friend to go with next time. That's the point.",
  },
];

export default function MuslimHikingWomenPage() {
  usePageSeo({
    path: "/muslim-hiking/women",
    title:
      "Sisters-Only Muslim Hiking UK | Women's Hiking Groups | Badr Adventures",
    description:
      "Sisters-only Muslim hiking weekends across the UK. Lake District, Peak District, Snowdonia and the Scottish Highlands — female Mountain Leaders, sisters-only prayer space, halal food, modest by default. Beginners welcome.",
    keywords: [
      "sisters only Muslim hiking",
      "women's Muslim hiking UK",
      "Muslim women hiking",
      "female Muslim hiking group",
      "hijab hiking UK",
      "Muslim women's hiking club",
      "sisters hiking weekend",
      "ladies Muslim hiking",
      "mother daughter hiking UK",
      "women only hiking group Muslim",
    ],
  });

  useJsonLd(
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Muslim Hiking", path: "/muslim-hiking" },
      { name: "For Women", path: "/muslim-hiking/women" },
    ]),
  );
  useJsonLd(faqJsonLd(FAQS));

  return (
    <div className="bg-paper text-ink">
      {/* HERO */}
      <section
        className="relative overflow-hidden border-b border-ink/10 text-paper"
        style={{
          background:
            "linear-gradient(180deg, #1a0d1f 0%, #2a1023 60%, #1a0d1f 100%)",
        }}
      >
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-paper/80 backdrop-blur">
            <Sparkles className="h-3 w-3 text-[var(--ochre)]" />
            Sisters-only · led by female Mountain Leaders
          </span>
          <h1
            data-speakable="true"
            className="mt-8 max-w-4xl font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-[80px]"
          >
            Muslim women's hiking,{" "}
            <span className="italic text-[var(--ochre)]">
              sisters-only, led by sisters.
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/80">
            Badr Adventures runs sisters-only Muslim hiking weekends and day
            walks across the UK. Every trip is led by a qualified female
            Mountain Leader, with sisters-only prayer spaces, halal food,
            modest kit by default, and a community of women who hike together
            once and come back for life.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/hikes"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-[0_18px_40px_-12px_rgba(232,168,75,0.6)] transition hover:bg-[#f0b75e]"
            >
              See upcoming sisters-only hikes
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/muslim-hiking/beginners"
              className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-6 py-3 text-sm font-medium text-paper backdrop-blur transition hover:border-paper/50 hover:bg-paper/10"
            >
              New to hiking? Start here
            </Link>
          </div>
          <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-sm border border-paper/15 bg-paper/10 font-mono text-paper sm:grid-cols-4">
            {[
              { k: "2 / month", l: "Sisters-only weekends" },
              { k: "100%", l: "Female-led groups" },
              { k: "4.9 / 5", l: "Average rating" },
              { k: "All UK", l: "Lakes, Peaks, Eryri" },
            ].map((s) => (
              <div key={s.l} className="bg-ink/40 p-5 backdrop-blur">
                <dt className="font-serif text-3xl text-[var(--ochre)]">
                  {s.k}
                </dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.24em] text-paper/70">
                  {s.l}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* THE 3-MINUTE ANSWER */}
      <section className="border-b border-ink/10 bg-paper-2/40 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
            ◇ The 3-minute answer
          </p>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-ink">
            Sisters-only Muslim hiking in the UK — what's actually involved
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-2">
            Sisters-only Muslim hiking is a guided hike or weekend run for
            Muslim women only. The trip is led by a qualified female Mountain
            Leader (summer or winter Mountain Training award), the group is
            women-only, the prayer space is sisters-only, and the kit list
            defaults to modest dress. Badr Adventures runs at least two
            sisters-only weekends a month in the Lake District, Peak District,
            Snowdonia, the South Downs, the Brecon Beacons and the Scottish
            Highlands, plus sisters-only day walks in between. Day walks from
            £35, overnight weekends from £120. Beginners very welcome — about
            60% of our community has never hiked a mountain before joining.
          </p>
        </div>
      </section>

      {/* WHAT TO EXPECT */}
      <section className="border-b border-ink/10 py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
              What to expect
            </span>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              What a sisters-only Muslim hiking weekend looks like.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WHAT_TO_EXPECT.map((f) => (
              <Card key={f.title} className="border-ink/10 bg-paper">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rust/10 text-rust">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-semibold">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">
                    {f.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING SISTERS-ONLY */}
      <section className="border-b border-ink/10 bg-paper-2/40 py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
                Upcoming sisters-only
              </span>
              <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                Sisters-only Muslim hiking weekends across the UK.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-ink-2">
                Browse the next four sisters-only weekends and day walks. Live
                dates and booking on the hikes page.
              </p>
            </div>
            <Link
              to="/hikes"
              className="group inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/40"
            >
              See all upcoming hikes
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {UPCOMING_WOMENS.map((u) => (
              <Card
                key={u.title}
                className="h-full border-ink/10 bg-paper transition hover:border-rust/40"
              >
                <CardContent className="p-6">
                  <Badge
                    variant="outline"
                    className="border-rust/40 bg-rust/5 font-mono text-[10px] uppercase tracking-[0.2em] text-rust"
                  >
                    Sisters-only
                  </Badge>
                  <h3 className="mt-4 font-serif text-xl font-semibold">
                    {u.title}
                  </h3>
                  <p className="mt-2 flex items-center gap-1 text-xs text-ink-3">
                    <MapPin className="h-3 w-3" />
                    {u.region}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-ink-3">
                    <Calendar className="h-3 w-3" />
                    {u.date}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-ink-2">
                    {u.blurb}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-ink/10 py-20">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
            FAQ
          </span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Sisters-only Muslim hiking — questions answered.
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

      {/* FINAL CTA */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center sm:px-8 lg:px-10">
        <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Ready to hike with the sisters?
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          Pick a sisters-only weekend, pick a date, and we'll do the rest. No
          kit panic, no awkwardness, no compromises. Just sisters, mountains,
          and a packed prayer mat.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/hikes"
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-[0_18px_40px_-12px_rgba(232,168,75,0.6)] transition hover:bg-[#f0b75e]"
          >
            See sisters-only hikes
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/40"
          >
            Ask a question
          </Link>
        </div>
      </section>
    </div>
  );
}
