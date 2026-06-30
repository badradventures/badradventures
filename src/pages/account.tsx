import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, Compass, MapPin, ShieldCheck, Star, Users } from "lucide-react";
import { api, formatDate, formatGbp, storedUser, setStoredUser, clearStoredUser } from "@/lib/api";
import { usePageSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/site-shell";
import { toast } from "sonner";

type Booking = {
  id: string;
  hikeId: string;
  hikeTitle: string;
  hikeDate: string;
  hikeLocation: string;
  partySize: number;
  totalPence: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  stripeSessionId: string | null;
};

type Reservation = {
  id: string;
  equipmentId: string;
  equipment: {
    name: string;
    type: string;
    image: string;
    location: string;
  };
  startDate: string;
  endDate: string;
  nights: number;
  partySize: number;
  totalGbp: number;
  status: string;
  paymentStatus: string;
  createdAt: number;
};

const RESERVATION_STATUS_BADGE: Record<string, string> = {
  reserved: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-stone-200 text-stone-700",
};

const RESERVATION_PAYMENT_BADGE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  unpaid: "bg-amber-100 text-amber-800",
  refunded: "bg-stone-200 text-stone-700",
};

export default function AccountPage() {
  usePageSeo({ path: "/account", title: "Account", description: "Manage your Badr Adventures account, bookings, and gear rentals.", noindex: true });
  const { user, refresh } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [params] = useSearchParams();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setReservationsLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    api<{ bookings: Booking[] }>("/api/my/bookings")
      .then((res) => mounted && setBookings(res.bookings))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load bookings"))
      .finally(() => mounted && setLoading(false));
    setReservationsLoading(true);
    api<{ items: Reservation[] }>("/api/equipment-reserv")
      .then((res) => mounted && setReservations(res.items))
      .catch((err) => {
        if (mounted) {
          const msg = err instanceof Error ? err.message : "Failed to load reservations";
          toast.error(msg);
        }
      })
      .finally(() => mounted && setReservationsLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900">You need to sign in</h1>
        <p className="mt-2 text-stone-600">Sign in to see your bookings and saved hikes.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild className="bg-emerald-900 hover:bg-emerald-800">
            <Link to="/sign-in?next=/account">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/sign-up">Create account</Link>
          </Button>
        </div>
      </main>
    );
  }

  async function handleLogout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => null);
    clearStoredUser();
    await refresh();
    toast.success("Signed out. See you on the next trail.");
  }

  const upcoming = bookings.filter((b) => new Date(b.hikeDate).getTime() >= Date.now() - 24 * 3600 * 1000);
  const past = bookings.filter((b) => new Date(b.hikeDate).getTime() < Date.now() - 24 * 3600 * 1000);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
            Welcome, {user.name.split(" ")[0]}.
          </h1>
          <p className="text-stone-600">Your account · {user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.isAdmin && (
            <Button asChild variant="outline">
              <Link to="/admin">Admin dashboard</Link>
            </Button>
          )}
          <Button variant="outline" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </div>

      {params.get("booked") && (
        <Card className="mt-6 border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center gap-3 p-4 text-emerald-900">
            <ShieldCheck className="h-5 w-5" />
            <div>
              <div className="font-semibold">Booking confirmed.</div>
              <div className="text-sm">We've sent the details to your email. See you on the trail!</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upcoming" className="mt-8">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming · {upcoming.length}</TabsTrigger>
          <TabsTrigger value="past">Past · {past.length}</TabsTrigger>
          <TabsTrigger value="rentals">Rentals</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-stone-500">Loading…</CardContent>
            </Card>
          ) : upcoming.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Compass className="mx-auto h-8 w-8 text-stone-400" />
                <p className="mt-2 text-stone-600">No upcoming hikes yet.</p>
                <Button asChild className="mt-4 bg-emerald-900 hover:bg-emerald-800">
                  <Link to="/hikes">Browse hikes</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcoming.map((b) => <BookingRow key={b.id} b={b} />)
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-4 space-y-3">
          {past.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-stone-500">
                No past trips yet. They will show up here once you've hiked with us.
              </CardContent>
            </Card>
          ) : (
            past.map((b) => <BookingRow key={b.id} b={b} />)
          )}
        </TabsContent>
        <TabsContent value="rentals" className="mt-4 space-y-3">
          {reservationsLoading ? (
            <Card>
              <CardContent className="p-6 text-stone-500">Loading…</CardContent>
            </Card>
          ) : reservations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Compass className="mx-auto h-8 w-8 text-stone-400" />
                <p className="mt-2 text-stone-600">No rentals yet.</p>
              </CardContent>
            </Card>
          ) : (
            reservations.map((r) => <ReservationRow key={r.id} r={r} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingRow({ b }: { b: Booking }) {
  const badge = (() => {
    if (b.status === "confirmed" && b.paymentStatus === "paid")
      return <Badge className="bg-emerald-100 text-emerald-800">Confirmed</Badge>;
    if (b.status === "pending")
      return <Badge className="bg-amber-100 text-amber-800">Awaiting payment</Badge>;
    if (b.status === "cancelled") return <Badge className="bg-stone-200 text-stone-700">Cancelled</Badge>;
    return <Badge>{b.status}</Badge>;
  })();
  return (
    <Card>
      <CardContent className="grid gap-4 p-5 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-stone-900">{b.hikeTitle}</h3>
            {badge}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-stone-500">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDate(b.hikeDate)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {b.hikeLocation}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {b.partySize}
            </span>
          </div>
        </div>
        <div className="text-sm">
          <div className="text-stone-500">Total</div>
          <div className="text-lg font-semibold text-stone-900">{formatGbp(b.totalPence)}</div>
        </div>
        <div>
          <Button asChild variant="outline" size="sm">
            <Link to={`/hikes/${b.hikeId}`}>View hike</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReservationRow({ r }: { r: Reservation }) {
  const statusClass = (() => {
    if (r.status === "confirmed")
      return "bg-emerald-100 text-emerald-800";
    if (r.status === "reserved")
      return "bg-amber-100 text-amber-800";
    if (r.status === "cancelled")
      return "bg-stone-200 text-stone-700";
    return "bg-stone-100 text-stone-600";
  })();
  const paymentClass = (() => {
    if (r.paymentStatus === "paid")
      return "bg-emerald-100 text-emerald-800";
    if (r.paymentStatus === "unpaid")
      return "bg-amber-100 text-amber-800";
    if (r.paymentStatus === "refunded")
      return "bg-stone-200 text-stone-700";
    return "bg-stone-100 text-stone-600";
  })();
  return (
    <Card>
      <CardContent className="grid gap-4 p-5 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-stone-900">{r.equipment.name}</h3>
            <Badge className={statusClass}>{r.status}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-stone-500">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDate(r.startDate)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {r.equipment.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {r.partySize}
            </span>
          </div>
        </div>
        <div className="text-sm">
          <div className="text-stone-500">Total</div>
          <div className="text-lg font-semibold text-stone-900">{formatGbp(r.totalGbp)}</div>
        </div>
        <div>
          <Button asChild variant="outline" size="sm">
            <Link to={`/equipment/${r.equipmentId}`}>View equipment</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}