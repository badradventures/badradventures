import { Link } from "react-router-dom";
import { CalendarDays, Moon, Sunrise, Sunset, Thermometer, Clock, Heart, Sparkles, ArrowRight, CheckCircle2, Star, Tent, Utensils, Bath } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageSeo, useJsonLd } from "@/lib/seo";
import { faqJsonLd, breadcrumbJsonLd, ramadanHikingHowToJsonLd, speakableJsonLd } from "@/lib/json-ld";

export default function MuslimHikingRamadanPage() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      {/* SEO */}
      <usePageSeo />
      <useJsonLd />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white px-4 pb-16 pt-20 sm:pb-20 sm:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Ramadan Hiking Guide</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            Hiking in Ramadan:<br />
            <span className="text-indigo-700">A Practical Guide</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-stone-600">
            The mountains are quieter in Ramadan. With the right planning — pre-dawn starts, shaded routes,
            iftar on a summit — hiking while fasting is not only possible, it's one of the most rewarding
            things you'll do all year.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-indigo-700 text-white hover:bg-indigo-600">
              <Link to="/hikes">Browse Iftar Hikes <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/muslim-hiking">All Muslim Hiking <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick answer speakable */}
      <section className="bg-indigo-700 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <Sunrise className="mx-auto mb-3 h-8 w-8 opacity-80" />
          <p className="text-xl font-medium leading-relaxed">
            "Can you hike while fasting in Ramadan? Yes — with the right planning. Start before dawn,
            take a shaded route, carry dates and water for iftar on the summit, and pace yourself.
            A 6-8km moderate hike is ideal. Badr Adventures runs iftar hikes every Ramadan."
          </p>
        </div>
      </section>

      {/* Key sections */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-stone-900">Your Ramadan Hiking Questions, Answered</h2>
          <p className="mb-12 text-center text-stone-500">What every Muslim hiker needs to know about fasting on the trail.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2.5">
                    <Thermometer className="h-5 w-5 text-indigo-700" />
                  </div>
                  <CardTitle className="text-lg">Can you hike while fasting?</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-stone-600">
                Yes — but plan the route to avoid the midday sun. A shaded trail, early start (depart 5-6am),
                and finish by 1-2pm makes fasting manageable for most fit hikers. Limit distance to 6-10km
                at easy-to-moderate grade. Listen to your body and turn back at any point.
              </CardContent>
            </Card>
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2.5">
                    <Clock className="h-5 w-5 text-indigo-700" />
                  </div>
                  <CardTitle className="text-lg">Best time of day for Ramadan hikes</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-stone-600">
                Pre-dawn start (4:30-5:30am) to catch the cool morning, finish by early afternoon before
                the heat peaks. Alternatively, start 2-3 hours before Maghrib and break your fast on a
                summit at sunset — the most rewarding iftar you'll ever have.
              </CardContent>
            </Card>
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2.5">
                    <Utensils className="h-5 w-5 text-indigo-700" />
                  </div>
                  <CardTitle className="text-lg">What to eat for suhoor before a hike</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-stone-600">
                Slow-release energy: oats, wholemeal bread, eggs, bananas, yoghurt. Drink 500-750ml water
                with suhoor. Avoid salty foods (they dehydrate you) and caffeine (it's a diuretic).
                Take dates and nuts in your pack for iftar on the trail.
              </CardContent>
            </Card>
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2.5">
                    <Bath className="h-5 w-5 text-indigo-700" />
                  </div>
                  <CardTitle className="text-lg">Hydration & wudu while fasting</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-stone-600">
                You can't drink while fasting, so pre-hydrate at suhoor and rehydrate well at iftar.
                For wudu on the trail: use a small spray bottle for minimal water, or do tayammum with
                clean earth/stone. Carry a compact wudu bottle for Maghrib prayer.
              </CardContent>
            </Card>
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2.5">
                    <Sunset className="h-5 w-5 text-indigo-700" />
                  </div>
                  <CardTitle className="text-lg">Iftar on the mountain</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-stone-600">
                Break your fast on a summit at sunset — dates, water, then Maghrib prayer with the last
                light over the valley. Badr Adventures provides dates, water and halal packed iftar on
                our Ramadan hikes. A moment you won't forget.
              </CardContent>
            </Card>
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2.5">
                    <Heart className="h-5 w-5 text-indigo-700" />
                  </div>
                  <CardTitle className="text-lg">Who shouldn't hike while fasting</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-stone-600">
                If you have diabetes, a medical condition, are pregnant or breastfeeding, or feel unwell
                on the day — don't fast and hike. You can join a non-fasting Ramadan hike and eat and
                drink on the trail. The Prophet (ﷺ) said: "Your body has a right over you."
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recommended Ramadan hikes */}
      <section className="bg-stone-50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-3 text-center text-3xl font-bold text-stone-900">Best Ramadan Hikes in the UK</h2>
          <p className="mb-10 text-center text-stone-500">
            Shorter, shaded, prayer-friendly — these routes are perfect for fasting hikers.
          </p>
          <div className="space-y-4">
            {[
              { name: "Mam Tor & the Great Ridge, Peak District", dist: "8km", grade: "Easy-Moderate", why: "Short, well-defined ridge with early-morning sun. Car park start. 3-4 hours." },
              { name: "Catbells, Lake District", dist: "6.5km", grade: "Easy", why: "Short Lake District classic. 2-3 hours, café at the start, flat prayer spot by the lake." },
              { name: "Moel Famau, Clwydian Range", dist: "7km", grade: "Easy", why: "Gentle ascent on good paths. 3 hours. Views over Liverpool Bay — stunning iftar spot." },
              { name: "Rydal Water & Grasmere, Lake District", dist: "7km", grade: "Easy", why: "Flat lakeside loop. Prayer break by the water. 2-3 hours. Halal café in Grasmere." },
              { name: "Surprise View & Padley Gorge, Peak District", dist: "5km", grade: "Easy", why: "Shaded woodland trail. Stream for wudu. 2 hours. Perfect for an evening iftar walk." },
            ].map((hike) => (
              <div key={hike.name} className="flex flex-wrap items-start gap-4 rounded-lg bg-white p-5 shadow-sm">
                <Star className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-900">{hike.name}</h3>
                  <p className="text-sm text-stone-500">{hike.dist} &middot; {hike.grade}</p>
                  <p className="mt-1 text-sm text-stone-600">{hike.why}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild size="lg" className="bg-indigo-700 text-white hover:bg-indigo-600">
              <Link to="/hikes">View Ramadan Hike Dates <CalendarDays className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Prayer section */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-3xl font-bold text-stone-900">
            <Moon className="mr-2 inline h-7 w-7 text-indigo-700" />
            Salah Times on a Ramadan Hike
          </h2>
          <div className="overflow-hidden rounded-xl border border-stone-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-indigo-50 text-left text-indigo-900">
                  <th className="px-4 py-3 font-semibold">Prayer</th>
                  <th className="px-4 py-3 font-semibold">Ramadan Timing</th>
                  <th className="px-4 py-3 font-semibold">Hiking Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {[
                  ["Fajr (pre-dawn)", "4:30-5:30am", "Start hiking after Fajr — coolest part of the day"],
                  ["Dhuhr (noon)", "1:00-1:30pm", "Take a rest break in the shade, pray, have suhoor leftovers"],
                  ["Asr (afternoon)", "4:30-5:30pm", "Descend / find iftar spot. Pray Asr on the trail"],
                  ["Maghrib (sunset)", "7:30-8:30pm", "Break fast with dates + water, pray on the summit"],
                  ["Isha (night)", "9:00-10:00pm", "Head down with head torches. Pray Isha in the car park"],
                ].map(([prayer, time, plan]) => (
                  <tr key={prayer} className="text-stone-700">
                    <td className="px-4 py-3 font-medium">{prayer}</td>
                    <td className="px-4 py-3">{time}</td>
                    <td className="px-4 py-3">{plan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-800 px-4 py-16 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-indigo-200" />
          <h2 className="text-3xl font-bold">Join a Ramadan Iftar Hike</h2>
          <p className="mt-3 text-indigo-100">
            Badr Adventures runs special iftar-on-the-summit hikes every Ramadan. Small groups, prayer breaks, halal iftar provided. Spaces fill fast.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="bg-white text-indigo-900 hover:bg-indigo-50">
              <Link to="/hikes">Browse Iftar Hikes <CalendarDays className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-indigo-500 text-white hover:bg-indigo-700">
              <Link to="/muslim-hiking">Explore Muslim Hiking <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
