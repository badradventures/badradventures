// Supabase data layer for the backend.
//
// Replaces the old `bun:sqlite` access. Every helper in this module
// returns plain JS objects shaped to match what the API responses send
// out (camelCase fields where the client expects them, snake_case where
// it's an internal type, dates as ISO strings or numbers).
//
// All functions are async; the callers were updated to await them.
// Errors are surfaced as thrown Error instances; route handlers catch
// and convert to 500s via the central handleError() helper.

import { supabaseAdmin } from "./supabase";

// ---------------------------------------------------------------------------
// Hikes
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
  stripe_price_id?: string | null;
};

type HikeDb = {
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
  hero: string | null;
  tags: string[] | null;
  guide: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
};

function rowToHike(r: HikeDb): HikeRow {
  return {
    id: r.id,
    title: r.title,
    location: r.location,
    region: r.region,
    date: r.date,
    duration: r.duration,
    difficulty: r.difficulty,
    spots_total: r.spots_total,
    spots_left: r.spots_left,
    price_pence: r.price_pence,
    summary: r.summary,
    description: r.description,
    image: r.image,
    hero: r.hero ?? r.image,
    tags: r.tags ?? [],
    guide: r.guide,
    stripe_product_id: r.stripe_product_id,
    stripe_price_id: r.stripe_price_id,
  };
}

export async function listAllHikes(): Promise<HikeRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("hikes")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => rowToHike(r as unknown as HikeDb));
}

export async function loadHikeById(id: string): Promise<HikeRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("hikes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToHike(data as unknown as HikeDb) : null;
}

// Same as loadHikeById but also returns the raw row so the Telegram bot can
// still pull numeric fields without a second round-trip.
export async function loadHikeByIdFull(
  id: string,
): Promise<(HikeRow & { tags: string[]; spotsTotal: number; spotsLeft: number; pricePence: number }) | null> {
  const hike = await loadHikeById(id);
  if (!hike) return null;
  return { ...hike, tags: hike.tags, spotsTotal: hike.spots_total, spotsLeft: hike.spots_left, pricePence: hike.price_pence };
}

export async function countHikeBookings(id: string): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("hike_id", id);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export type HikeInput = Omit<HikeRow, "spots_left"> & {
  spotsLeft?: number;
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
};

export async function insertHike(input: HikeInput): Promise<void> {
  const row = {
    id: input.id,
    title: input.title,
    location: input.location,
    region: input.region,
    date: input.date,
    duration: input.duration,
    difficulty: input.difficulty,
    spots_total: input.spots_total,
    spots_left: input.spotsLeft ?? input.spots_total,
    price_pence: input.price_pence,
    summary: input.summary,
    description: input.description,
    image: input.image,
    hero: input.hero,
    tags: input.tags,
    guide: input.guide,
    stripe_product_id: input.stripe_product_id ?? null,
    stripe_price_id: input.stripe_price_id ?? null,
  };
  const { error } = await supabaseAdmin().from("hikes").insert(row);
  if (error) throw new Error(error.message);
}

export async function updateHike(
  id: string,
  patch: Partial<HikeRow>,
): Promise<void> {
  // Map camelCase from callers to snake_case.
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
  if (patch.spots_total !== undefined) row.spots_total = patch.spots_total;
  if (patch.spots_left !== undefined) row.spots_left = patch.spots_left;
  if (patch.price_pence !== undefined) row.price_pence = patch.price_pence;
  if (patch.stripe_product_id !== undefined) row.stripe_product_id = patch.stripe_product_id;
  if (patch.stripe_price_id !== undefined) row.stripe_price_id = patch.stripe_price_id;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabaseAdmin().from("hikes").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

// Telegram bot uses a different (camelCase) patch shape and returns a
// success boolean instead of throwing.
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
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
};

