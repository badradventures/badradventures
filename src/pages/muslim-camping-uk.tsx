import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  Mountain,
  Sparkles,
  Star,
  Tent,
  Users,
  Waves,
  FireExtinguisher,
  Shield,
  Sun,
} from "lucide-react";
import { usePageSeo, useJsonLd } from "@/lib/seo";
import { faqJsonLd, breadcrumbJsonLd } from "@/lib/json-ld";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CAMPING_TYPES = [
  {
    icon: Tent,
    title: "Guided wild camping weekends",
    body: "Multi-day trips into the Lake District, Snowdonia and the Highlands. We carry the group kit (tents, stoves, group shelter), you bring your boots and your prayer mat. Halal camp meals, Fajr on the fellside, and a night under the stars with no light pollution.",
  },
  {
    icon: Sun,
    title: "Family camping weekends",
    body: "Shorter walks, base-camp style. We set up a central camp with proper tents, a field kitchen (halal, of course), prayer marquee, and day-walks sized for kids. Family-friendly camping trips run at least four times a year.",
  },
  {
    icon: Users,
    title: "Sisters-only camping trips",
    body: "Women-only wild camping weekends with a female Mountain Leader, sisters-only tent area, and a camp kitchen managed by sisters. Modest dress is the default, and the prayer space is screened.",
  },
  {
    icon: Compass,
    title: "Skills weekends (learn to camp)",
    body: "A weekend course in the Peak District or South Downs covering: tent pitching, stove safety, Leave No Trace, navigation, wild camping legality in Scotland vs England, and how to integrate salah into a camp day. All kit provided.",
  },
  {
    icon: FireExtinguisher,
    title: "Ramadan camping retreats",
    body: "Sunset-to-sunrise camping experiences during Ramadan. Short evening walks, iftar cooked on the fire, taraweeh under the stars, and a pre-dawn suhoor before breaking camp. Held in the South Downs and Brecon Beacons.",
  },
  {
    icon: Waves,
    title: "Camp + hike + kayak combos",
    body: "Multi-activity weekends combining a wild camp, a mountain hike, and a lake kayak session. Lake District and Scottish Highlands. All equipment included, all halal, all prayer-timed.",
  },
];

const CAMPSITES = [
  {
    name: "Great Langdale",
    region: "Lake District",
    fee: "£8–12 pp/night",
    best: "Base for Helvellyn, Scafell Pike, Bowfell",
    halal: "Halal butcher in Ambleside (15 min drive), mosque in Kendal (30 min)",
    wudu: "Running water at the NT campsite, nearby river for fresh wudu",
    tips: "Book ahead in summer. The NT campsite has a shop with basic halal-friendly ingredients.",
  },
  {
    name: "Ravenscar (National Trust)",
    region: "Yorkshire Coast / North York Moors",
    fee: "£7–10 pp/night",
    best: "Coastal walks, Robin Hood's Bay, Cleveland Way",
    halal: "Scarborough has several halal takeaways and a mosque (25 min)",
    wudu: "Campsite has hot showers and running water",
    tips: "Spectacular for Maghrib over the North Sea. Quieter than the Lakes.",
  },
  {
    name: "North Lees Campsite",
    region: "Peak District",
    fee: "£10 pp/night",
    best: "Stanage Edge, Mam Tor, Kinder Scout",
    halal: "Halal butcher in Sheffield (20 min), multiple mosques",
    wudu: "Good facilities, toilets, showers",
    tips: "First-come-first-served weekends. Arrive Friday before 3pm. Stanage Edge sunset is an experience.",
  },
  {
    name: "Gwern Goch (Bunkhouse + Camping)",
    region: "Snowdonia (Eryri)",
    fee: "£10–15 pp/night",
    best: "Snowdon, Tryfan, Glyderau",
    halal: "Bangor has halal butchers (30 min), Llanrwst has a mosque",
    wudu: "Facilities on site. Stream water for wudu nearby.",
    tips: "Wales's midges are fierce July–August. Pack a head net so the group can pray in peace.",
  },
  {
    name: "Glen Coe Camping & Caravanning Site",
    region: "Scottish Highlands",
    fee: "£12–18 pp/night",
    best: "Buachaille Etive Mòr, Glen Coe ridge, Ben Nevis (40 min)",
    halal: "Fort William has a halal butcher (25 min), Glasgow Central Mosque 2h",
    wudu: "Full facilities. Loch water for wudu if you prefer.",
    tips: "Midges June–August are biblical. Bring two head nets. Right-to-roam means you can wild camp anywhere in Scotland.",
  },
  {
    name: "Wild camping (Bothy / Open)",
    region: "Scotland (anywhere accessible)",
    fee: "Free (right to roam)",
    best: "Anywhere in the Scottish Highlands, Islands, or Galloway",
    halal: "Pack your own. There are NO shops on the hill.",
    wudu: "Burn / loch / river water. Bring a filter or purification tablets.",
    tips: "Legal across Scotland under the Land Reform (Scotland) Act 2003. Not legal in England without landowner permission, though the Lake District and Dartmoor have some tolerance.",
  },
  {
    name: "Dartmoor (permissive wild camping)",
    region: "Dartmoor National Park",
    fee: "Free (permissive zones)",
    best: "Dartmoor tors, Yes Tor, High Willhays",
    halal: "Exeter and Plymouth have halal options. Bring packed halal.",
    wudu: "Stream water available but treat it. Pack a filter.",
    tips: "Only certain zones are legal for wild camping. Stick to the permitted areas near Okehampton and post your plans on the Dartmoor camping map.",
  },
];

