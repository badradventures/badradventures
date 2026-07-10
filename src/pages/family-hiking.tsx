import { Link } from "react-router-dom";
import {
  ArrowRight,
  Baby,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  MapPin,
  Mountain,
  Sparkles,
  Star,
  Tent,
  Trees,
  Users,
} from "lucide-react";
import { usePageSeo, useJsonLd } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/json-ld";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FAMILY_ROUTES = [
  {
    name: "Catbells",
    region: "Lake District",
    height: "451 m",
    distance: "4 miles / 6.4 km",
    ascent: "350 m",
    time: "2–3 hours",
    ages: "5+",
    blurb:
      "The UK's most family-friendly mountain. A gentle ridge with big-lake views, a clear path the whole way, and a café at the base for the post-hike hot chocolate. Prayer-friendly: plenty of flat spots for Dhuhr on the ridge.",
    why_muslim:
      "Close to Halal food in Keswick, prayer-friendly flat summits, and short enough that kids don't flag before Maghrib.",
  },
  {
    name: "Mam Tor & the Great Ridge",
    region: "Peak District",
    height: "517 m",
    distance: "5 miles / 8 km",
    ascent: "280 m",
    time: "2.5–3.5 hours",
    ages: "6+",
    blurb:
      "The 'shivering mountain' offers a wide, well-maintained path along a spectacular ridge. Start from the Hope Valley car park, follow the ridge to Lose Hill, and loop back. Pram-friendly sections on the lower part.",
    why_muslim:
      "30 min from Manchester — quick enough for a post-Jumuah afternoon hike. Halal food in Sheffield or Manchester on the way home.",
  },
  {
    name: "Padley Gorge & Burbage Brook",
    region: "Peak District",
    height: "80 m",
    distance: "2.5 miles / 4 km",
    ascent: "100 m",
    time: "1.5–2 hours",
    ages: "3+ (pram-friendly trail)",
    blurb:
      "A magical woodland walk along a bubbling brook, through ancient oak woods, with stepping stones, mini waterfalls, and unlimited sticks to collect. The flattest, easiest family walk on this list — and the most fun for toddlers.",
    why_muslim:
      "Pram-friendly, no altitude worries, and a café at Grindleford Station serving vegetarian options. Ideal for a Friday afternoon family walk.",
  },
  {
    name: "Grizedale Forest Trail",
    region: "Lake District",
    height: "100 m",
    distance: "3 miles / 5 km",
    ascent: "60 m",
    time: "1.5 hours",
    ages: "3+ (pram-accessible)",
    blurb:
      "Sculpture trail, Gruffalo-themed play area, bike hire, and Go Ape in the trees. The walking trail is wide, well-surfaced, and easy for little legs. Toilets, café, and picnic benches at the visitor centre.",
    why_muslim:
      "Covered picnic area for prayer, café with vegetarian options, and enough activities to keep the kids happy for a full day out. Halal food available in Ambleside 20 min away.",
  },
  {
    name: "Seven Sisters (short section)",
    region: "South Downs",
    height: "150 m",
    distance: "3 miles / 5 km",
    ascent: "200 m",
    time: "2 hours",
    ages: "8+",
    blurb:
      "The classic Seven Sisters coastal walk has a short family-friendly section from Birling Gap to Belle Tout. Chalk cliffs, sea views, and a lighthouse. The beach below is perfect for a post-hike paddle.",
    why_muslim:
      "1 hr from London by train. Flat prayer spots at Birling Gap. Halal food in Brighton or Eastbourne 20 min drive.",
  },
  {
    name: "Pen y Fan from Storey Arms",
    region: "Brecon Beacons",
    height: "886 m",
    distance: "4 miles / 6.4 km",
    ascent: "460 m",
    time: "2.5–3.5 hours",
    ages: "10+",
    blurb:
      "The highest peak in South Wales via a clear, well-maintained path. Non-technical, steady climbing, and a huge summit plateau for lunch. Busy on weekends, but a proper family mountain day.",
    why_muslim:
      "Close to Cardiff and Bristol for halal food. Wide summit plateau for group prayer. Café at the bottom for post-hike treats.",
  },
];

