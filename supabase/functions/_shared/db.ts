// Database operations for edge functions.
// Ported subset of the helpers from backend-lib/db.ts.
// Uses the service role client.

import { supabaseAdmin } from "./supabase-client.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HikeRow = {
  id: string;
  title: string;
  location: string;
  region: string;
  date: string;
  duration: string;
  difficulty: string;
  spots_total: number;
  spots_left: number;
  price_pence: number;
  summary: string;
  description: string;
  image: string;
  hero: string;
  tags: string[];
  guide: string;
  stripe_product_id?: string | null;
};

export type EquipmentRow = {
  id: string;
  type: string;
  name: string;
  summary: string;
  description: string;
  image: string;
  location: string;
  price_pence: number;
  unit_label: string;
  capacity: number;
  total_units: number;
  available_units: number;
  features: string[];
  created_at: string;
  stripe_product_id?: string | null;
};

// ---------------------------------------------------------------------------
// Equipment patch/update
// ---------------------------------------------------------------------------

export type EquipmentPatch = {
  type?: string;
  name?: string;
  summary?: string;
  description?: string;
  image?: string;
  location?: string;
  pricePerNightGbp?: number;
  capacity?: number;
  totalUnits?: number;
  availableUnits?: number;
  unitLabel?: string;
  features?: string[];
};

export async function patchEquipment(
  id: string,
  patch: EquipmentPatch,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const existing = await loadEquipmentById(id);
    if (!existing) return { ok: false, error: "Equipment not found." };
    const row: Record<string, unknown> = {};
    if (patch.type !== undefined) row.type = patch.type;
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.summary !== undefined) row.summary = patch.summary;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.image !== undefined) row.image = patch.image;
    if (patch.location !== undefined) row.location = patch.location;
    if (patch.capacity !== undefined) row.capacity = patch.capacity;
    if (patch.totalUnits !== undefined) row.total_units = patch.totalUnits;
    if (patch.availableUnits !== undefined) {
      const total =
        patch.totalUnits !== undefined ? patch.totalUnits : existing.total_units;
      row.available_units = Math.max(0, Math.min(patch.availableUnits, total));
    }
    if (patch.pricePerNightGbp !== undefined) {
      row.price_pence = Math.round(patch.pricePerNightGbp * 100);
    }
    if (patch.unitLabel !== undefined) row.unit_label = patch.unitLabel;
    if (patch.features !== undefined) row.features = patch.features;
    if (Object.keys(row).length === 0) return { ok: true };
    const { error } = await supabaseAdmin().from("equipment").update(row).eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Hikes
// ---------------------------------------------------------------------------

export async function listAllHikes(): Promise<HikeRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("hikes")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normaliseHike);
}

export async function loadHikeById(id: string): Promise<HikeRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("hikes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normaliseHike(data) : null;
}

export async function loadHikeByIdFull(
  id: string,
): Promise<HikeRow | null> {
  return loadHikeById(id);
}

export async function insertHike(input: HikeRow): Promise<void> {
  const { error } = await supabaseAdmin().from("hikes").insert({
    id: input.id,
    title: input.title,
    location: input.location,
    region: input.region,
    date: input.date,
    duration: input.duration,
    difficulty: input.difficulty,
    spots_total: input.spots_total,
    spots_left: input.spots_left,
    price_pence: input.price_pence,
    summary: input.summary,
    description: input.description,
    image: input.image,
    hero: input.hero || input.image,
    tags: input.tags ?? [],
    guide: input.guide,
  });
  if (error) throw new Error(error.message);
}

export type HikePatch = {
  title?: string;
  location?: string;
  region?: string;
  date?: string;
  duration?: string;
  difficulty?: string;
  spotsTotal?: number;
  priceGbp?: number;
  summary?: string;
  description?: string;
  image?: string;
  hero?: string;
  guide?: string;
  tags?: string[];
};