export async function patchHike(
  id: string,
  patch: HikePatch,
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
      const newLeft = Math.max(0, newSpots - taken);
      row.spots_total = newSpots;
      row.spots_left = newLeft;
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

/** Update stripe fields on an equipment row. */
export async function updateEquipment(
  id: string,
  patch: { stripe_product_id?: string | null; stripe_price_id?: string | null },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.stripe_product_id !== undefined) row.stripe_product_id = patch.stripe_product_id;
  if (patch.stripe_price_id !== undefined) row.stripe_price_id = patch.stripe_price_id;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabaseAdmin().from("equipment").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

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
  stripe_price_id?: string | null;
};

type EquipmentDb = {
  id: string;
  type: string;
  name: string;
  summary: string | null;
  description: string | null;
  image: string;
  location: string;
  price_pence: number;
  unit_label: string;
  capacity: number;
  total_units: number;
  available_units: number;
  features: string[] | null;
  created_at: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
};

function rowToEquipment(r: EquipmentDb): EquipmentRow {
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    summary: r.summary ?? "",
    description: r.description ?? "",
    image: r.image,
    location: r.location,
    price_pence: r.price_pence,
    unit_label: r.unit_label,
    capacity: r.capacity,
    total_units: r.total_units,
    available_units: r.available_units,
    features: r.features ?? [],
    created_at: r.created_at,
    stripe_product_id: r.stripe_product_id,
    stripe_price_id: r.stripe_price_id,
  };
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
  return (data ?? []).map((r) => rowToEquipment(r as unknown as EquipmentDb));
}

export async function loadEquipmentById(id: string): Promise<EquipmentRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("equipment")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToEquipment(data as unknown as EquipmentDb) : null;
}

export type EquipmentInput = {
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
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
};

// "upsert" because admin POST /api/admin/equipment creates-or-replaces.
export async function upsertEquipment(input: EquipmentInput): Promise<void> {
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
    stripe_product_id: input.stripe_product_id ?? null,
    stripe_price_id: input.stripe_price_id ?? null,
  };
  const { error } = await supabaseAdmin()
    .from("equipment")
    .upsert(row, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

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

export type BookingRow = {
  id: string;
  userId: string;
  hikeId: string;
  partySize: number;
  status: string;
  paymentStatus: string;
  totalPence: number;
  stripeSessionId: string | null;
  createdAt: string;
};

export async function insertHikeBooking(input: {
  id?: string;
  userId: string;
  hikeId: string;
  partySize: number;
  status: string;
  paymentStatus: string;
  totalPence: number;
  stripeSessionId: string | null;
}): Promise<BookingRow> {
  const row = {
    id: input.id ?? crypto.randomUUID(),
    user_id: input.userId,
    hike_id: input.hikeId,
    party_size: input.partySize,
    status: input.status,
    payment_status: input.paymentStatus,
    total_pence: input.totalPence,
    stripe_session_id: input.stripeSessionId,
  };
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .insert(row)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as BookingRow;
}

export async function loadHikeBookingById(id: string): Promise<BookingRow | null> {
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
    userId: r.user_id as string,
    hikeId: r.hike_id as string,
    partySize: r.party_size as number,
    status: r.status as string,
    paymentStatus: r.payment_status as string,
    totalPence: (r.total_pence as number | null) ?? 0,
    stripeSessionId: (r.stripe_session_id as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

export async function updateHikeBooking(
  id: string,
  patch: {
    status?: string;
    paymentStatus?: string;
    stripeSessionId?: string | null;
  },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.paymentStatus !== undefined) row.paymentStatus = patch.paymentStatus;
  if (patch.stripeSessionId !== undefined) row.stripeSessionId = patch.stripeSessionId;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabaseAdmin()
    .from("bookings")
    .update(row)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listHikeBookingsForUser(userId: string): Promise<BookingRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as string,
      userId: row.userId as string,
      hikeId: row.hike_id as string,
      partySize: row.party_size as number,
      status: row.status as string,
      paymentStatus: row.paymentStatus as string,
      totalPence: (row.totalPence as number | null) ?? 0,
      stripeSessionId: (row.stripeSessionId as string | null) ?? null,
      createdAt: row.created_at as string,
    };
  });
}

