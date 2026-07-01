import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Armchair,
  Bed,
  CalendarRange,
  CheckCircle2,
  Filter,
  MapPin,
  Package,
  Search,
  Tent,
  Users,
  ShoppingBag,
} from "lucide-react";
import { api, formatGbp } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/site-shell";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";

import { usePageSeo as useSeo } from "@/lib/seo";
type EquipmentType = "tent" | "bnb" | "gear";

type Equipment = {
  id: string;
  name: string;
  type: EquipmentType;
  summary: string;
  description: string;
  image: string;
  location: string;
  capacity: number;
  pricePerNightPence: number;
  pricePerNightGbp: number;
  unitLabel: string;
  totalUnits: number;
  availableUnits: number;
  features: string[];
  act: boolean;
};

type EquipmentItem = Equipment & { act: boolean };

const TYPE_LABELS: Record<EquipmentType | "all", string> = {
  all: "Everything",
  tent: "Tents",
  bnb: "B&B rooms",
  gear: "Hiking gear",
};

const TYPE_ICONS: Record<EquipmentType, typeof Tent> = {
  tent: Tent,
  bnb: Bed,
  gear: Package,
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nightsBetween(start: string, end: string): number {
  if (!start || !end || end <= start) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export default function RentPage() {
  useSeo({
    path: '/rent',
    title: 'Equipment hire',
    description: 'Quality outdoor kit for hire across the UK -- tents, stoves, packs and more, delivered to your meetup point.',
  });
  const { user } = useAuth();
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | EquipmentType>("all");
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    api<{ items: Equipment[] }>("/api/equipment")
      .then((res) => mounted && setItems(res.items))
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to load gear"),
      )
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const locations = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.location && set.add(i.location));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (tab !== "all" && i.type !== tab) return false;
      if (locationFilter !== "all" && i.location !== locationFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.features.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [items, tab, locationFilter, query]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      tent: items.filter((i) => i.type === "tent").length,
      bnb: items.filter((i) => i.type === "bnb").length,
      gear: items.filter((i) => i.type === "gear").length,
    };
  }, [items]);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-stone-900 text-white">
        <div className="absolute inset-0">
          <img
            src="/images/tent-camp.jpg"
            alt="Tent pitched at dusk on a hill"
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/40 to-stone-950" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Badge className="bg-amber-400/90 text-stone-900 hover:bg-amber-400">
            <Tent className="mr-1 h-3.5 w-3.5" />
            Rent gear · no commitment
          </Badge>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Hiking &amp; camping kit for Muslim hikers —{" "}
            <span className="text-amber-300">rented the easy way.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-stone-200">
            Borrow what you need for your next Muslim hiking trip with us, by the night. Quality
            kit, real availability, free pitching on guided weekends.
          </p>
          <div className="mt-8 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Tent, label: "Tents" },
              { icon: Bed, label: "B&B rooms" },
              { icon: Package, label: "Hiking gear" },
              { icon: CheckCircle2, label: "Real-time availability" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="rounded-xl border border-white/20 bg-white/5 p-4 backdrop-blur"
              >
                <Icon className="h-5 w-5 text-amber-300" />
                <div className="mt-2 text-sm text-stone-200">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LISTING */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="bg-emerald-100 text-emerald-800">Available now</Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Pick your dates, pick your kit
            </h2>
            <p className="mt-2 max-w-2xl text-stone-600">
              Every item below is live, with the number of units actually free for your
              dates. Book in under a minute — no account needed to browse.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, location, or feature…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Filter className="h-4 w-4" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-md border border-stone-200 bg-white px-2 py-1 text-sm text-stone-700"
            >
              <option value="all">All locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "all" | EquipmentType)}
          className="mt-6"
        >
          <TabsList>
            <TabsTrigger value="all">
              {TYPE_LABELS.all} ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="tent">
              {TYPE_LABELS.tent} ({counts.tent})
            </TabsTrigger>
            <TabsTrigger value="bnb">
              {TYPE_LABELS.bnb} ({counts.bnb})
            </TabsTrigger>
            <TabsTrigger value="gear">
              {TYPE_LABELS.gear} ({counts.gear})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-6">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-80 animate-pulse rounded-2xl border border-stone-200 bg-white"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
                <p className="text-stone-600">No items match those filters.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setQuery("");
                    setLocationFilter("all");
                    setTab("all");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => (
                  <RentCard
                    key={item.id}
                    item={item as EquipmentItem}
                    signedIn={!!user}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

function RentCard({ item, signedIn }: { item: EquipmentItem; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const Icon = TYPE_ICONS[item.type as EquipmentType] ?? Package;
  const sold = item.availableUnits === 0;
  const low = !sold && item.availableUnits <= 2;

  return (
    <>
      <Card className="flex h-full flex-col overflow-hidden border-stone-200/80 bg-white transition-shadow hover:shadow-xl">
        <div className="relative h-44 w-full overflow-hidden bg-stone-100">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-400">
              <Icon className="h-12 w-12" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1">
            <Badge className="bg-white/90 capitalize text-stone-800 hover:bg-white">
              <Icon className="mr-1 h-3 w-3" />
              {item.type}
            </Badge>
            {sold && (
              <Badge className="bg-red-600 text-white hover:bg-red-600">Sold out</Badge>
            )}
            {low && (
              <Badge className="bg-amber-500 text-stone-900 hover:bg-amber-500">
                Only {item.availableUnits} left
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {item.location || "UK"}
            </span>
            {item.capacity > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Sleeps {item.capacity}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-stone-900">{item.name}</h3>
          <p className="text-sm text-stone-600">{item.summary}</p>
          {item.features.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {item.features.slice(0, 3).map((f) => (
                <Badge
                  key={f}
                  variant="secondary"
                  className="bg-stone-100 text-stone-700"
                >
                  {f}
                </Badge>
              ))}
            </ul>
          )}
          <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-3">
            <div className="text-sm">
              <span className="text-base font-semibold text-emerald-800">
                {formatGbp(item.pricePerNightPence)}
              </span>
              <span className="text-stone-500"> · {item.unitLabel}</span>
            </div>
            <Button
              size="sm"
              disabled={sold}
              onClick={() => setOpen(true)}
              className="bg-emerald-900 hover:bg-emerald-800"
            >
              {sold ? "Unavailable" : "Book"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <BookingDialog
        item={item}
        open={open}
        onOpenChange={setOpen}
        signedIn={signedIn}
      />
    </>
  );
}

function BookingDialog({
  item,
  open,
  onOpenChange,
  signedIn,
}: {
  item: EquipmentItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  signedIn: boolean;
}) {
  const [start, setStart] = useState<string>(todayIso());
  const [end, setEnd] = useState<string>(addDaysIso(todayIso(), 2));
  const [units, setUnits] = useState<number>(1);
  const [guests, setGuests] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const { addItem } = useCart();

  const nights = nightsBetween(start, end);
  const totalPence = item.pricePerNightPence * units * Math.max(1, nights);
  const tooManyUnits = units > item.availableUnits;
  const tooManyGuests =
    item.capacity > 0 && units * item.capacity < guests;

  function reset() {
    setStart(todayIso());
    setEnd(addDaysIso(todayIso(), 2));
    setUnits(1);
    setGuests(1);
    setNotes("");
  }

  async function handleSubmit() {
    if (!signedIn) {
      onOpenChange(false);
      toast.error("Please sign in or create a free account to book.");
      return;
    }
    if (nights === 0) {
      toast.error("Pick a valid date range (end must be after start).");
      return;
    }
    if (tooManyUnits) {
      toast.error(`Only ${item.availableUnits} of this item are available.`);
      return;
    }
    if (tooManyGuests) {
      toast.error(
        `Total capacity is ${item.capacity * units} guests for ${units} unit${units > 1 ? "s" : ""}.`,
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{
        reservation: { id: string };
        checkout: { url: string } | null;
      }>("/api/equipment-reservations", {
        method: "POST",
        body: JSON.stringify({
          equipmentId: item.id,
          startDate: start,
          endDate: end,
          units,
          guests,
          notes: notes || undefined,
        }),
      });
      if (res.checkout?.url) {
        window.location.href = res.checkout.url;
        return;
      }
      toast.success(
        `Reservation confirmed for ${nights} night${nights > 1 ? "s" : ""}. Pay on collection.`,
      );
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reserve");
    } finally {
      setSubmitting(false);
    }
  }

  function handleAddToCart() {
    if (nights === 0) {
      toast.error("Pick a valid date range.");
      return;
    }
    if (tooManyUnits) {
      toast.error(`Only ${item.availableUnits} of this item are available.`);
      return;
    }
    addItem({
      kind: "equipment",
      itemId: item.id,
      title: item.name,
      pricePence: item.pricePerNightPence,
      quantity: units,
      image: item.image,
      unitLabel: `${item.unitLabel} · ${item.location}`,
      startDate: start,
      endDate: end,
      nights,
    });
    toast.success(`${item.name} added to cart`);
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Book {item.name}</DialogTitle>
          <DialogDescription>
            {item.unitLabel} · {formatGbp(item.pricePerNightPence)} per unit ·{" "}
            {item.availableUnits} available
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="start">Start date</Label>
            <Input
              id="start"
              type="date"
              value={start}
              min={todayIso()}
              onChange={(e) => {
                setStart(e.target.value);
                if (end && e.target.value >= end) {
                  setEnd(addDaysIso(e.target.value, 1));
                }
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="end">End date</Label>
            <Input
              id="end"
              type="date"
              value={end}
              min={start || todayIso()}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="units">Units</Label>
            <Input
              id="units"
              type="number"
              min={1}
              max={item.availableUnits}
              value={units}
              onChange={(e) =>
                setUnits(Math.max(1, Math.min(item.availableUnits, Number(e.target.value || 1))))
              }
              className="mt-1"
            />
          </div>
          {item.capacity > 0 && (
            <div>
              <Label htmlFor="guests">Guests</Label>
              <Input
                id="guests"
                type="number"
                min={1}
                max={item.capacity * units}
                value={guests}
                onChange={(e) =>
                  setGuests(Math.max(1, Number(e.target.value || 1)))
                }
                className="mt-1"
              />
              <p className="mt-1 text-xs text-stone-500">
                {item.capacity * units} max for {units} unit{units > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Accessibility, arrival time, anything we should know…"
            className="mt-1"
          />
        </div>

        <Separator />

        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between text-stone-600">
            <span className="flex items-center gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" />
              {nights} night{nights > 1 ? "s" : ""} · {units} unit
              {units > 1 ? "s" : ""}
            </span>
            <span>{formatGbp(item.pricePerNightPence * units)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-stone-900">
            <span>Total</span>
            <span>{formatGbp(totalPence)}</span>
          </div>
        </div>

        {!signedIn && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              You'll need to{" "}
              <Link
                to={`/sign-in?next=/rent`}
                className="font-semibold underline"
              >
                sign in
              </Link>{" "}
              or{" "}
              <Link
                to={`/sign-up?next=/rent`}
                className="font-semibold underline"
              >
                create a free account
              </Link>{" "}
              to complete the booking.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleAddToCart}
            disabled={submitting || nights === 0 || tooManyUnits}
            className="border-ink/15 text-ink-2 hover:bg-paper-deep hover:text-pine"
          >
            <ShoppingBag className="mr-1.5 h-4 w-4" />
            Add to cart
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || nights === 0 || tooManyUnits || tooManyGuests}
            className="bg-emerald-900 hover:bg-emerald-800"
          >
            {submitting ? "Working…" : "Reserve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