export async function patchHike(
  id: string,
  patch: {
    title?: string;
    location?: string;
    region?: string;
    date?: string;
    duration?: string;
    difficulty?: string;
    spotsTotal?: number;
    priceGbp?: number;
    summary?: string;
    description?: string;
    image?: string;
    hero?: string;
    guide?: string;
    tags?: string[];
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const existing = await loadHikeById(id);
    if (!existing) return { ok: false, error: "Hike not found." };
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.location !== undefined) row.location = patch.location;
    if (patch.region !== undefined) row.region = patch.region;
    if (patch.date !== undefined) row.date = patch.date;
    if (patch.duration !== undefined) row.duration = patch.duration;
    if (patch.difficulty !== undefined) row.difficulty = patch.difficulty;
    if (patch.summary !== undefined) row.summary = patch.summary;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.image !== undefined) row.image = patch.image;
    if (patch.hero !== undefined) row.hero = patch.hero;
    if (patch.guide !== undefined) row.guide = patch.guide;
    if (patch.tags !== undefined) row.tags = patch.tags;
    if (patch.spotsTotal !== undefined) {
      const taken = existing.spots_total - existing.spots_left;
      const newSpots = Math.max(0, patch.spotsTotal);
      row.spots_total = newSpots;
      row.spots_left = Math.max(0, newSpots - taken);
    }
    if (patch.priceGbp !== undefined) {
      row.price_pence = Math.round(patch.priceGbp * 100);
    }
    if (Object.keys(row).length === 0) return { ok: true };
    const { error } = await supabaseAdmin().from("hikes").update(row).eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteHike(id: string): Promise<boolean> {
  const { error, count } = await supabaseAdmin()
    .from("hikes")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function countHikeBookings(hikeId: string): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("hike_id", hikeId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

/** Persist a Stripe product id onto a hike row. Used after syncHikeToStripe. */
export async function setHikeStripeProductId(
  id: string,
  productId: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("hikes")
    .update({ stripe_product_id: productId })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Persist a Stripe product id onto an equipment row. Used after syncEquipmentToStripe. */
export async function setEquipmentStripeProductId(
  id: string,
  productId: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("equipment")
    .update({ stripe_product_id: productId })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listAllEquipment(type?: string): Promise<EquipmentRow[]> {
  let q = supabaseAdmin()
    .from("equipment")
    .select("*")
    .order("type", { ascending: true })
    .order("price_pence", { ascending: true });
  if (type) q = q.eq("type", type);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(normaliseEquipment);
}

export async function loadEquipmentById(id: string): Promise<EquipmentRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("equipment")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normaliseEquipment(data) : null;
}

export async function upsertEquipment(input: {
  id: string;
  type: string;
  name: string;
  summary: string;
  description: string;
  image: string;
  location: string;
  pricePerNightGbp: number;
  capacity: number;
  totalUnits: number;
  availableUnits: number;
  unitLabel: string;
  features: string[];
}): Promise<void> {
  const row = {
    id: input.id,
    type: input.type,
    name: input.name,
    summary: input.summary,
    description: input.description,
    image: input.image,
    location: input.location,
    price_pence: Math.round(input.pricePerNightGbp * 100),
    unit_label: input.unitLabel,
    capacity: input.capacity,
    total_units: input.totalUnits,
    available_units: input.availableUnits,
    features: input.features,
  };
  const { error } = await supabaseAdmin()
    .from("equipment")
    .upsert(row, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function deleteEquipment(id: string): Promise<boolean> {
  const { error, count } = await supabaseAdmin()
    .from("equipment")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Hike bookings
// ---------------------------------------------------------------------------

export async function loadHikeBookingById(id: string): Promise<{
  id: string;
  hike_id: string;
  party_size: number;
  status: string;
  payment_status: string;
  stripe_session_id: string | null;
} | null> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const r = data as Record<string, unknown>;
  return {
    id: r.id as string,
    hike_id: r.hike_id as string,
    party_size: r.party_size as number,
    status: r.status as string,
    payment_status: r.payment_status as string,
    stripe_session_id: (r.stripe_session_id as string | null) ?? null,
  };
}

export async function updateHikeBooking(
  id: string,
  patch: { status?: string; payment_status?: string },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.payment_status !== undefined) row.payment_status = patch.payment_status;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabaseAdmin()
    .from("bookings")
    .update(row)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function decrementHikeSpots(
  hikeId: string,
  partySize: number,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabaseAdmin().rpc(
    "decrement_hike_spots",
    { hike_id: hikeId, delta: partySize },
  );
  if (error) return { ok: false, error: error.message };
  if (data == null) return { ok: false, error: "Not enough spots remaining." };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Equipment bookings
// ---------------------------------------------------------------------------

export async function loadEquipmentBookingById(id: string): Promise<{
  id: string;
  status: string;
  payment_status: string;
  stripe_session_id: string | null;
} | null> {
  const { data, error } = await supabaseAdmin()
    .from("equipment_bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const r = data as Record<string, unknown>;
  return {
    id: r.id as string,
    status: r.status as string,
    payment_status: r.payment_status as string,
    stripe_session_id: (r.stripe_session_id as string | null) ?? null,
  };
}

export async function updateEquipmentBooking(
  id: string,
  patch: { status?: string; payment_status?: string },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.payment_status !== undefined) row.payment_status = patch.payment_status;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabaseAdmin()
    .from("equipment_bookings")
    .update(row)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Telegram allowlist
// ---------------------------------------------------------------------------

export async function countTelegramAllowlist(): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("telegram_allowlist")
    .select("chat_id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function isTelegramChatAllowed(chatId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("telegram_allowlist")
    .select("chat_id")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (error) return false;
  return data !== null;
}

export async function insertTelegramAllowlist(
  chatId: string,
  label?: string,
  addedBy?: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("telegram_allowlist")
    .insert({
      chat_id: chatId,
      label: label ?? null,
      added_at: Date.now(),
      added_by: addedBy ?? "edge-function",
    });
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

export async function deleteContactMessagesOlderThan(
  cutoffMs: number,
): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("contact_messages")
    .delete({ count: "exact" })
    .lt("created_at", new Date(cutoffMs).toISOString());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function listRecentProfiles(sinceMs: number): Promise<
  { id: string; email: string; name: string; created_at: string }[]
> {
  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("id, email, name, created_at")
    .gt("created_at", new Date(sinceMs).toISOString())
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => {
    const d = r as Record<string, unknown>;
    return {
      id: d.id as string,
      email: d.email as string,
      name: d.name as string,
      created_at: d.created_at as string,
    };
  });
}

// ---------------------------------------------------------------------------
// Normalisers
// ---------------------------------------------------------------------------

function normaliseHike(r: Record<string, unknown>): HikeRow {
  return {
    id: r.id as string,
    title: r.title as string,
    location: r.location as string,
    region: r.region as string,
    date: r.date as string,
    duration: r.duration as string,
    difficulty: r.difficulty as string,
    spots_total: r.spots_total as number,
    spots_left: r.spots_left as number,
    price_pence: r.price_pence as number,
    summary: r.summary as string,
    description: r.description as string,
    image: r.image as string,
    hero: (r.hero as string) ?? (r.image as string),
    tags: (r.tags as string[]) ?? [],
    guide: r.guide as string,
    stripe_product_id: (r.stripe_product_id as string | null) ?? null,
  };
}

function normaliseEquipment(r: Record<string, unknown>): EquipmentRow {
  return {
    id: r.id as string,
    type: r.type as string,
    name: r.name as string,
    summary: (r.summary as string) ?? "",
    description: (r.description as string) ?? "",
    image: r.image as string,
    location: r.location as string,
    price_pence: r.price_pence as number,
    unit_label: r.unit_label as string,
    capacity: r.capacity as number,
    total_units: r.total_units as number,
    available_units: r.available_units as number,
    features: (r.features as string[]) ?? [],
    created_at: r.created_at as string,
    stripe_product_id: (r.stripe_product_id as string | null) ?? null,
  };
}