// Joined view for the account page: bookings with hike title/date/location.
export async function listHikeBookingsForUserWithHike(
  userId: string,
): Promise<
  (BookingRow & { hike_title: string | null; hike_date: string | null; hike_location: string | null })[]
> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("*, hikes: hike_id (title, date, location)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    const hikes = row.hikes as { title: string; date: string; location: string } | null;
    return {
      id: row.id as string,
      userId: row.user_id as string,
      hikeId: row.hike_id as string,
      partySize: row.party_size as number,
      status: row.status as string,
      paymentStatus: row.payment_status as string,
      totalPence: (row.total_pence as number | null) ?? 0,
      stripeSessionId: (row.stripe_session_id as string | null) ?? null,
      createdAt: row.created_at as string,
      hike_title: hikes?.title ?? null,
      hike_date: hikes?.date ?? null,
      hike_location: hikes?.location ?? null,
    };
  });
}

export async function deleteHikeBookingsForUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("bookings")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function decrementHikeSpots(
  hikeId: string,
  partySize: number,
): Promise<{ ok: boolean; error?: string }> {
  // The decrement_hike_spots RPC holds a row-level FOR UPDATE lock for the
  // duration of the check-and-decrement, so two concurrent bookings can't
  // both see the same "14 spots left" and both succeed.
  // Signature: (hike_id text, delta int) returns int — the new spots_left,
  // or NULL if the hike is missing or the decrement would go below zero.
  const { data, error } = await supabaseAdmin().rpc(
    "decrement_hike_spots",
    { hike_id: hikeId, delta: partySize },
  );
  if (error) return { ok: false, error: error.message };
  if (data == null) {
    return { ok: false, error: "Not enough spots remaining." };
  }
  return { ok: true };
}

export async function incrementHikeSpots(
  hikeId: string,
  partySize: number,
): Promise<void> {
  // Atomic counterpart: capped at spots_total in SQL. Returns the new
  // spots_left; we ignore it because the application logic already
  // ensures we never exceed spots_total.
  const { error } = await supabaseAdmin().rpc(
    "increment_hike_spots",
    { hike_id: hikeId, delta: partySize },
  );
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Equipment bookings
// ---------------------------------------------------------------------------

export type EquipmentBookingRow = {
  id: string;
  userId: string;
  equipmentId: string;
  startDate: string;
  endDate: string;
  nights: number;
  units: number;
  guests: number;
  totalPence: number;
  status: string;
  paymentStatus: string;
  stripeSessionId: string | null;
  notes: string | null;
  createdAt: string;
};

export async function insertEquipmentBooking(input: {
  id?: string;
  userId: string;
  equipmentId: string;
  startDate: string;
  endDate: string;
  nights: number;
  units: number;
  guests: number;
  status: string;
  paymentStatus: string;
  totalPence: number;
  stripeSessionId: string | null;
  notes: string | null;
}): Promise<EquipmentBookingRow> {
  const row = {
    id: input.id ?? crypto.randomUUID(),
    user_id: input.userId,
    equipment_id: input.equipmentId,
    start_date: input.startDate,
    end_date: input.endDate,
    nights: input.nights,
    units: input.units,
    guests: input.guests,
    status: input.status,
    payment_status: input.paymentStatus,
    total_pence: input.totalPence,
    stripe_session_id: input.stripeSessionId,
    notes: input.notes,
  };
  const { data, error } = await supabaseAdmin()
    .from("equipment_bookings")
    .insert(row)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as EquipmentBookingRow;
}

export async function loadEquipmentBookingById(
  id: string,
): Promise<EquipmentBookingRow | null> {
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
    userId: r.user_id as string,
    equipmentId: r.equipment_id as string,
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    nights: r.nights as number,
    units: r.units as number,
    guests: r.guests as number,
    totalPence: (r.total_pence as number | null) ?? 0,
    status: r.status as string,
    paymentStatus: r.payment_status as string,
    stripeSessionId: (r.stripe_session_id as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

export async function updateEquipmentBooking(
  id: string,
  patch: {
    status?: string;
    paymentStatus?: string;
    stripeSessionId?: string | null;
  },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.paymentStatus !== undefined) row.paymentStatus = patch.paymentStatus;
  if (patch.stripeSessionId !== undefined) row.stripeSessionId = patch.stripeSessionId;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabaseAdmin()
    .from("equipment_bookings")
    .update(row)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listEquipmentBookingsForUser(
  userId: string,
): Promise<EquipmentBookingRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("equipment_bookings")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as string,
      userId: row.userId as string,
      equipmentId: row.equipmentId as string,
      startDate: row.startDate as string,
      endDate: row.endDate as string,
      nights: row.nights as number,
      units: row.units as number,
      guests: row.guests as number,
      totalPence: (row.totalPence as number | null) ?? 0,
      status: row.status as string,
      paymentStatus: row.paymentStatus as string,
      stripeSessionId: (row.stripeSessionId as string | null) ?? null,
      notes: (row.notes as string | null) ?? null,
      createdAt: row.created_at as string,
    };
  });
}