const CAMPING_SPOTS = [
  {
    name: "Wasdale Head",
    region: "Lake District",
    best_for: "Scafell Pike families, quiet camping",
    blurb:
      "The most dramatic campsite in England — set at the head of Wasdale Valley with Scafell Pike towering above. Basic facilities, but the location is unmatched. Family Muslim hiking weekends camp here.",
    prayer: "Flat grass pitches, wudu-friendly beck nearby, quiet for Fajr.",
  },
  {
    name: "Cwmcarn Forest",
    region: "South Wales",
    best_for: "Family camping with activities",
    blurb:
      "Award-winning forest campsite with mountain biking trails, a high ropes course, pony trekking, and well-maintained walking paths. Family-friendly facilities, hot showers, and a café. 30 min from Cardiff.",
    prayer: "Sheltered woodland pitches for privacy. Mosque in Newport 20 min away.",
  },
  {
    name: "Edale Campsite",
    region: "Peak District",
    best_for: "Peak District family basecamp",
    blurb:
      "At the foot of Kinder Scout, with the Pennine Way passing through. Hot showers, a pub next door (halal-friendly for vegetarian), and easy access to Mam Tor and Padley Gorge. 1 hr from Manchester.",
    prayer: "Quiet after dark, good for Isha under the stars. Manchester mosques 1 hr.",
  },
];

const FAQS = [
  {
    question: "Is family-friendly hiking suitable for toddlers?",
    answer:
      "Yes. Routes like Padley Gorge, Grizedale Forest and Butser Hill are pushchair-friendly and suitable from age 3 upward. For babies in carriers, most shorter peaks (Catbells, Mam Tor) work well — we recommend a decent child-carrying rucksack and waterproof cover. Badr Adventures runs dedicated family weekends with routes sized for all ages.",
  },
  {
    question: "How do prayer breaks work on a family hike?",
    answer:
      "Exactly the same as on any Muslim hiking trip — except we build in longer stops for nappy changes, snack breaks, and the inevitable tantrum. The route is plotted around the day's prayer times, with a 15–20 minute break for Dhuhr or Asr on the trail. Families with young children are welcome to pray at their own pace while the group waits.",
  },
  {
    question: "Is the food halal on family hiking trips?",
    answer:
      "Yes — 100% halal. Trail snacks, summit lunches, dinner at the bunkhouse or campsite, and the emergency chocolate. We can cater for children's smaller portions and picky eaters with advance notice. Vegetarian and vegan options always available.",
  },
  {
    question: "What's the minimum age for a family hiking trip?",
    answer:
      "We recommend age 5+ for most guided family hikes, and age 3+ for pushchair-friendly woodland walks. Babies under 12 months in a carrier are welcome on our gentler routes (Grizedale, Padley Gorge, Butser Hill). Every trip page lists a minimum age. Dedicated family weekends run four times a year.",
  },
  {
    question: "Do I need special kit for hiking with kids?",
    answer:
      "Kids need the same basics as adults: waterproof jacket, sturdy shoes (not wellies), a small rucksack with their own water and snacks, and a sun hat. We can lend child carriers and waterproof covers on request. Our family blog post has a full kit checklist for hiking with children.",
  },
  {
    question: "What if my child gets tired on the trail?",
    answer:
      "Every family route is paced to the youngest hiker, with frequent breaks built in. The guide carries a spare carrier for small legs that give out. We also choose routes with a café or picnic spot within 30 minutes of the summit — so there's always a reward waiting.",
  },
  {
    question: "Are there Muslim family camping weekends?",
    answer:
      "Yes. Badr Adventures runs halal-friendly family camping weekends in the Lake District, Peak District and Brecon Beacons. All-inclusive with tents, food, and activities provided. Separate family camping areas, prayer space, and halal food throughout. See our Muslim camping page for upcoming dates.",
  },
];

