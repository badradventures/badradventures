import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CalendarDays, CheckCircle2, Edit3, Eye, Inbox, Mail, Mountain, Pencil, Plus, RefreshCcw, Save, Search, ShieldCheck, TrendingUp, Users, Wallet, X, Send, Trash2, Tent, Package } from "lucide-react";
import { api, formatDate, formatGbp, type ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/site-shell";
import { toast } from "sonner";
import { usePageSeo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { ImageUploader } from "@/components/image-uploader";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type FieldErrors = Record<string, string>;

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 flex items-start gap-1 text-xs text-rose-700">
      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function fieldClass(hasError: boolean) {
  return cn("mt-1", hasError && "border-rose-500 focus-visible:ring-rose-500");
}

function mapZodDetailsToFields(details: unknown): FieldErrors {
  if (!Array.isArray(details)) return {};
  const out: FieldErrors = {};
  for (const issue of details) {
    if (!issue || typeof issue !== "object") continue;
    const path = Array.isArray((issue as { path?: unknown }).path) ? (issue as { path: unknown[] }).path : [];
    const message = typeof (issue as { message?: unknown }).message === "string" ? (issue as { message: string }).message : "";
    if (!path.length || !message) continue;
    const key = String(path[0]);
    if (!out[key]) out[key] = message;
  }
  return out;
}

function mergeErrors(...maps: FieldErrors[]): FieldErrors {
  return maps.reduce<FieldErrors>((acc, m) => {
    for (const [k, v] of Object.entries(m)) if (!acc[k] && v) acc[k] = v;
    return acc;
  }, {});
}

type Overview = {
  counts: {
    users: number;
    hikes: number;
    bookings: number;
    pending: number;
    paid: number;
    messages: number;
  };
  bookings: Array<{
    id: string;
    user_name: string;
    user_email: string;
    hike_title: string;
    party_size: number;
    total_pence: number;
    status: string;
    payment_status: string;
    created_at: number;
    hike_id: string;
  }>;
  messages: Array<{
    id: number;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    created_at: number;
  }>;
};

type AdminHike = {
  id: string;
  title: string;
  location: string;
  region: string;
  date: string;
  duration: string;
  difficulty: string;
  price_pence: number;
  spots_left: number;
  spots_total: number;
  summary: string;
  description: string;
  image: string;
  hero: string;
  tags: string[];
  guide: string;
  publishToEventbrite?: boolean;
  eventbriteEventId?: string | null;
};

type AdminEquipment = {
  id: string;
  name: string;
  type: string;
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
  active: boolean;
  createdAt: string;
};

const emptyHike: Partial<AdminHike> = {
  id: "", title: "", location: "", region: "", date: "", duration: "", difficulty: "Moderate",
  price_pence: 0, spots_total: 20, spots_left: 20, summary: "", description: "", image: "", hero: "",
  tags: [], guide: "",
};

const emptyEquipment: Partial<AdminEquipment> = {
  id: "", name: "", type: "tent", summary: "", description: "", image: "", location: "",
  capacity: 2, pricePerNightPence: 0, totalUnits: 2, availableUnits: 2, features: [],
};

export default function AdminPage() {
  usePageSeo({ path: "/admin", title: "Admin", description: "Badr Adventures admin dashboard.", noindex: true });
  const { user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [hikes, setHikes] = useState<AdminHike[]>([]);
  const [equipment, setEquipment] = useState<AdminEquipment[]>([]);
  const [editingHike, setEditingHike] = useState<AdminHike | null>(null);
  const [creatingHike, setCreatingHike] = useState(false);
  const [editingEquip, setEditingEquip] = useState<AdminEquipment | null>(null);
  const [creatingEquip, setCreatingEquip] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [ov, hk, eq] = await Promise.all([
        api<Overview>("/api/admin/overview"),
        api<{ hikes: AdminHike[] }>("/api/hikes"),
        api<{ items: AdminEquipment[] }>("/api/equipment"),
      ]);
      setOverview(ov);
      setHikes(hk.hikes);
      setEquipment(eq.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user || !user.isAdmin) return;
    refresh();
  }, [user?.id]);

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900">Sign in required</h1>
        <p className="mt-2 text-stone-600">The admin dashboard is only for staff.</p>
        <Button asChild className="mt-6 bg-emerald-900 hover:bg-emerald-800">
          <Link to="/sign-in?next=/admin">Sign in</Link>
        </Button>
      </main>
    );
  }
  if (!user.isAdmin) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900">No access</h1>
        <p className="mt-2 text-stone-600">Your account is not an admin.</p>
      </main>
    );
  }

  const overviewBookings = overview?.bookings ?? [];
  const messages = overview?.messages ?? [];
  const messagesCount = overview?.counts.messages ?? messages.length;
  const [inboxUnread, setInboxUnread] = useState(0);

  async function refreshInboxUnread() {
    try {
      const res = await api<{ unread: number }>("/api/admin/inbox/unread-count");
      setInboxUnread(res.unread ?? 0);
    } catch {
      // Inbox is optional — if IMAP isn't configured we just don't show a badge.
    }
  }

  useEffect(() => {
    refreshInboxUnread();
    const id = window.setInterval(refreshInboxUnread, 60_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Admin
          </span>
          <h1 className="mt-3 text-2xl font-bold text-stone-900 sm:text-3xl">Operations dashboard</h1>
          <p className="text-stone-600">Manage events, equipment, bookings, and contact submissions.</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {overview && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total revenue" value={formatGbp(overviewBookings.reduce((sum, b) => sum + (b.total_pence || 0), 0))} icon={Wallet} tint="bg-emerald-100 text-emerald-800" />
          <Stat label="Bookings" value={overview.counts.bookings} icon={CalendarDays} tint="bg-amber-100 text-amber-800" />
          <Stat label="Pending" value={overview.counts.pending} icon={TrendingUp} tint="bg-rose-100 text-rose-800" />
          <Stat label="Members" value={overview.counts.users} icon={Users} tint="bg-sky-100 text-sky-800" />
        </div>
      )}

      <Tabs defaultValue="bookings" className="mt-8">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="hikes">Events</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="messages">Contact · {messagesCount}</TabsTrigger>
          <TabsTrigger value="telegram" className="gap-2">
            Telegram bot
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-2">
            Inbox
            {inboxUnread > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                {inboxUnread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          {overviewBookings.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-stone-500">No bookings yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {overviewBookings.map((b) => (
                <Card key={b.id}>
                  <CardContent className="grid gap-3 p-5 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-stone-900">{b.hike_title}</h3>
                        {b.status === "confirmed" && b.payment_status === "paid" ? (
                          <Badge className="bg-emerald-100 text-emerald-800">Confirmed</Badge>
                        ) : b.status === "pending" ? (
                          <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                        ) : (
                          <Badge>{b.status}</Badge>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-stone-500">{b.user_name} · {b.user_email}</div>
                    </div>
                    <div className="text-sm text-stone-600">
                      <div>{b.party_size} {b.party_size === 1 ? "spot" : "spots"}</div>
                      <div className="text-xs text-stone-400">{formatDate(b.created_at)}</div>
                    </div>
                    <div className="text-sm font-semibold text-stone-900">{formatGbp(b.total_pence)}</div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/hikes/${b.hike_id}`}>View event</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hikes" className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-stone-500">{hikes.length} event{hikes.length !== 1 ? "s" : ""}</span>
            <Button onClick={() => setCreatingHike(true)} className="bg-emerald-900 hover:bg-emerald-800">
              <Plus className="mr-1.5 h-4 w-4" /> New event
            </Button>
          </div>
          {hikes.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-stone-500">No events yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {hikes.map((h) => (
                <Card key={h.id}>
                  <CardContent className="grid gap-3 p-5 sm:grid-cols-[1.5fr_1fr_1fr_auto_auto] sm:items-center">
                    <div>
                      <h3 className="text-base font-semibold text-stone-900">{h.title}</h3>
                      <div className="mt-1 text-sm text-stone-500">{h.location} · {formatDate(h.date)} · {h.difficulty}</div>
                    </div>
                    <div className="text-sm text-stone-600">Spots: {h.spots_left}/{h.spots_total}</div>
                    <div className="text-sm font-semibold text-stone-900">{formatGbp(h.price_pence)}</div>
                    <Button variant="outline" size="sm" onClick={() => setEditingHike(h)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                      if (!confirm(`Delete "${h.title}"? This cannot be undone.`)) return;
                      try {
                        await api(`/api/admin/hikes/${h.id}`, { method: "DELETE" });
                        toast.success("Event deleted.");
                        refresh();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to delete");
                      }
                    }} className="text-rose-700 hover:bg-rose-50 hover:text-rose-800">
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="equipment" className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-stone-500">{equipment.length} item{equipment.length !== 1 ? "s" : ""}</span>
            <Button onClick={() => setCreatingEquip(true)} className="bg-emerald-900 hover:bg-emerald-800">
              <Plus className="mr-1.5 h-4 w-4" /> New item
            </Button>
          </div>
          {equipment.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-stone-500">No equipment yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {equipment.map((e) => (
                <Card key={e.id}>
                  <CardContent className="grid gap-3 p-5 sm:grid-cols-[1.5fr_1fr_1fr_auto_auto] sm:items-center">
                    <div>
                      <h3 className="text-base font-semibold text-stone-900">{e.name}</h3>
                      <div className="mt-1 text-sm text-stone-500">{e.location} · {e.type} · {e.capacity} ppl</div>
                    </div>
                    <div className="text-sm text-stone-600">Stock: {e.availableUnits}/{e.totalUnits}</div>
                    <div className="text-sm font-semibold text-stone-900">{formatGbp(e.pricePerNightPence)}/night</div>
                    <Button variant="outline" size="sm" onClick={() => setEditingEquip(e)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                      if (!confirm(`Delete "${e.name}"? This cannot be undone.`)) return;
                      try {
                        await api(`/api/admin/equipment/${e.id}`, { method: "DELETE" });
                        toast.success("Equipment deleted.");
                        refresh();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to delete");
                      }
                    }} className="text-rose-700 hover:bg-rose-50 hover:text-rose-800">
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          {messages.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-stone-500">No contact submissions yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <Card key={m.id}>
                  <CardContent className="space-y-2 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-stone-900">{m.subject || "No subject"}</h3>
                      <span className="text-xs text-stone-400">{formatDate(m.created_at)}</span>
                    </div>
                    <div className="text-sm text-stone-500">{m.name} · <a href={`mailto:${m.email}`} className="text-emerald-700 hover:underline">{m.email}</a></div>
                    <p className="text-sm text-stone-700 whitespace-pre-line">{m.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="telegram" className="mt-4">
          <TelegramAllowlist />
        </TabsContent>

        <TabsContent value="inbox" className="mt-4">
          <InboxPanel onUnreadChange={setInboxUnread} />
        </TabsContent>
      </Tabs>

      {editingHike && (
        <HikeDialog
          hike={editingHike}
          onClose={() => setEditingHike(null)}
          onSaved={() => { setEditingHike(null); refresh(); }}
        />
      )}
      {creatingHike && (
        <HikeDialog
          hike={null}
          onClose={() => setCreatingHike(false)}
          onSaved={() => { setCreatingHike(false); refresh(); }}
        />
      )}
      {editingEquip && (
        <EquipmentDialog
          equipment={editingEquip}
          onClose={() => setEditingEquip(null)}
          onSaved={() => { setEditingEquip(null); refresh(); }}
        />
      )}
      {creatingEquip && (
        <EquipmentDialog
          equipment={null}
          onClose={() => setCreatingEquip(false)}
          onSaved={() => { setCreatingEquip(false); refresh(); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, tint }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; tint: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-stone-500">{label}</div>
          <div className="text-xl font-semibold text-stone-900">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

const DIFFICULTIES = ["Easy", "Moderate", "Challenging", "Strenuous"] as const;
const EQUIP_TYPES = ["tent", "bnb", "gear"] as const;

function HikeDialog({ hike, onClose, onSaved }: { hike: AdminHike | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !hike;
  const [id, setId] = useState(isNew ? "" : hike.id);
  const [title, setTitle] = useState(isNew ? "" : hike.title);
  const [location, setLocation] = useState(isNew ? "" : hike.location);
  const [region, setRegion] = useState(isNew ? "" : hike.region);
  const [date, setDate] = useState(isNew ? "" : hike.date.slice(0, 10));
  const [duration, setDuration] = useState(isNew ? "" : hike.duration);
  const [difficulty, setDifficulty] = useState(isNew ? "Moderate" : hike.difficulty);
  const [priceGbp, setPriceGbp] = useState(isNew ? "35" : String(hike.price_pence / 100));
  const [spotsTotal, setSpotsTotal] = useState(isNew ? "20" : String(hike.spots_total));
  const [summary, setSummary] = useState(isNew ? "" : hike.summary);
  const [description, setDescription] = useState(isNew ? "" : hike.description);
  const [image, setImage] = useState(isNew ? "" : hike.image);
  const [hero, setHero] = useState(isNew ? "" : hike.hero);
  const [guide, setGuide] = useState(isNew ? "" : hike.guide);
  const [tags, setTags] = useState(isNew ? "" : hike.tags.join(", "));
  const [publishToEventbrite, setPublishToEventbrite] = useState(isNew ? false : (hike as any).publishToEventbrite ?? false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const values = useMemo(
    () => ({ id, title, location, region, date, duration, difficulty, priceGbp, spotsTotal, summary, description, image, hero, guide, tags, publishToEventbrite }),
    [id, title, location, region, date, duration, difficulty, priceGbp, spotsTotal, summary, description, image, hero, guide, tags, publishToEventbrite],
  );

  function validateHike(v: typeof values, requireAll: boolean): FieldErrors {
    const e: FieldErrors = {};
    const trimmedId = v.id.trim();
    const trimmedTitle = v.title.trim();
    const trimmedLocation = v.location.trim();
    const trimmedRegion = v.region.trim();
    const trimmedDate = v.date.trim();
    const trimmedDuration = v.duration.trim();
    const trimmedSummary = v.summary.trim();
    const trimmedDescription = v.description.trim();
    const trimmedImage = v.image.trim();
    const trimmedGuide = v.guide.trim();
    const price = Number(v.priceGbp);
    const spots = Number(v.spotsTotal);

    if (isNew) {
      if (!trimmedId) e.id = "ID is required.";
      else if (trimmedId.length < 2) e.id = "ID must be at least 2 characters.";
      else if (trimmedId.length > 80) e.id = "ID must be 80 characters or fewer.";
      else if (!SLUG_RE.test(trimmedId)) e.id = "Use lowercase letters, numbers, and hyphens only (e.g. kinder-scout).";
    }
    if (!trimmedTitle) e.title = "Title is required.";
    else if (trimmedTitle.length < 2) e.title = "Title must be at least 2 characters.";
    if (!trimmedLocation) e.location = "Location is required.";
    if (!trimmedRegion) e.region = "Region is required.";
    if (!trimmedDate) e.date = "Date is required.";
    else if (!DATE_RE.test(trimmedDate)) e.date = "Use a valid date (YYYY-MM-DD).";
    if (!trimmedDuration) e.duration = "Duration is required.";
    if (!v.difficulty) e.difficulty = "Pick a difficulty.";

    if (v.priceGbp.trim() === "" || Number.isNaN(price)) e.priceGbp = "Enter a price in GBP.";
    else if (price < 0) e.priceGbp = "Price can't be negative.";

    if (v.spotsTotal.trim() === "" || !Number.isFinite(spots) || !Number.isInteger(spots)) e.spotsTotal = "Enter a whole number.";
    else if (requireAll ? spots < 1 : spots < 0) e.spotsTotal = "Must be at least 1 when creating.";
    else if (spots > 500) e.spotsTotal = "Max 500 spots.";

    if (isNew) {
      if (!trimmedImage) e.image = "Image URL is required.";
      if (!trimmedGuide) e.guide = "Guide name is required.";
    }
    if (!trimmedSummary) e.summary = "Summary is required.";
    else if (trimmedSummary.length < 2) e.summary = "Summary must be at least 2 characters.";
    if (!trimmedDescription) e.description = "Description is required.";
    else if (trimmedDescription.length < 10) e.description = "Description must be at least 10 characters.";

    return e;
  }

  const liveErrors = useMemo(() => validateHike(values, false), [values]);
  function errFor(field: string) {
    return touched[field] ? errors[field] || liveErrors[field] : undefined;
  }

  function markTouched(field: string) {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }

  async function save() {
    const v = validateHike(values, true);
    setErrors(v);
    setTouched(
      Object.keys(values).reduce<Record<string, boolean>>((acc, k) => {
        acc[k] = true;
        return acc;
      }, {}),
    );
    if (Object.keys(v).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const body = isNew
        ? {
            id: id.trim(),
            title: title.trim(),
            location: location.trim(),
            region: region.trim(),
            date,
            duration: duration.trim(),
            difficulty,
            spotsTotal: Number(spotsTotal),
            priceGbp: Number(priceGbp),
            summary: summary.trim(),
            description: description.trim(),
            image: image.trim(),
            hero: hero.trim() || image.trim(),
            guide: guide.trim(),
            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            publishToEventbrite,
          }
        : {
            title: title.trim(),
            location: location.trim(),
            date,
            duration: duration.trim(),
            difficulty,
            priceGbp: Number(priceGbp),
            spotsTotal: Number(spotsTotal),
            summary: summary.trim(),
            description: description.trim(),
            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            publishToEventbrite,
          };
      await api(isNew ? "/api/admin/hikes" : `/api/admin/hikes/${hike.id}`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(body),
      });
      toast.success(isNew ? "Event created." : "Event updated.");
      onSaved();
    } catch (err) {
      const apiErr = err as ApiError;
      const fieldErrs = mapZodDetailsToFields(apiErr.body && typeof apiErr.body === "object" ? (apiErr.body as { details?: unknown }).details : undefined);
      if (Object.keys(fieldErrs).length > 0) {
        setErrors(mergeErrors(liveErrors, fieldErrs));
        setTouched(
          Object.keys(values).reduce<Record<string, boolean>>((acc, k) => {
            acc[k] = true;
            return acc;
          }, {}),
        );
        toast.error("Please fix the highlighted fields.");
      } else {
        toast.error(apiErr.message || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? "Create event" : "Edit event"}</DialogTitle>
          <DialogDescription>{isNew ? "Add a new event to the public listings." : "Changes apply to the public listing immediately."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {isNew && (
            <div className="sm:col-span-2">
              <Label htmlFor="hid">ID (URL slug, e.g. kinder-scout)</Label>
              <Input
                id="hid"
                value={id}
                onChange={(e) => setId(e.target.value)}
                onBlur={() => markTouched("id")}
                placeholder="kinder-scout"
                className={cn("mt-1 font-mono text-sm", errFor("id") && "border-rose-500 focus-visible:ring-rose-500")}
                aria-invalid={!!errFor("id")}
                aria-describedby={errFor("id") ? "hid-err" : undefined}
              />
              <FieldError id="hid-err" message={errFor("id")} />
            </div>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => markTouched("title")}
              className={fieldClass(!!errFor("title"))}
              aria-invalid={!!errFor("title")}
              aria-describedby={errFor("title") ? "title-err" : undefined}
            />
            <FieldError id="title-err" message={errFor("title")} />
          </div>
          <div>
            <Label htmlFor="loc">Location</Label>
            <Input
              id="loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={() => markTouched("location")}
              className={fieldClass(!!errFor("location"))}
              aria-invalid={!!errFor("location")}
              aria-describedby={errFor("location") ? "loc-err" : undefined}
            />
            <FieldError id="loc-err" message={errFor("location")} />
          </div>
          <div>
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              onBlur={() => markTouched("region")}
              className={fieldClass(!!errFor("region"))}
              placeholder="e.g. Lake District"
              aria-invalid={!!errFor("region")}
              aria-describedby={errFor("region") ? "region-err" : undefined}
            />
            <FieldError id="region-err" message={errFor("region")} />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onBlur={() => markTouched("date")}
              className={fieldClass(!!errFor("date"))}
              aria-invalid={!!errFor("date")}
              aria-describedby={errFor("date") ? "date-err" : undefined}
            />
            <FieldError id="date-err" message={errFor("date")} />
          </div>
          <div>
            <Label htmlFor="dur">Duration</Label>
            <Input
              id="dur"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onBlur={() => markTouched("duration")}
              placeholder="e.g. 2 days"
              className={fieldClass(!!errFor("duration"))}
              aria-invalid={!!errFor("duration")}
              aria-describedby={errFor("duration") ? "dur-err" : undefined}
            />
            <FieldError id="dur-err" message={errFor("duration")} />
          </div>
          <div>
            <Label htmlFor="diff">Difficulty</Label>
            <select
              id="diff"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              onBlur={() => markTouched("difficulty")}
              className={cn("mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", errFor("difficulty") && "border-rose-500 focus-visible:ring-rose-500")}
              aria-invalid={!!errFor("difficulty")}
              aria-describedby={errFor("difficulty") ? "diff-err" : undefined}
            >
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <FieldError id="diff-err" message={errFor("difficulty")} />
          </div>
          <div>
            <Label htmlFor="price">Price (GBP)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={priceGbp}
              onChange={(e) => setPriceGbp(e.target.value)}
              onBlur={() => markTouched("priceGbp")}
              className={fieldClass(!!errFor("priceGbp"))}
              aria-invalid={!!errFor("priceGbp")}
              aria-describedby={errFor("priceGbp") ? "price-err" : undefined}
            />
            <FieldError id="price-err" message={errFor("priceGbp")} />
          </div>
          <div>
            <Label htmlFor="spots">Total spots</Label>
            <Input
              id="spots"
              type="number"
              min="0"
              value={spotsTotal}
              onChange={(e) => setSpotsTotal(e.target.value)}
              onBlur={() => markTouched("spotsTotal")}
              className={fieldClass(!!errFor("spotsTotal"))}
              aria-invalid={!!errFor("spotsTotal")}
              aria-describedby={errFor("spotsTotal") ? "spots-err" : undefined}
            />
            <FieldError id="spots-err" message={errFor("spotsTotal")} />
          </div>
          {isNew && (
            <>
              <ImageUploader
                label="Cover image"
                value={image}
                onChange={(url) => { setImage(url); markTouched("image"); }}
                onBlur={() => markTouched("image")}
                bucket="hikes"
                folder={id || "draft"}
                fieldId="img"
                error={errFor("image")}
                errorId="img-err"
              />
              <ImageUploader
                label="Hero image (optional)"
                value={hero}
                onChange={(url) => { setHero(url); markTouched("hero"); }}
                onBlur={() => markTouched("hero")}
                bucket="hikes"
                folder={id || "draft"}
                fieldId="hero"
                error={errFor("hero")}
                errorId="hero-err"
                description="Large banner image. Leave empty to use the cover image."
              />
              <div className="sm:col-span-2">
                <Label htmlFor="guide">Guide name</Label>
                <Input
                  id="guide"
                  value={guide}
                  onChange={(e) => setGuide(e.target.value)}
                  onBlur={() => markTouched("guide")}
                  className={fieldClass(!!errFor("guide"))}
                  aria-invalid={!!errFor("guide")}
                  aria-describedby={errFor("guide") ? "guide-err" : undefined}
                />
                <FieldError id="guide-err" message={errFor("guide")} />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              onBlur={() => markTouched("tags")}
              className={fieldClass(!!errFor("tags"))}
              aria-invalid={!!errFor("tags")}
              aria-describedby={errFor("tags") ? "tags-err" : undefined}
            />
            <FieldError id="tags-err" message={errFor("tags")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="summary">Summary</Label>
            <Input
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              onBlur={() => markTouched("summary")}
              className={fieldClass(!!errFor("summary"))}
              aria-invalid={!!errFor("summary")}
              aria-describedby={errFor("summary") ? "summary-err" : undefined}
            />
            <FieldError id="summary-err" message={errFor("summary")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="desc">Description</Label>
            <textarea
              id="desc"
              rows={12}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => markTouched("description")}
              className={fieldClass(!!errFor("description")) + " w-full font-mono text-sm leading-relaxed resize-y"}
              aria-invalid={!!errFor("description")}
              aria-describedby={errFor("description") ? "desc-err" : undefined}
              placeholder="<h2>Itinerary</h2><p>We'll start at 8am from the car park...</p>"
            />
            <p className="mt-1 text-xs text-stone-400">HTML is supported.</p>
            <FieldError id="desc-err" message={errFor("description")} />
          </div>

          {/* Eventbrite publish checkbox */}
          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-4 cursor-pointer hover:bg-stone-50 transition-colors">
              <input
                type="checkbox"
                checked={publishToEventbrite}
                onChange={(e) => setPublishToEventbrite(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
              />
              <div className="flex-1 select-none">
                <span className="text-sm font-medium text-stone-900">Publish to Eventbrite</span>
                <p className="mt-0.5 text-xs text-stone-500">
                  Creates a listing on Eventbrite with a ticket link back to badradventures.co.uk
                  {hike?.eventbriteEventId && (
                    <span className="block mt-1 text-emerald-700">
                      ✓ Published — <a
                        href={`https://www.eventbrite.co.uk/e/${hike.eventbriteEventId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-emerald-800"
                        onClick={(e) => e.stopPropagation()}
                      >View on Eventbrite &rarr;</a>
                    </span>
                  )}
                </p>
              </div>
            </label>
          </div>

        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}><X className="mr-1 h-4 w-4" /> Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-900 hover:bg-emerald-800">
            <Save className="mr-1 h-4 w-4" /> {saving ? "Saving…" : isNew ? "Create event" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EquipmentDialog({ equipment, onClose, onSaved }: { equipment: AdminEquipment | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !equipment;
  const [id, setId] = useState(isNew ? "" : equipment.id);
  const [name, setName] = useState(isNew ? "" : equipment.name);
  const [type, setType] = useState(isNew ? "tent" : equipment.type);
  const [summary, setSummary] = useState(isNew ? "" : equipment.summary);
  const [description, setDescription] = useState(isNew ? "" : equipment.description);
  const [image, setImage] = useState(isNew ? "" : equipment.image);
  const [location, setLocation] = useState(isNew ? "" : equipment.location);
  const [capacity, setCapacity] = useState(isNew ? "2" : String(equipment.capacity));
  const [priceGbp, setPriceGbp] = useState(isNew ? "25" : String(equipment.pricePerNightGbp));
  const [stock, setStock] = useState(isNew ? "2" : String(equipment.totalUnits));
  const [amenities, setAmenities] = useState(isNew ? "" : (equipment.features || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const values = useMemo(
    () => ({ id, name, type, summary, description, image, location, capacity, priceGbp, stock, amenities }),
    [id, name, type, summary, description, image, location, capacity, priceGbp, stock, amenities],
  );

  function validateEquipment(v: typeof values): FieldErrors {
    const e: FieldErrors = {};
    const trimmedId = v.id.trim();
    const trimmedName = v.name.trim();
    const trimmedSummary = v.summary.trim();
    const trimmedImage = v.image.trim();
    const trimmedLocation = v.location.trim();
    const cap = Number(v.capacity);
    const price = Number(v.priceGbp);
    const stk = Number(v.stock);

    if (isNew) {
      if (!trimmedId) e.id = "ID is required.";
      else if (trimmedId.length < 2) e.id = "ID must be at least 2 characters.";
      else if (trimmedId.length > 80) e.id = "ID must be 80 characters or fewer.";
      else if (!SLUG_RE.test(trimmedId)) e.id = "Use lowercase letters, numbers, and hyphens only (e.g. 3-person-tent).";
    }
    if (!trimmedName) e.name = "Name is required.";
    if (!v.type) e.type = "Pick a type.";

    if (v.capacity.trim() === "" || !Number.isFinite(cap) || !Number.isInteger(cap)) e.capacity = "Enter a whole number.";
    else if (cap < 1) e.capacity = "Must be at least 1 person.";

    if (v.priceGbp.trim() === "" || Number.isNaN(price)) e.priceGbp = "Enter a price in GBP.";
    else if (price < 0) e.priceGbp = "Price can't be negative.";

    if (v.stock.trim() === "" || !Number.isFinite(stk) || !Number.isInteger(stk)) e.stock = "Enter a whole number.";
    else if (stk < 0) e.stock = "Stock can't be negative.";

    if (isNew && !trimmedImage) e.image = "Image URL is required.";
    if (!trimmedLocation) e.location = "Location is required.";
    if (!trimmedSummary) e.summary = "Summary is required.";
    return e;
  }

  const liveErrors = useMemo(() => validateEquipment(values), [values]);
  function errFor(field: string) {
    return touched[field] ? errors[field] || liveErrors[field] : undefined;
  }
  function markTouched(field: string) {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }

  async function save() {
    const v = validateEquipment(values);
    setErrors(v);
    setTouched(
      Object.keys(values).reduce<Record<string, boolean>>((acc, k) => {
        acc[k] = true;
        return acc;
      }, {}),
    );
    if (Object.keys(v).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const body = isNew
        ? {
            id: id.trim(),
            type,
            name: name.trim(),
            summary: summary.trim(),
            description: description.trim(),
            image: image.trim(),
            location: location.trim(),
            pricePerNightGbp: Number(priceGbp),
            capacity: Number(capacity),
            stock: Number(stock),
            amenities: amenities.split(",").map((a) => a.trim()).filter(Boolean),
          }
        : {
            type,
            name: name.trim(),
            summary: summary.trim(),
            description: description.trim(),
            location: location.trim(),
            pricePerNightGbp: Number(priceGbp),
            capacity: Number(capacity),
            stock: Number(stock),
            amenities: amenities.split(",").map((a) => a.trim()).filter(Boolean),
          };
      await api(isNew ? "/api/admin/equipment" : `/api/admin/equipment/${equipment.id}`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(body),
      });
      toast.success(isNew ? "Equipment created." : "Equipment updated.");
      onSaved();
    } catch (err) {
      const apiErr = err as ApiError;
      const rawFieldErrs = mapZodDetailsToFields(
        apiErr.body && typeof apiErr.body === "object" ? (apiErr.body as { details?: unknown }).details : undefined,
      );
      // Map server wire names back to form field names.
      const EQUIP_SERVER_ALIASES: Record<string, string> = { pricePerNightGbp: "priceGbp" };
      const fieldErrs: FieldErrors = {};
      for (const [k, msg] of Object.entries(rawFieldErrs)) {
        const key = EQUIP_SERVER_ALIASES[k] ?? k;
        if (!fieldErrs[key]) fieldErrs[key] = msg;
      }
      if (Object.keys(fieldErrs).length > 0) {
        setErrors(mergeErrors(liveErrors, fieldErrs));
        setTouched(
          Object.keys(values).reduce<Record<string, boolean>>((acc, k) => {
            acc[k] = true;
            return acc;
          }, {}),
        );
        toast.error("Please fix the highlighted fields.");
      } else {
        toast.error(apiErr.message || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? "Create equipment" : "Edit equipment"}</DialogTitle>
          <DialogDescription>{isNew ? "Add a new rental item." : "Changes apply to the public listing immediately."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {isNew && (
            <div className="sm:col-span-2">
              <Label htmlFor="eid">ID (URL slug, e.g. 3-person-tent)</Label>
              <Input
                id="eid"
                value={id}
                onChange={(e) => setId(e.target.value)}
                onBlur={() => markTouched("id")}
                placeholder="3-person-tent"
                className={cn("mt-1 font-mono text-sm", errFor("id") && "border-rose-500 focus-visible:ring-rose-500")}
                aria-invalid={!!errFor("id")}
                aria-describedby={errFor("id") ? "eid-err" : undefined}
              />
              <FieldError id="eid-err" message={errFor("id")} />
            </div>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="ename">Name</Label>
            <Input
              id="ename"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => markTouched("name")}
              className={fieldClass(!!errFor("name"))}
              aria-invalid={!!errFor("name")}
              aria-describedby={errFor("name") ? "ename-err" : undefined}
            />
            <FieldError id="ename-err" message={errFor("name")} />
          </div>
          <div>
            <Label htmlFor="etype">Type</Label>
            <select
              id="etype"
              value={type}
              onChange={(e) => setType(e.target.value)}
              onBlur={() => markTouched("type")}
              className={cn(
                "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                errFor("type") && "border-rose-500 focus-visible:ring-rose-500",
              )}
              aria-invalid={!!errFor("type")}
              aria-describedby={errFor("type") ? "etype-err" : undefined}
            >
              {EQUIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <FieldError id="etype-err" message={errFor("type")} />
          </div>
          <div>
            <Label htmlFor="eloc">Location</Label>
            <Input
              id="eloc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={() => markTouched("location")}
              className={fieldClass(!!errFor("location"))}
              aria-invalid={!!errFor("location")}
              aria-describedby={errFor("location") ? "eloc-err" : undefined}
            />
            <FieldError id="eloc-err" message={errFor("location")} />
          </div>
          <div>
            <Label htmlFor="ecap">Capacity (people)</Label>
            <Input
              id="ecap"
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              onBlur={() => markTouched("capacity")}
              className={fieldClass(!!errFor("capacity"))}
              aria-invalid={!!errFor("capacity")}
              aria-describedby={errFor("capacity") ? "ecap-err" : undefined}
            />
            <FieldError id="ecap-err" message={errFor("capacity")} />
          </div>
          <div>
            <Label htmlFor="eprice">Price per night (GBP)</Label>
            <Input
              id="eprice"
              type="number"
              step="0.01"
              min="0"
              value={priceGbp}
              onChange={(e) => setPriceGbp(e.target.value)}
              onBlur={() => markTouched("priceGbp")}
              className={fieldClass(!!errFor("priceGbp"))}
              aria-invalid={!!errFor("priceGbp")}
              aria-describedby={errFor("priceGbp") ? "eprice-err" : undefined}
            />
            <FieldError id="eprice-err" message={errFor("priceGbp")} />
          </div>
          <div>
            <Label htmlFor="estock">Stock (units)</Label>
            <Input
              id="estock"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              onBlur={() => markTouched("stock")}
              className={fieldClass(!!errFor("stock"))}
              aria-invalid={!!errFor("stock")}
              aria-describedby={errFor("stock") ? "estock-err" : undefined}
            />
            <FieldError id="estock-err" message={errFor("stock")} />
          </div>
          {isNew && (
            <ImageUploader
              label="Cover image"
              value={image}
              onChange={(url) => { setImage(url); markTouched("image"); }}
              onBlur={() => markTouched("image")}
              bucket="equipment"
              folder={id || "draft"}
              fieldId="eimg"
              error={errFor("image")}
              errorId="eimg-err"
            />
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="eamens">Amenities / features (comma separated)</Label>
            <Input
              id="eamens"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              onBlur={() => markTouched("amenities")}
              className={fieldClass(!!errFor("amenities"))}
              aria-invalid={!!errFor("amenities")}
              aria-describedby={errFor("amenities") ? "eamens-err" : undefined}
            />
            <FieldError id="eamens-err" message={errFor("amenities")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="esummary">Summary</Label>
            <Input
              id="esummary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              onBlur={() => markTouched("summary")}
              className={fieldClass(!!errFor("summary"))}
              aria-invalid={!!errFor("summary")}
              aria-describedby={errFor("summary") ? "esummary-err" : undefined}
            />
            <FieldError id="esummary-err" message={errFor("summary")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="edesc">Description</Label>
            <Textarea
              id="edesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => markTouched("description")}
              className={fieldClass(!!errFor("description"))}
              aria-invalid={!!errFor("description")}
              aria-describedby={errFor("description") ? "edesc-err" : undefined}
            />
            <FieldError id="edesc-err" message={errFor("description")} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}><X className="mr-1 h-4 w-4" /> Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-900 hover:bg-emerald-800">
            <Save className="mr-1 h-4 w-4" /> {saving ? "Saving…" : isNew ? "Create item" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TelegramAllowlist() {
  const [entries, setEntries] = useState<Array<{ chat_id: string; label: string | null; added_at: number; added_by: number | null }>>([]);
  const [chatId, setChatId] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const r = await api<{ entries: typeof entries }>("/api/admin/telegram-allowlist");
      setEntries(r.entries);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load allow-list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = chatId.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await api("/api/admin/telegram-allowlist", { method: "POST", body: JSON.stringify({ chatId: trimmed, label: label.trim() || null }) });
      setChatId(""); setLabel("");
      toast.success("Chat added.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setRemoving(id);
    try {
      await api(`/api/admin/telegram-allowlist/${encodeURIComponent(id)}`, { method: "DELETE" });
      toast.success("Chat removed.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> Telegram allow-list</CardTitle>
          <CardDescription>Only chats on this list can issue admin commands to the bot.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1.5fr_2fr_auto] sm:items-end">
            <div>
              <Label htmlFor="tg-chat-id">Chat ID</Label>
              <Input id="tg-chat-id" inputMode="numeric" placeholder="e.g. 7553803691" value={chatId} onChange={(e) => setChatId(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="tg-label">Label (optional)</Label>
              <Input id="tg-label" placeholder="e.g. Abu Jabal" value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" maxLength={80} />
            </div>
            <Button type="submit" disabled={saving || chatId.trim().length === 0} className="bg-emerald-900 hover:bg-emerald-800">
              <Send className="mr-1 h-4 w-4" /> {saving ? "Adding…" : "Add chat"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Allowed chats</CardTitle>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCcw className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading && entries.length === 0 ? <p className="text-sm text-stone-500">Loading…</p>
          : entries.length === 0 ? <p className="text-sm text-stone-500">No chats on the allow-list yet.</p>
          : <div className="divide-y divide-stone-100">
              {entries.map((e) => (
                <div key={e.chat_id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-stone-100 px-2 py-0.5 text-sm text-stone-800">{e.chat_id}</code>
                      {e.label && <span className="text-sm text-stone-700">{e.label}</span>}
                    </div>
                    <div className="mt-0.5 text-xs text-stone-400">Added {formatDate(e.added_at)}{e.added_by ? ` · by ${e.added_by}` : ""}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => remove(e.chat_id)} disabled={removing === e.chat_id} className="text-rose-700 hover:bg-rose-50 hover:text-rose-800">
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> {removing === e.chat_id ? "Removing…" : "Remove"}
                  </Button>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}

function InboxPanel({ onUnreadChange }: { onUnreadChange?: (n: number) => void }) {
  type Row = {
    uid: number;
    from: string;
    fromName: string | null;
    to: string;
    subject: string;
    date: string;
    preview: string;
    seen: boolean;
    flagged: boolean;
    hasAttachments: boolean;
    size: number;
  };
  type ListResp = { messages: Row[]; total: number; unread: number; fetchedAt: string };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ListResp | null>(null);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [open, setOpen] = useState<{ row: Row; body: string | null; html: string | null } | null>(null);
  const [marking, setMarking] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const json = await api<ListResp>("/api/admin/inbox?limit=50");
      setData(json);
      onUnreadChange?.(json.unread);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openMessage(row: Row) {
    setSelectedUid(row.uid);
    try {
      const json = await api<{ text: string | null; html: string | null }>(`/api/admin/inbox/${row.uid}`);
      setOpen({ row, body: json.text, html: json.html });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to open message");
    }
  }

  async function markSeen(row: Row) {
    setMarking(true);
    try {
      await api("/api/admin/inbox/seen", {
        method: "POST",
        body: JSON.stringify({ uid: row.uid, seen: !row.seen }),
      });
      await load();
      if (open?.row.uid === row.uid) {
        setOpen({ ...open, row: { ...open.row, seen: !row.seen } });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-stone-900">
              <Mail className="h-4 w-4" /> Enquiries inbox
            </CardTitle>
            <p className="text-sm text-stone-600">
              enquiries@badradventures.co.uk · {data ? `${data.unread} unread` : "—"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCcw className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </div>
          )}
          {!data && !error && (
            <div className="text-sm text-stone-500">Loading…</div>
          )}
          {data && data.messages.length === 0 && (
            <div className="text-sm text-stone-500">No messages.</div>
          )}
          {data && data.messages.length > 0 && (
            <div className="divide-y divide-stone-100">
              {data.messages.map((m) => (
                <button
                  key={m.uid}
                  onClick={() => openMessage(m)}
                  className={`flex w-full items-start gap-3 px-2 py-3 text-left transition-colors hover:bg-stone-50 ${
                    !m.seen ? "bg-amber-50/40" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`truncate text-sm ${!m.seen ? "font-semibold" : "font-medium"} text-stone-900`}>
                        {m.fromName || m.from}
                      </span>
                      {!m.seen && (
                        <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">new</Badge>
                      )}
                      {m.flagged && (
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">flagged</Badge>
                      )}
                      {m.hasAttachments && (
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">📎</Badge>
                      )}
                    </div>
                    <div className={`truncate text-sm ${!m.seen ? "font-medium text-stone-900" : "text-stone-700"}`}>
                      {m.subject || "(no subject)"}
                    </div>
                    <div className="truncate text-xs text-stone-500">{m.preview}</div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-stone-500">
                    {new Date(m.date).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {open && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate text-stone-900">{open.row.subject || "(no subject)"}</CardTitle>
              <p className="text-sm text-stone-600">
                From <span className="font-medium">{open.row.fromName || open.row.from}</span> &lt;{open.row.from}&gt;
              </p>
              <p className="text-xs text-stone-500">
                To {open.row.to} · {new Date(open.row.date).toLocaleString("en-GB")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => markSeen(open.row)}
                disabled={marking}
              >
                <Eye className="mr-1 h-3.5 w-3.5" />
                {open.row.seen ? "Mark unread" : "Mark read"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setOpen(null)}>
                <X className="mr-1 h-3.5 w-3.5" /> Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {open.html ? (
              <iframe
                title="message"
                srcDoc={open.html}
                className="h-[500px] w-full rounded-md border border-stone-200 bg-white"
              />
            ) : (
              <pre className="whitespace-pre-wrap rounded-md bg-stone-50 p-3 text-sm text-stone-800">
                {open.body || "(empty)"}
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