export async function listAllEquipmentBookingsWithJoins(): Promise<
  (EquipmentBookingRow & {
    name: string | null;
    email: string | null;
    equipment_name: string | null;
    equipment_type: string | null;
    equipment_image: string | null;
    equipment_location: string | null;
  })[]
> {
  // RLS allows admins to see all rows; the service role bypasses RLS anyway.
  const { data, error } = await supabaseAdmin()
    .from("equipment_bookings")
    .select(
      "*, profiles: user_id (name, email), equipment: equipment_id (name, type, image, location)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  type Joined = EquipmentBookingRow & {
    profiles: { name: string; email: string } | null;
    equipment: { name: string; type: string; image: string; location: string } | null;
  };
  return (data ?? []).map((r) => {
    const j = r as unknown as Joined;
    return {
      ...j,
      name: j.profiles?.name ?? null,
      email: j.profiles?.email ?? null,
      equipment_name: j.equipment?.name ?? null,
      equipment_type: j.equipment?.type ?? null,
      equipment_image: j.equipment?.image ?? null,
      equipment_location: j.equipment?.location ?? null,
    };
  });
}

export async function listEquipmentBookingsForUserWithJoins(
  userId: string,
): Promise<
  (EquipmentBookingRow & {
    equipment_name: string | null;
    equipment_type: string | null;
    equipment_image: string | null;
    equipment_location: string | null;
  })[]
> {
  const { data, error } = await supabaseAdmin()
    .from("equipment_bookings")
    .select("*, equipment: equipment_id (name, type, image, location)")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });
  if (error) throw new Error(error.message);
  type Joined = EquipmentBookingRow & {
    equipment: { name: string; type: string; image: string; location: string } | null;
  };
  return (data ?? []).map((r) => {
    const j = r as unknown as Joined;
    return {
      ...j,
      equipment_name: j.equipment?.name ?? null,
      equipment_type: j.equipment?.type ?? null,
      equipment_image: j.equipment?.image ?? null,
      equipment_location: j.equipment?.location ?? null,
    };
  });
}

export async function deleteEquipmentBookingsForUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("equipment_bookings")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

export async function contactMessageInsert(input: {
  name: string;
  email: string;
  subject: string | null;
  message: string;
  userId: string | null;
  consentedAt?: number;
  policyVersion?: string;
}): Promise<void> {
  // Some older contact_messages tables don't have consented_at or
  // policy_version columns. Try the full row first, then fall back to
  // a minimal insert that omits the optional columns.
  const fullRow = {
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    user_id: input.userId,
    consented_at: new Date(input.consentedAt ?? Date.now()).toISOString(),
    policy_version: input.policyVersion ?? "2026-06",
  };
  const { error } = await supabaseAdmin().from("contact_messages").insert(fullRow);
  if (error && /consented_at|policy_version|user_id|column/i.test(error.message)) {
    const fallback: Record<string, unknown> = {
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
    };
    if (input.userId !== null) fallback.user_id = input.userId;
    const { error: err2 } = await supabaseAdmin().from("contact_messages").insert(fallback);
    if (err2) throw new Error(err2.message);
    return;
  }
  if (error) throw new Error(error.message);
}

