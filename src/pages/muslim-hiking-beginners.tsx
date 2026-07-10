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
  Waves,
  Tent,
  Sun,
  Footprints,
  Backpack,
} from "lucide-react";
import { usePageSeo, useJsonLd } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/json-ld";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FIRST_PEAKS = [
  { name: "Catbells", region: "Lake District", height: "451 m", blurb: "The UK's friendliest first mountain. 4-mile loop, gentle ridge, big-lake views. Magrib on the top is unforgettable." },
  { name: "Mam Tor", region: "Peak District", height: "517 m", blurb: "The 'shivering mountain'. Quick to reach from Manchester, easy underfoot, with a café at the base for the post-hike kebab (halal, naturally)." },
  { name: "Pen y Fan", region: "Brecon Beacons", height: "886 m", blurb: "South Wales's highest peak. A clear, well-maintained path from the Storey Arms car park — busy on a Saturday for good reason." },
  { name: "Butser Hill", region: "South Downs", height: "270 m", blurb: "Chalk, rolling, almost flat. Perfect for a first hike with kids or for iftars on the trail in Ramadan." },
  { name: "Snowdon (Llanberis Path)", region: "Snowdonia", height: "1,085 m", blurb: "Wales's highest, and the easiest way up. Long, but never technical. Treat it as a day, not a sprint." },
  { name: "Ben Lomond", region: "Scottish Highlands", height: "974 m", blurb: "The Highlands' most approachable Munro. Loch-side start, steady climb, astonishing views from the summit ridge." },
];

const KIT_BASICS = [
  { item: "Waterproof boots", note: "Ankle support. Trainers are not enough — wet grass, slate, and bog will punish them. Rent from us if you don't have any." },
  { item: "Waterproof jacket", note: "Gore-tex or equivalent. The UK hills make their own weather. A £30 Decathlon jacket will see you through your first year." },
  { item: "25–30L rucksack", note: "Big enough for a packed lunch, two water bottles, waterproofs, and a spare layer. Not the daypack you take to the office." },
  { item: "Head torch + spare batteries", note: "In summer, a 6pm finish can still need a head torch for the last mile of forest. Pack one as standard." },
  { item: "Water bottles (2L total)", note: "UK hills are wetter than people think. Two litres, minimum, even on a cool day." },
  { item: "Packed lunch + emergency snacks", note: "We always bring extra, but bring your own summit chocolate. Trail morale matters." },
  { item: "Compact prayer mat", note: "Fits in a side pocket. We also carry a group mat and a qibla compass in every group kit." },
  { item: "Modest base layers", note: "Long sleeves, long trousers (or a hiking skirt/zip-offs). The mountains are the same as everyone else's — only the kit list cares that you're dressed modestly." },
];

const FAQS = [
  {
    question: "I've never hiked before — can I really start with Muslim hiking?",
    answer:
      "Yes. Around 60% of our community have never hiked a mountain before joining us. We grade every route from 'first-mountain gentle' to 'multi-day expedition', pace the group to the slowest hiker, pair first-timers with someone who's done it before, and lend kit where we can. The hardest part is booking the date.",
  },
  {
    question: "What is the easiest mountain in the UK for a Muslim hiking beginner?",
    answer:
      "Catbells in the Lake District. 451 m, 4 miles, a clear path the whole way, big-lake views, and a summit you can stand on and feel like you've done something. Most of our first-time hikers start there. Mam Tor in the Peak District and Ben Lomond in Scotland are the next step up.",
  },
  {
    question: "I'm not very fit — will I slow the group down?",
    answer:
      "You will be the slowest hiker in the group, on average, twice a year. We pace every group to its slowest member, every single time. The hill isn't going anywhere.",
  },
  {
    question: "Do I need to be Muslim to come on a beginner Muslim hiking trip?",
    answer:
      "No. Badr Adventures is a Muslim hiking group, but everyone is welcome on our mixed-group trips. The prayer breaks are brief and optional to observe, the food is halal so it's safe for everyone, and the vibe is 'come as you are'. Sisters-only and brothers-only trips are still kept that way out of respect for the group.",
  },
  {
    question: "What if I don't have any hiking kit?",
    answer:
      "We'll lend you what we can — boots, waterproofs, rucksacks. The bare minimum you need to buy is a pair of sports leggings or hiking trousers you can move in, and a decent pair of walking socks. Everything else is in our rental page. We have a free kit guide on the blog too.",
  },
  {
    question: "How long is a typical Muslim hiking weekend for beginners?",
    answer:
      "A Saturday–Sunday weekend: drive in Saturday morning, hike a smaller peak (Catbells, Mam Tor, Butser Hill) on Saturday afternoon, Maghrib and dinner together Saturday night, a bigger peak (Helvellyn, Kinder Scout, Pen y Fan) on Sunday, home Sunday evening. No experience needed. Around £140 per person including guide, food, and bunkhouse.",
  },
  {
    question: "Will I keep up on the prayer breaks?",
    answer:
      "Yes. We build the route around the prayer times, with Fajr, Dhuhr, Asr, Maghrib and Isha all in the schedule. The hike leader carries a prayer timetable and we stop, pray as a group (or separately for brothers and sisters), and then carry on. The mountains are the same for everyone, but the day is built around the deen.",
  },
  {
    question: "What shoes do I need to start Muslim hiking?",
    answer:
      "Waterproof hiking boots with ankle support. The single most important piece of kit. Anything from Merrell, Salomon, Scarpa, or even Decathlon's Quechua range (MH500) will see you through a first season. Avoid running shoes, Converse, or any flat-soled shoe.",
  },
];

