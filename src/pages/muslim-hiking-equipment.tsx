import { PackageOpen, Tent, Shirt, Footprints, Sun, Moon, Map, Compass, Shield, ShoppingBag, ArrowRight, CheckCircle2, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageSeo, useJsonLd } from "@/lib/seo";
import { faqJsonLd, breadcrumbJsonLd, muslimHikingKitHowToJsonLd, speakableJsonLd } from "@/lib/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const KIT_CATEGORIES = [
  {
    icon: Footprints,
    title: "Footwear",
    items: ["Waterproof ankle-support boots (not trainers)", "Gaiters for wet/muddy trails", "Approach shoes for easy routes", "Clean spare socks in a dry bag"],
    tip: "Your boots are the single most important piece of kit. Rent from us if you're trying it out.",
  },
  {
    icon: Shirt,
    title: "Clothing & Modesty",
    items: ["Moisture-wicking base layer (long-sleeve)", "Fleece or mid-layer", "Waterproof jacket & trousers", "Loose-fit hiking trousers / joggers", "Hijab-friendly neck gaiter or buff", "Modest swimwear for water crossings"],
    tip: "Cotton kills on the hill. Merino wool base layers are worth the investment — they manage sweat and stay odour-free for multiple days.",
  },
  {
    icon: PackageOpen,
    title: "Rucksack & Storage",
    items: ["25-35 litre daypack", "50-65 litre pack for overnight trips", "Dry bags for clothes and electronics", "Rain cover for your rucksack", "Hydration bladder (3L) for long days"],
    tip: "See our Rent page for overnight kit bundles delivered to your meeting point.",
  },
  {
    icon: Compass,
    title: "Navigation & Safety",
    items: ["OS Maps app on phone (download offline)", "Portable power bank (10,000mAh+)", "Head torch with spare batteries", "First-aid kit (blister plasters, antihistamine)", "Whistle & emergency shelter (group kit)"],
    tip: "Our guides carry group first-aid, emergency shelters, satellite comms — but you should have your own torch and power bank.",
  },
  {
    icon: Sun,
    title: "Prayer Kit",
    items: ["Compact foldable prayer mat", "500ml water bottle for wudu", "Qibla compass app on phone", "Tayammum soil pack (as backup)", "Dry bag for prayer mat"],
    tip: "Badr Adventures carries group prayer mats, qibla compass, and a communal wudu bottle on every trip.",
  },
  {
    icon: Moon,
    title: "Food & Hydration",
    items: ["Halal packed lunch & trail snacks", "2+ litres of water (3L on long days)", "Electrolyte tablets (summer)", "Thermos for hot drink (winter)", "Emergency chocolate — the most important item"],
    tip: "We provide halal lunch, trail snacks, and a hot meal on overnight trips. Bring extra snacks for morale.",
  },
];

const PACKING_CHECKLIST = [
  { task: "Book your trip on Badr Adventures", link: "/hikes" },
  { task: "Check the weather & route card", link: null },
  { task: "Waterproof your boots the night before", link: null },
  { task: "Charge phone, head torch & power bank", link: null },
  { task: "Download offline maps (OS Maps)", link: null },
  { task: "Pack your prayer mat & wudu bottle", link: null },
  { task: "Pack halal lunch + snacks + 2L water", link: null },
  { task: "Tell the guide about any medical conditions", link: null },
  { task: "Pack spare socks in a dry bag", link: null },
  { task: "Set your alarm for the meeting time", link: null },
];

export default function MuslimHikingEquipmentPage() {
  return (
    <main>
      {/* SEO */}
      <usePageSeo />
      <useJsonLd />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white px-4 pb-16 pt-20 sm:pb-20 sm:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Muslim Hiking Kit Guide</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            What to Pack for a<br />
            <span className="text-emerald-800">Muslim Hike in the UK</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-stone-600">
            The right kit makes the difference between a good day on the hill and a miserable one.
            This guide covers everything you need — from modest hiking clothes and prayer-on-the-trail
            essentials to waterproofs, boots, and halal food packing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-emerald-800 text-white hover:bg-emerald-700">
              <Link to="/hikes">Browse Muslim Hiking Trips <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/rent">Rent Kit <ShoppingBag className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Core principle */}
      <section className="bg-emerald-800 px-4 py-12 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <Shield className="mx-auto mb-3 h-8 w-8 opacity-80" />
          <p className="text-lg leading-relaxed">
            "You don't need expensive gear to start hiking. What you need is a dry pair of socks, a waterproof jacket, a good attitude — and someone who knows the route."
          </p>
          <p className="mt-3 text-sm text-emerald-200">— Badr Adventures guide team</p>
        </div>
      </section>

      {/* Kit categories */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-center text-3xl font-bold text-stone-900">Muslim Hiking Kit — Category by Category</h2>
          <p className="mb-12 text-center text-stone-500">
            Everything you need for a guided Muslim hike in the UK. Beginners welcome — we lend the basics.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {KIT_CATEGORIES.map((cat) => (
              <Card key={cat.title} className="border-stone-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2.5">
                      <cat.icon className="h-5 w-5 text-emerald-800" />
                    </div>
                    <CardTitle className="text-lg">{cat.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-sm text-stone-600">
                    {cat.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {cat.tip && (
                    <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      <strong>Pro tip:</strong> {cat.tip}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-hike checklist */}
      <section className="bg-stone-50 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-3 text-center text-3xl font-bold text-stone-900">
            <BookOpen className="mr-2 inline h-7 w-7 text-emerald-800" />
            10-Step Pre-Hike Packing Checklist
          </h2>
          <p className="mb-10 text-center text-stone-500">Print this, tick it off the night before your first Muslim hike with us.</p>
          <div className="space-y-3">
            {PACKING_CHECKLIST.map((item, i) => (
              <div key={item.task} className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="flex-1 text-stone-700">{item.task}</span>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-stone-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rent / CTA */}
      <section className="bg-emerald-800 px-4 py-16 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <Tent className="mx-auto mb-4 h-10 w-10 text-emerald-200" />
          <h2 className="text-3xl font-bold">Don't Have Kit? We've Got You.</h2>
          <p className="mt-3 text-emerald-100">
            Every piece of gear on this page is available to rent through Badr Adventures — delivered to your meeting point. Boots, waterproofs, tents, sleeping bags, prayer mats. Just turn up.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="bg-white text-emerald-900 hover:bg-emerald-50">
              <Link to="/rent">Browse Rental Kit <ShoppingBag className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-emerald-600 text-white hover:bg-emerald-700">
              <Link to="/hikes">Book a Hike <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