const KIT = [
  { item: "3–4 season tent", note: "Shared between 2 people on guided trips. We provide for all our camping weekends." },
  { item: "Sleeping bag (comfort rating 0°C)", note: "UK nights are cold even in July. A 3-season bag is the minimum." },
  { item: "Sleeping mat", note: "Inflatable or foam. The ground conducts cold even through a tent floor. We lend these on our trips." },
  { item: "Camp stove + gas canister", note: "For hot drinks, heating wudu water, and cooking iftar at the tent. We provide stoves and fuel on guided camping trips." },
  { item: "Head torch", note: "Essential for night wudu, finding the toilet block at 3am, and reading Qur'an before Fajr. Pack spare batteries." },
  { item: "Compact prayer mat", note: "Your personal one plus a group mat for jama'ah. We carry a large group mat on every camping weekend." },
  { item: "Wudu bottle (1L+ wide-mouth)", note: "The #1 item Muslim campers forget. A wide-mouth bottle is easier to use for wudu than a narrow water bottle." },
  { item: "Warm clothes + waterproofs", note: "The same hiking kit list applies. Nights at camp are colder than the hill. A down jacket or fleece and a wool hat make a huge difference." },
];

const FAQS = [
  {
    question: "What is Muslim camping in the UK?",
    answer: "Muslim camping is wild or campsite-based outdoor camping organised around the needs of Muslim participants: prayer breaks built into the day, halal food on every trip, modest-dress-friendly, women-only options, and a group culture that respects Islamic values. Badr Adventures runs Muslim camping weekends across the Lake District, Peak District, Snowdonia and the Scottish Highlands.",
  },
  {
    question: "Is wild camping legal in the UK?",
    answer: "It depends where you are. In Scotland, wild camping is legal everywhere under the Land Reform (Scotland) Act 2003 — you can pitch a tent on most unenclosed land. In England and Wales, wild camping requires landowner permission except in Dartmoor's permissive zones and a few other specific areas. Badr Adventures runs guided camping trips that use either booked campsites or (in Scotland) permitted wild camping spots where we have landowner agreements.",
  },
  {
    question: "Do I need my own camping kit?",
    answer: "No. On all Badr Adventures guided camping weekends, we provide the group kit: tents, stoves, cooking equipment, group shelter, first aid, and prayer mat. You just need your personal sleeping bag, mat, head torch, and wudu bottle. Everything is listed on our Rent page and available to hire if you don't own it.",
  },
  {
    question: "How do prayer times work on a camping weekend?",
    answer: "The same as on a hike — we build the schedule around the day's five prayer times. Fajr at camp (before the day's walk), Dhuhr and Asr on the hill (or at camp on rest days), Maghrib and Isha back at camp. We set up a screened prayer space and carry a qibla compass. On sisters-only trips the prayer space is women-only.",
  },
  {
    question: "Is the food halal on camping trips?",
    answer: "100% halal. We plan every meal in advance — trail lunches, one-pot dinners cooked on the camp stove, breakfast, and snacks. On guided trips we cook for the group. On self-led trips we provide a halal meal plan and a list of nearby halal butchers for restocking.",
  },
  {
    question: "Can I bring my children on a Muslim camping trip?",
    answer: "Yes — most of our camping weekends are family-friendly from age 5 upward. We run dedicated family camping weekends four times a year with shorter walks, base-camp days, and children's activities. Family camping trips are clearly marked on the booking page.",
  },
  {
    question: "What about wudu at a campsite?",
    answer: "Most campsites have running water, so wudu is straightforward. On wild camping trips we carry water containers and a wudu bottle, and use streams or loch water (treated with purification tablets where needed). Every Badr Adventures trip carries a group wudu station: a collapsible bucket and a dedicated water container.",
  },
  {
    question: "What Muslim camping trips do you run in the UK?",
    answer: "We run wild camping weekends in the Lake District, Snowdonia, the Peak District, and the Scottish Highlands; family camping weekends with base-camp day walks; sisters-only camping trips with a female Mountain Leader; Ramadan camping retreats (iftar + taraweeh under the stars); skills weekends for learning to camp; and combo weekends (camp + hike + kayak). See our upcoming trips for dates.",
  },
];