export async function listRecentContactMessages(
  limit = 50,
): Promise<
  {
    id: string;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    created_at: string;
  }[]
> {
  const { data, error } = await supabaseAdmin()
    .from("contact_messages")
    .select("id, name, email, subject, message, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as {
    id: string;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    created_at: string;
  }[];
}

export async function deleteContactMessagesForUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("contact_messages")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteContactMessagesOlderThan(cutoffMs: number): Promise<number> {
  const cutoff = new Date(cutoffMs).toISOString();
  const { error, count } = await supabaseAdmin()
    .from("contact_messages")
    .delete({ count: "exact" })
    .lt("created_at", cutoff);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Profiles (read + admin touch)
// ---------------------------------------------------------------------------

export type ProfileRow = {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
};

type ProfileDb = {
  id: string;
  email: string | null;
  name: string | null;
  is_admin: boolean | null;
  created_at: string | null;
};

function rowToProfile(r: ProfileDb): ProfileRow {
  return {
    id: r.id,
    email: r.email ?? "",
    name: r.name ?? "",
    is_admin: Boolean(r.is_admin),
    created_at: r.created_at ?? new Date(0).toISOString(),
  };
}

export async function loadProfileById(id: string): Promise<ProfileRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("id, email, name, is_admin, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToProfile(data as unknown as ProfileDb) : null;
}

export async function loadProfileByEmail(email: string): Promise<ProfileRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("id, email, name, is_admin, created_at")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToProfile(data as unknown as ProfileDb) : null;
}

export async function listAllProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("id, email, name, is_admin, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => rowToProfile(r as unknown as ProfileDb));
}

export async function touchProfileAdmin(
  id: string,
  isAdmin: boolean,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("profiles")
    .update({ is_admin: isAdmin })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Admin overview / dashboard
// ---------------------------------------------------------------------------

export async function adminCounts(): Promise<{
  hikes: number;
  bookings: number;
  users: number;
  messages: number;
  pending: number;
  paid: number;
}> {
  const [hikes, bookings, users, messages, pending, paid] = await Promise.all([
    supabaseAdmin().from("hikes").select("id", { count: "exact", head: true }),
    supabaseAdmin().from("bookings").select("id", { count: "exact", head: true }),
    supabaseAdmin().from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin().from("contact_messages").select("id", { count: "exact", head: true }),
    supabaseAdmin()
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabaseAdmin()
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "paid"),
  ]);
  return {
    hikes: hikes.count ?? 0,
    bookings: bookings.count ?? 0,
    users: users.count ?? 0,
    messages: messages.count ?? 0,
    pending: pending.count ?? 0,
    paid: paid.count ?? 0,
  };
}

export async function listRecentBookings(limit = 25): Promise<
  (BookingRow & {
    user_name: string | null;
    user_email: string | null;
    hike_title: string | null;
  })[]
> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select(
      "*, profiles: user_id (name, email), hikes: hike_id (title)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  type Joined = BookingRow & {
    profiles: { name: string; email: string } | null;
    hikes: { title: string } | null;
  };
  return (data ?? []).map((r) => {
    const j = r as unknown as Joined;
    return {
      ...j,
      user_name: j.profiles?.name ?? null,
      user_email: j.profiles?.email ?? null,
      hike_title: j.hikes?.title ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Telegram allow-list
// ---------------------------------------------------------------------------

export type TelegramAllowlistRow = {
  chat_id: string;
  label: string | null;
  added_at: string;
  added_by: string | null;
};

export async function listTelegramAllowlist(): Promise<TelegramAllowlistRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("telegram_allowlist")
    .select("chat_id, label, added_at, added_by")
    .order("added_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as TelegramAllowlistRow[];
}

export async function isTelegramChatAllowed(chatId: string): Promise<boolean> {
  const { count, error } = await supabaseAdmin()
    .from("telegram_allowlist")
    .select("chat_id", { count: "exact", head: true })
    .eq("chat_id", chatId);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function addTelegramAllowlistEntry(input: {
  chatId: string;
  label: string | null;
  addedBy: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin().from("telegram_allowlist").insert({
    chat_id: input.chatId,
    label: input.label,
    added_by: input.addedBy,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function removeTelegramAllowlistEntry(
  chatId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error, count } = await supabaseAdmin()
    .from("telegram_allowlist")
    .delete({ count: "exact" })
    .eq("chat_id", chatId);
  if (error) return { ok: false, error: error.message };
  if ((count ?? 0) === 0) return { ok: false, error: "Not found" };
  return { ok: true };
}

export async function countTelegramAllowlist(): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("telegram_allowlist")
    .select("chat_id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Availability helpers
// ---------------------------------------------------------------------------

export async function bookedUnitsForRange(
  equipmentId: string,
  start: string,
  end: string,
): Promise<number> {
  const { data, error } = await supabaseAdmin()
    .from("equipment_bookings")
    .select("units")
    .eq("equipment_id", equipmentId)
    .lt("start_date", end)
    .gt("end_date", start)
    .in("status", ["pending", "confirmed", "reserved"]);
  if (error) throw new Error(error.message);
  return (data ?? []).reduce(
    (sum: number, r: { units: number }) => sum + (r.units ?? 0),
    0,
  );
}

export async function bookedUnitsMap(
  start: string,
  end: string,
): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin()
    .from("equipment_bookings")
    .select("equipment_id, units")
    .lt("start_date", end)
    .gt("end_date", start)
    .in("status", ["pending", "confirmed", "reserved"]);
  if (error) throw new Error(error.message);
  const map: Record<string, number> = {};
  for (const r of data ?? []) {
    map[r.equipment_id] = (map[r.equipment_id] ?? 0) + (r.units as number);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Presentation helpers (shape transformations for API responses).
//
// These used to live next to the SQLite queries; they don't talk to the DB
// at all, just normalise a row into the camelCase shape the frontend
// expects. Kept here so all data plumbing lives in one place.
// ---------------------------------------------------------------------------

export type EquipmentReservationRow = {
  id: string;
  userId: string;
  user?: { name: string; email: string };
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
  units: number;
  totalGbp: number;
  totalPence: number;
  status: string;
  paymentStatus: string;
  stripeSessionId: string | null;
  notes: string | null;
  createdAt: number;
  created_at: string;
};

export function presentHike(row: HikeRow) {
  return {
    ...row,
    spotsTotal: row.spots_total,
    spotsLeft: row.spots_left,
    pricePence: row.price_pence,
    priceGbp: Math.round(row.price_pence / 100),
    heroBullets: deriveHeroBullets(row),
  };
}

function deriveHeroBullets(row: HikeRow): string[] {
  const bullets: string[] = [];
  if (row.location) bullets.push(`Start: ${row.location}`);
  if (row.duration) bullets.push(`Duration: ${row.duration}`);
  if (row.difficulty) bullets.push(`Difficulty: ${row.difficulty}`);
  if (row.guide) bullets.push(`Lead guide: ${row.guide}`);
  if (row.price_pence === 0) bullets.push("Free to attend");
  return bullets;
}

export function presentEquipment(row: EquipmentRow) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    summary: row.summary,
    description: row.description,
    image: row.image,
    location: row.location,
    capacity: row.capacity,
    pricePerNightPence: row.price_pence,
    pricePerNightGbp: Math.round(row.price_pence / 100),
    unitLabel: row.unit_label,
    totalUnits: row.total_units,
    availableUnits: row.available_units,
    features: row.features,
    active: row.available_units > 0,
    createdAt: row.created_at,
  };
}

export function presentEquipmentReservation(
  row: EquipmentBookingRow & {
    user_name?: string | null;
    user_email?: string | null;
    equipment_name?: string | null;
    equipment_type?: string | null;
    equipment_image?: string | null;
    equipment_location?: string | null;
  },
): EquipmentReservationRow {
  return {
    id: row.id,
    userId: row.userId,
    user: {
      name: row.user_name ?? "",
      email: row.user_email ?? "",
    },
    equipmentId: row.equipmentId,
    equipment: {
      name: row.equipment_name ?? "",
      type: row.equipment_type ?? "",
      image: row.equipment_image ?? "",
      location: row.equipment_location ?? "",
    },
    startDate: row.startDate,
    endDate: row.endDate,
    nights: row.nights,
    partySize: row.guests,
    units: row.units,
    totalGbp: Math.round(row.totalPence / 100),
    totalPence: row.totalPence,
    status: row.status,
    paymentStatus: row.paymentStatus,
    stripeSessionId: row.stripeSessionId,
    notes: row.notes,
    createdAt: new Date(row.createdAt).getTime(),
    created_at: row.createdAt,
  };
}

export function presentUser(
  row: Partial<ProfileRow> & {
    id: string;
    email: string;
    name?: string | null;
    is_admin?: boolean | number | null;
    created_at?: string | number | null;
  },
) {
  const name = row.name ?? "";
  const isAdmin = Boolean(row.is_admin);
  const created = row.created_at ? new Date(row.created_at as any).getTime() : Date.now();
  return {
    id: row.id,
    email: row.email,
    name,
    isAdmin,
    is_admin: isAdmin ? 1 : 0,
    createdAt: created,
  };
}

export function bookingToJson(row: BookingRow) {
  return {
    id: row.id,
    userId: row.userId,
    hikeId: row.hikeId,
    partySize: row.partySize,
    status: row.status,
    paymentStatus: row.paymentStatus,
    totalPence: row.totalPence,
    stripeSessionId: row.stripeSessionId,
    createdAt: new Date(row.createdAt).getTime(),
  };
}

// ---------------------------------------------------------------------------
// Convenience aliases and a few small extras the API routes still call.
// ---------------------------------------------------------------------------

/** Alias matching the old "create or replace" semantics in the admin POST. */
export async function upsertHike(input: HikeInput): Promise<void> {
  // The admin POST endpoint asserts that the id does not already exist,
  // so upsert == insert here. Re-using insertHike keeps the SQL path simple.
  await insertHike(input);
}

/** Public contact messages (no joins). */
export async function listAllContactMessages(limit = 50): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    user_id: string | null;
    consented_at: number;
    created_at: number;
  }>
> {
  const { data, error } = await supabaseAdmin()
    .from("contact_messages")
    .select(
      "id, name, email, subject, message, user_id, consented_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    subject: (r.subject as string | null) ?? null,
    message: r.message as string,
    user_id: (r.user_id as string | null) ?? null,
    consented_at: new Date(r.consented_at as string).getTime(),
    created_at: new Date(r.created_at as string).getTime(),
  }));
}

/** Equipment type breakdown for the admin dashboard. */
export async function equipmentTypeCounts(): Promise<
  Record<string, number>
> {
  const { data, error } = await supabaseAdmin()
    .from("equipment")
    .select("type");
  if (error) throw new Error(error.message);
  const out: Record<string, number> = {};
  for (const r of data ?? []) {
    const t = (r.type as string) ?? "other";
    out[t] = (out[t] ?? 0) + 1;
  }
  return out;
}

export async function deleteHikes(ids: string[]): Promise<number> {
  let deleted = 0;
  for (const id of ids) {
    if (await deleteHike(id)) deleted += 1;
  }
  return deleted;
}

export async function insertEquipment(input: EquipmentInput): Promise<void> {
  return upsertEquipment(input);
}