export default function FamilyHikingPage() {
  usePageSeo({
    path: "/family-hiking",
    title:
      "Family-Friendly Hiking UK | Muslim Family Walks & Adventures | Badr Adventures",
    description:
      "Family-friendly hiking and walks for Muslim families across the UK. Pushchair-friendly trails, kid-friendly peaks, prayer breaks, halal food, and family weekend camping trips. Lake District, Peak District, Snowdonia & more.",
    keywords: [
      "family hiking UK",
      "family friendly hiking",
      "Muslim family hiking",
      "family walks UK",
      "hiking with kids UK",
      "pushchair friendly walks UK",
      "Muslim family days out",
      "family camping UK",
      "family hiking Lake District",
      "family hiking Peak District",
      "kid friendly hikes UK",
      "easy family walks UK",
    ],
  });

  useJsonLd(
    "family-hiking-breadcrumb",
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Family Hiking", path: "/family-hiking" },
    ]),
  );
  useJsonLd("family-hiking-faq", faqJsonLd(FAQS));

  return (
    <div className="bg-paper text-ink">
      {/* HERO */}
      <section
        className="relative overflow-hidden border-b border-ink/10 text-paper"
        style={{
          background:
            "linear-gradient(180deg, #1a2e0d 0%, #1f3a12 60%, #1a2e0d 100%)",
        }}
      >
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-paper/80 backdrop-blur">
            <Baby className="h-3 w-3 text-[var(--ochre)]" />
            Family adventure guide · 2026
          </span>
          <h1 className="mt-8 max-w-5xl font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-[80px]">
            Family-friendly hiking,{" "}
            <span className="italic text-[var(--ochre)]">halal from trailhead to summit.</span>
          </h1>
          <p
            data-speakable="true"
            className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/80"
          >
            The definitive guide to family-friendly hiking for Muslim families in
            the UK — pushchair-friendly trails, kid-sized peaks, prayer breaks
            that work around nap schedules, halal food on every trip, and a
            community where bringing the whole family is the point, not the
            exception. Lake District, Peak District, Snowdonia, South Downs, Brecon
            Beacons — from toddlers to teenagers, there is a Muslim family hiking
            route for every age.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/hikes"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-[0_18px_40px_-12px_rgba(232,168,75,0.6)] transition hover:bg-[#f0b75e]"
            >
              See upcoming family hikes
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/muslim-camping/uk"
              className="inline-flex items-center gap-2 rounded-full border border-paper/30 bg-paper/5 px-6 py-3 text-sm font-medium text-paper backdrop-blur transition hover:border-paper/50 hover:bg-paper/10"
            >
              Family camping weekends
            </Link>
          </div>
          <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-sm border border-paper/15 bg-paper/10 font-mono text-paper sm:grid-cols-4">
            {[
              { k: "12+", l: "Family routes mapped" },
              { k: "3–12", l: "Ages we cover" },
              { k: "£25", l: "From per person" },
              { k: "100%", l: "Halal + pram-friendly" },
            ].map((s) => (
              <div key={s.l} className="bg-ink/40 p-5 backdrop-blur">
                <dt className="font-serif text-3xl text-[var(--ochre)]">{s.k}</dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.24em] text-paper/70">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 3-MINUTE ANSWER */}
      <section className="border-b border-ink/10 bg-paper-2/40 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
            The 3-minute answer
          </span>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Family-friendly hiking for Muslim families — what it means
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-2">
            Family-friendly hiking means routes, pace, food, and prayer schedule
            designed around children. Short distances (2–5 miles), minimal ascent,
            frequent snack stops, and a café or picnic bench at the end. For Muslim
            families, it also means prayer breaks that fit around nap times, halal
            food for everyone, modest kit options, and a group that understands
            why your three-year-old is having a meltdown at 3pm because they
            missed their nap.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">
            Badr Adventures runs dedicated family-friendly hiking weekends four
            times a year — plus individual family-friendly routes on most of our
            regular trips. Day walks from £25 per adult (kids under 12 half price
            on most trips). We can lend child carriers, waterproof covers, and
            kids' waterproofs on request. Our family camping weekends include all
            tents, food, and activities.
          </p>
        </div>
      </section>

      {/* FAMILY ROUTES */}
      <section className="border-b border-ink/10 py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">Routes</span>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              The best family-friendly Muslim hiking routes in the UK.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-2">
              Every route below has been tested by Badr Adventures families with
              children aged 3 to 12. Pushchair-friendly where noted, prayer breaks
              always built in, halal food nearby or provided.
            </p>
          </div>
          <div className="mt-14 space-y-6">
            {FAMILY_ROUTES.map((r) => (
              <Card key={r.name} className="border-ink/10 bg-paper transition hover:border-[var(--ochre)]/40">
                <CardContent className="p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-2xl font-semibold">{r.name}</h3>
                        <Badge variant="outline" className="border-ink/20 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2">
                          Ages {r.ages}
                        </Badge>
                      </div>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-rust">
                        <MapPin className="mr-1 inline h-3 w-3" /> {r.region}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-3">
                      <span className="flex items-center gap-1"><Mountain className="h-3 w-3" />{r.height}</span>
                      <span className="flex items-center gap-1"><Trees className="h-3 w-3" />{r.distance}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.time}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3" />{r.ascent}</span>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-ink-2">{r.blurb}</p>
                  <div className="mt-4 flex gap-3 rounded-lg border border-ink/10 bg-paper-2/30 p-4 text-xs">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ochre)]" />
                    <div>
                      <span className="font-semibold text-ink">Why Muslim families love it: </span>
                      <span className="text-ink-2">{r.why_muslim}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAMILY CAMPING SPOTS */}
      <section className="border-b border-ink/10 bg-paper-2/40 py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">Camping</span>
              <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                Muslim family camping spots.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-ink-2">
                Halal-friendly family campsites with prayer space, good facilities,
                and walking routes from the tent pitch. Badr Adventures runs
                all-inclusive family camping weekends at most of these locations —
                tents, food, and guides provided.
              </p>
            </div>
            <Link
              to="/muslim-camping/uk"
              className="group inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/40"
            >
              Full Muslim camping guide
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPING_SPOTS.map((c) => (
              <Card key={c.name} className="h-full border-ink/10 bg-paper transition hover:border-[var(--ochre)]/40">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <Tent className="h-5 w-5 text-rust" />
                    <Badge variant="outline" className="border-ink/20 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">
                      {c.best_for}
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-serif text-xl font-semibold">{c.name}</h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3"><MapPin className="mr-1 inline h-3 w-3" />{c.region}</p>
                  <p className="mt-4 text-sm leading-relaxed text-ink-2">{c.blurb}</p>
                  <div className="mt-5 border-t border-ink/10 pt-4 text-xs">
                    <span className="font-semibold text-ink">Prayer: </span>
                    <span className="text-ink-2">{c.prayer}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TIPS */}
      <section className="border-b border-ink/10 py-20">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">Tips</span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            How to make family-friendly hiking work for Muslims.
          </h2>
          <ol className="mt-10 space-y-6 text-lg leading-relaxed text-ink-2">
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust font-mono text-sm text-paper">1</span>
              <div><strong className="text-ink">Pick the right time.</strong> Summer (May–September) is the best window for family-friendly Muslim hiking in the UK. Long daylight hours mean you can fit Fajr start, a 3-hour walk, Dhuhr, lunch, and a second walk all before Maghrib. Winter walks are shorter and need good waterproofs.</div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust font-mono text-sm text-paper">2</span>
              <div><strong className="text-ink">Pack snacks, then pack more.</strong> Trail morale for children runs on a snack-per-30-minutes rota. Halal jelly sweets, dried mango, cheese wraps, and emergency chocolate for the adults. We always bring extra.</div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust font-mono text-sm text-paper">3</span>
              <div><strong className="text-ink">Make prayer a highlight, not a chore.</strong> Kids love finding the cleanest, flattest spot for the group prayer mat. Turn wudu into a game (who can splash the least water). Let them call the athan from the summit. It becomes their favourite part.</div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust font-mono text-sm text-paper">4</span>
              <div><strong className="text-ink">Start very small.</strong> A first family hike should be 2 miles, not 6. Padley Gorge or Grizedale Forest are perfect introductions. Build up to Mam Tor, then Catbells, then the bigger peaks. The mountain will still be there next year.</div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust font-mono text-sm text-paper">5</span>
              <div><strong className="text-ink">Come on a group trip first.</strong> Your first family-friendly Muslim hike is easier with us. We carry the group kit, plan the prayer stops, bring kid-friendly halal food, and pace the whole day to the youngest hiker. After one weekend, you'll have the confidence to plan your own.</div>
            </li>
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-ink/10 bg-paper-2/40 py-20">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">FAQ</span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Family-friendly Muslim hiking — questions answered.
          </h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details key={f.question} className="group rounded-2xl border border-ink/10 bg-paper p-6 open:border-rust/40">
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

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center sm:px-8 lg:px-10">
        <h2 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Ready for family-friendly Muslim hiking?
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          We run family-friendly Muslim hiking weekends across the UK, with
          prayer breaks, halal food, and routes sized for children. Day walks
          from £25 per adult, kids half price on most trips. Bring the whole
          family — the mountains are for everyone.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/hikes" className="group inline-flex items-center gap-2 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-medium text-ink shadow-[0_18px_40px_-12px_rgba(232,168,75,0.6)] transition hover:bg-[#f0b75e]">
            See upcoming family hikes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/40">
            Ask about your family
          </Link>
        </div>
      </section>
    </div>
  );
}