export default function MuslimCampingUkPage() {
  usePageSeo({
    path: "/muslim-camping/uk",
    title: "Muslim Camping UK | Wild Camping, Family & Sisters Weekends | Badr Adventures",
    description:
      "Muslim camping in the UK with Badr Adventures. Guided wild camping weekends, family camps, sisters-only trips, and skills courses across the Lake District, Peak District, Snowdonia and the Scottish Highlands. Halal food, prayer breaks, all kit provided.",
    keywords: [
      "Muslim camping UK",
      "Muslim camping",
      "halal camping UK",
      "wild camping Muslim",
      "family camping UK",
      "sisters only camping UK",
      "Muslim camping Lake District",
      "Muslim camping Peak District",
      "Muslim camping Snowdonia",
      "Muslim camping Scotland",
      "halal wild camping",
      "guided camping UK",
      "Ramadan camping UK",
    ],
  });

  useJsonLd("muslim-camping-breadcrumb",
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Muslim Hiking", path: "/muslim-hiking" },
      { name: "Muslim Camping UK", path: "/muslim-camping/uk" },
    ]),
  );
  useJsonLd("muslim-camping-faq", faqJsonLd(FAQS));

  return (
    <div className="bg-paper text-ink">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink/10 text-paper"
        style={{ background: "linear-gradient(180deg, #0f1a14 0%, #14281e 60%, #0f1a14 100%)" }}
      >
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-paper/80 backdrop-blur">
            <Sparkles className="h-3 w-3 text-[var(--ochre)]" />
            Muslim camping in the UK · guided 2026
          </span>
          <h1 className="mt-8 max-w-4xl font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-[80px]">
            Muslim camping,{" "}
            <span className="italic text-[var(--ochre)]">under the stars.</span>
          </h1>
          <p data-speakable="true" className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/80">
            Badr Adventures runs guided Muslim camping weekends across the UK — wild camps in the Lake District and Highlands, family camping in the Peak District and Snowdonia, sisters-only trips, and Ramadan retreats under the stars. Every trip includes prayer breaks, halal camp meals, all kit provided, and a qualified guide who handles the route, the stove, and the midges so you don't have to. Beginners welcome — no camping experience needed.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link to="/hikes" className="group inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-[0_18px_40px_-12px_rgba(232,168,75,0.6)] transition hover:bg-[#f0b75e]">
              See upcoming Muslim camping trips
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/muslim-hiking" className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-6 py-3 text-sm font-medium text-paper backdrop-blur transition hover:border-paper/50 hover:bg-paper/10">
              Muslim Hiking hub
            </Link>
          </div>
          <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-sm border border-paper/15 bg-paper/10 font-mono text-paper sm:grid-cols-4">
            {[
              { k: "12+", l: "Camping weekends per year" },
              { k: "100%", l: "Kit provided" },
              { k: "Halal", l: "All meals included" },
              { k: "Sisters", l: "Women-only options" },
            ].map((s) => (
              <div key={s.l} className="bg-ink/40 p-5 backdrop-blur">
                <dt className="font-serif text-3xl text-[var(--ochre)]">{s.k}</dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.24em] text-paper/70">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 3-minute answer for AI search */}
      <section className="border-b border-ink/10 bg-paper-2/40 py-16">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">The 3-minute answer</span>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">What is Muslim camping in the UK?</h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-2">
            Muslim camping in the UK means overnight outdoor camping — either on a booked campsite or wild camping under the right-to-roam laws in Scotland — organised around the needs of Muslim participants. Prayer breaks are built into the schedule (Fajr at camp, Dhuhr and Asr on the trail, Maghrib and Isha back at the tent), food is 100% halal from preparation to plate, modest dress is respected, women-only options are available, and the guide carries a group wudu station, prayer mats, and a qibla compass as standard kit. Badr Adventures runs guided Muslim camping weekends across the Lake District, Peak District, Snowdonia and the Scottish Highlands, with all camping equipment provided.
          </p>
          <h3 className="mt-8 font-serif text-2xl font-semibold text-ink">Where you can Muslim camp in the UK</h3>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">
            Lake District (Great Langdale, Wasdale), Peak District (North Lees, Edale), Snowdonia (Gwern Goch, Llanberis), Scottish Highlands (Glen Coe, Loch Lomond, Cairngorms), Yorkshire Coast (Ravenscar), South Downs (Seven Sisters area), Brecon Beacons (Glyntawe area), and Dartmoor (permissive wild camping zones). Scotland's right-to-roam makes it the best UK destination for wild camping — you can pitch a tent almost anywhere on unenclosed land. Guided Muslim camping trips cost from £120 for a full weekend including all kit and halal food.
          </p>
        </div>
      </section>

      {/* Types of Muslim camping */}
      <section className="border-b border-ink/10 py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">What we offer</span>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Muslim camping weekends we run across the UK.</h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-2">
              From guided wild camps in the Highlands to family weekends in the Peak District — every Muslim camping trip is built around prayer, halal food, and a pace that suits the group.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CAMPING_TYPES.map((t) => (
              <Card key={t.title} className="border-ink/10 bg-paper">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900/10 text-emerald-700">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-semibold">{t.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">{t.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Muslim camping FAQ */}
      <section className="border-b border-ink/10 bg-paper-2/40 py-20">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">FAQ</span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Muslim camping — questions answered.</h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details key={f.question} className="group rounded-2xl border border-ink/10 bg-paper p-6 open:border-emerald-700/40">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-serif text-lg font-medium">
                  {f.question}
                  <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink-2 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 leading-relaxed text-ink-2">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Campsite guide */}
      <section className="border-b border-ink/10 py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">Campsite finder</span>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">The best Muslim-friendly campsites in the UK.</h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-2">
              Pick a campsite within reach of halal food, a mosque, and running water for wudu. We run guided trips to all of these.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {CAMPSITES.map((c) => (
              <Card key={c.name} className="border-ink/10 bg-paper transition hover:border-emerald-700/40">
                <CardContent className="p-7">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-2xl font-semibold text-ink">{c.name}</h3>
                    <Badge variant="outline" className="border-ink/20 bg-transparent font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">{c.region}</Badge>
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-ink-2">
                    <div className="flex gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      <span><strong className="text-ink">Best for:</strong> {c.best}</span>
                    </div>
                    <div className="flex gap-2">
                      <Star className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      <span><strong className="text-ink">Halal food:</strong> {c.halal}</span>
                    </div>
                    <div className="flex gap-2">
                      <Waves className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      <span><strong className="text-ink">Wudu:</strong> {c.wudu}</span>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      <span><strong className="text-ink">Tip:</strong> {c.tips}</span>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-ink/10 pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
                    From {c.fee}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Kit you need */}
      <section className="border-b border-ink/10 bg-paper-2/40 py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">Kit list</span>
              <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Camping kit for Muslim hikers.</h2>
              <p className="mt-6 text-lg leading-relaxed text-ink-2">
                On our guided Muslim camping trips we provide the group kit (tents, stoves, cooking equipment). You just need personal items. Everything below is available to hire from our Rent page.
              </p>
              <Link to="/rent" className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/40">
                Rent camping kit <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="grid gap-px overflow-hidden rounded-sm border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:col-span-7">
              {KIT.map((k) => (
                <li key={k.item} className="bg-paper p-6">
                  <div className="flex items-baseline gap-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                    <h3 className="font-serif text-lg font-semibold text-ink">{k.item}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{k.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center sm:px-8 lg:px-10">
        <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Ready for a Muslim camping weekend?</h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          We run guided Muslim camping trips across the UK every month. Wild camps, family weekends, sisters-only trips — all kit provided, halal food included, prayer breaks built in. Pick a date and we'll handle the rest.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/hikes" className="group inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-[0_18px_40px_-12px_rgba(232,168,75,0.6)] transition hover:bg-[#f0b75e]">
            <Calendar className="h-4 w-4" />
            See upcoming camping trips
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/40">
            Ask a question
          </Link>
        </div>
      </section>
    </div>
  );
}