export default function MuslimHikingBeginnersPage() {
  usePageSeo({
    path: "/muslim-hiking/beginners",
    title:
      "Muslim Hiking for Beginners: Start Your First UK Mountain | Badr Adventures",
    description:
      "New to Muslim hiking? The UK's beginner-friendly Muslim hiking group. Easy first peaks, prayer-friendly routes, halal food, women-friendly groups, kit you can borrow. Lake District, Peak District, Snowdonia & more. From £140 for a full weekend.",
    keywords: [
      "Muslim hiking beginners",
      "beginner Muslim hiking UK",
      "Muslim hiking for beginners",
      "first Muslim hike",
      "easy Muslim hiking",
      "Muslim hiking near me",
      "Muslim hiking starter",
      "new to Muslim hiking",
      "Muslim hiking first mountain",
    ],
  });

  useJsonLd(
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Muslim Hiking", path: "/muslim-hiking" },
      { name: "For Beginners", path: "/muslim-hiking/beginners" },
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
            "linear-gradient(180deg, #0d1f1a 0%, #102a23 60%, #0d1f1a 100%)",
        }}
      >
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-paper/80 backdrop-blur">
            <Sparkles className="h-3 w-3 text-[var(--ochre)]" />
            Beginner's guide · 2026
          </span>
          <h1 className="mt-8 max-w-4xl font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-[80px]">
            Muslim hiking,{" "}
            <span className="italic text-[var(--ochre)]">from zero to summit.</span>
          </h1>
          <p
            data-speakable="true"
            className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/80"
          >
            The beginner's guide to Muslim hiking in the UK. Easy first peaks,
            the kit you actually need (and the kit you don't), what prayer
            breaks look like on a hill, and how to book a weekend that will
            get you up your first mountain — even if you've never owned a pair
            of boots.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/hikes"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-[0_18px_40px_-12px_rgba(232,168,75,0.6)] transition hover:bg-[#f0b75e]"
            >
              See upcoming beginner hikes
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/muslim-hiking"
              className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-6 py-3 text-sm font-medium text-paper backdrop-blur transition hover:border-paper/50 hover:bg-paper/10"
            >
              Full Muslim hiking hub
            </Link>
          </div>
          <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-sm border border-paper/15 bg-paper/10 font-mono text-paper sm:grid-cols-4">
            {[
              { k: "60%", l: "First-time hikers" },
              { k: "8", l: "Starter peaks" },
              { k: "£35", l: "From per day" },
              { k: "100%", l: "Kit available" },
            ].map((s) => (
              <div key={s.l} className="bg-ink/40 p-5 backdrop-blur">
                <dt className="font-serif text-3xl text-[var(--ochre)]">{s.k}</dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.24em] text-paper/70">
                  {s.l}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* THE 3-MINUTE ANSWER — for AI search / answer engines */}
      <section className="border-b border-ink/10 bg-paper-2/40">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:px-8 lg:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
            The 3-minute answer
          </span>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            What is Muslim hiking for beginners?
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-2">
            Muslim hiking for beginners is guided mountain walking in the UK,
            organised so that someone who has never owned a pair of hiking
            boots can comfortably summit their first peak. The "Muslim" part
            means the route is plotted around the day's five prayer times, the
            food is 100% halal, modest dress is respected, the group has
            women-friendly and sisters-only options, and the mountain leader
            is themselves Muslim — so questions about wudu, athan at the
            summit, and shortening the prayer on a long ridge get a
            knowledgeable answer.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">
            The "beginner" part means you don't need any kit to start. We lend
            boots, waterproofs and rucksacks on a first-come basis, every
            route is graded from "gentle first mountain" to "multi-day
            expedition", and the group is paced to its slowest hiker, every
            single time. Most of our first-time hikers are on their first
            mountain within 6 weeks of joining.
          </p>
        </div>
      </section>

      {/* FIRST PEAKS */}
      <section className="border-b border-ink/10">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
              Where to start
            </span>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              The UK's eight best first Muslim hikes.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-2">
              These are the mountains we put first-time Muslim hikers on. All
              of them are below 1,100 m, have clear paths the whole way, and
              have a café (or a halal takeaway) within an hour of the summit.
              Pick one. The rest will follow.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FIRST_PEAKS.map((p) => (
              <Card
                key={p.name}
                className="h-full border-ink/10 bg-paper transition hover:border-rust/40 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-xl font-semibold text-ink">
                      {p.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-ink/20 bg-transparent font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2"
                    >
                      {p.height}
                    </Badge>
                  </div>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-rust">
                    <MapPin className="mr-1 inline h-3 w-3" /> {p.region}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-ink-2">
                    {p.blurb}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT TO EXPECT — a 'how the day works' section for AI overview */}
      <section className="border-b border-ink/10 bg-paper-2/40">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:px-8 lg:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
            What to expect
          </span>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            A typical Muslim hiking day, for a first-timer
          </h2>
          <ol className="mt-10 space-y-6 text-lg leading-relaxed text-ink-2">
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust font-mono text-sm text-paper">
                1
              </span>
              <div>
                <strong className="text-ink">Meet at 7am.</strong> Car-share
                from a major city train station, or drive to the trailhead. The
                guide does a kit check (boots, waterproofs, lunch, water, prayer
                mat), we do Fajr together, then we start walking.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust font-mono text-sm text-paper">
                2
              </span>
              <div>
                <strong className="text-ink">Walk, slowly, together.</strong> A
                typical first Muslim hike covers 4–6 miles, 400–800 m of ascent,
                and is paced to the slowest hiker. The guide stops the group
                every 45 minutes for water and a breath.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust font-mono text-sm text-paper">
                3
              </span>
              <div>
                <strong className="text-ink">Prayer breaks, built in.</strong>{" "}
                If Dhuhr or Asr falls on the mountain, the guide leads the
                group to a sheltered spot, lays out the group prayer mat, and
                we stop for 15 minutes. Brothers and sisters pray in separate
                spaces where the group is mixed.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust font-mono text-sm text-paper">
                4
              </span>
              <div>
                <strong className="text-ink">Summit, du'a, photos.</strong>{" "}
                We reach the summit (most first hikes are 3–4 hours in), make
                du'a together, take photos, and have lunch with a view. The
                guide talks about the route back down and safety on descents.
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust font-mono text-sm text-paper">
                5
              </span>
              <div>
                <strong className="text-ink">Back down for Maghrib.</strong>{" "}
                We aim to be off the mountain before Maghrib. Hot halal food
                at the trailhead (or a curry in town for big weekends), Isha,
                and home — or bunkhouse if it's an overnight.
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* KIT YOU ACTUALLY NEED */}
      <section className="border-b border-ink/10">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
                Kit list
              </span>
              <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                The kit you actually need.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-ink-2">
                You don't need much to start. The list below is the entire kit
                for a first Muslim hiking day. We lend everything on the list
                on a first-come basis, and we rent the lot on the{" "}
                <Link to="/rent" className="text-rust underline">
                  Rent page
                </Link>
                . Buy what you can, borrow the rest, and upgrade as you get
                into it.
              </p>
            </div>
            <ul className="grid gap-px overflow-hidden rounded-sm border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:col-span-7">
              {KIT_BASICS.map((k) => (
                <li key={k.item} className="bg-paper p-6">
                  <div className="flex items-baseline gap-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-rust" />
                    <h3 className="font-serif text-lg font-semibold text-ink">
                      {k.item}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    {k.note}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-ink/10 bg-paper-2/40">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8 lg:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
            FAQ
          </span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Muslim hiking for beginners — your questions answered.
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
          Ready for your first Muslim hiking weekend?
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          We run a beginner-friendly Muslim hiking weekend almost every month.
          Pick a date, pick a route, and we'll do the rest. No kit list panic,
          no awkwardness, no compromises. Just mountains, community, and a
          packed prayer mat.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/hikes"
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-[0_18px_40px_-12px_rgba(232,168,75,0.6)] transition hover:bg-[#f0b75e]"
          >
            See upcoming beginner hikes{" "}
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
