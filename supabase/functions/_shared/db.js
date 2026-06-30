// Database operations for edge functions.
// Ported subset of the helpers from backend-lib/db.ts.
// Uses the service role client.
import { supabaseAdmin } from "./supabase-client.ts";
export async function patchEquipment(id, patch) {
    try {
        const existing = await loadEquipmentById(id);
        if (!existing)
            return { ok: false, error: "Equipment not found." };
        const row = {};
        if (patch.type !== undefined)
            row.type = patch.type;
        if (patch.name !== undefined)
            row.name = patch.name;
        if (patch.summary !== undefined)
            row.summary = patch.summary;
        if (patch.description !== undefined)
            row.description = patch.description;
        if (patch.image !== undefined)
            row.image = patch.image;
        if (patch.location !== undefined)
            row.location = patch.location;
        if (patch.capacity !== undefined)
            row.capacity = patch.capacity;
        if (patch.totalUnits !== undefined)
            row.total_units = patch.totalUnits;
        if (patch.availableUnits !== undefined) {
            const total = patch.totalUnits !== undefined ? patch.totalUnits : existing.total_units;
            row.available_units = Math.max(0, Math.min(patch.availableUnits, total));
        }
        if (patch.pricePerNightGbp !== undefined) {
            row.price_pence = Math.round(patch.pricePerNightGbp * 100);
        }
        if (patch.unitLabel !== undefined)
            row.unit_label = patch.unitLabel;
        if (patch.features !== undefined)
            row.features = patch.features;
        if (Object.keys(row).length === 0)
            return { ok: true };
        const { error } = await supabaseAdmin().from("equipment").update(row).eq("id", id);
        if (error)
            return { ok: false, error: error.message };
        return { ok: true };
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}
// ---------------------------------------------------------------------------
// Hikes
// ---------------------------------------------------------------------------
export async function listAllHikes() {
    const { data, error } = await supabaseAdmin()
        .from("hikes")
        .select("*")
        .order("date", { ascending: true });
    if (error)
        throw new Error(error.message);
    return (data ?? []).map(normaliseHike);
}
export async function loadHikeById(id) {
    const { data, error } = await supabaseAdmin()
        .from("hikes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    return data ? normaliseHike(data) : null;
}
export async function loadHikeByIdFull(id) {
    return loadHikeById(id);
}
export async function insertHike(input) {
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
    if (error)
        throw new Error(error.message);
}
export async function patchHike(id, patch) {
    try {
        const existing = await loadHikeById(id);
        if (!existing)
            return { ok: false, error: "Hike not found." };
        const row = {};
        if (patch.title !== undefined)
            row.title = patch.title;
        if (patch.location !== undefined)
            row.location = patch.location;
        if (patch.region !== undefined)
            row.region = patch.region;
        if (patch.date !== undefined)
            row.date = patch.date;
        if (patch.duration !== undefined)
            row.duration = patch.duration;
        if (patch.difficulty !== undefined)
            row.difficulty = patch.difficulty;
        if (patch.summary !== undefined)
            row.summary = patch.summary;
        if (patch.description !== undefined)
            row.description = patch.description;
        if (patch.image !== undefined)
            row.image = patch.image;
        if (patch.hero !== undefined)
            row.hero = patch.hero;
        if (patch.guide !== undefined)
            row.guide = patch.guide;
        if (patch.tags !== undefined)
            row.tags = patch.tags;
        if (patch.spotsTotal !== undefined) {
            const taken = existing.spots_total - existing.spots_left;
            const newSpots = Math.max(0, patch.spotsTotal);
            row.spots_total = newSpots;
            row.spots_left = Math.max(0, newSpots - taken);
        }
        if (patch.priceGbp !== undefined) {
            row.price_pence = Math.round(patch.priceGbp * 100);
        }
        if (Object.keys(row).length === 0)
            return { ok: true };
        const { error } = await supabaseAdmin().from("hikes").update(row).eq("id", id);
        if (error)
            return { ok: false, error: error.message };
        return { ok: true };
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}
export async function deleteHike(id) {
    const { error, count } = await supabaseAdmin()
        .from("hikes")
        .delete({ count: "exact" })
        .eq("id", id);
    if (error)
        throw new Error(error.message);
    return (count ?? 0) > 0;
}
export async function countHikeBookings(hikeId) {
    const { count, error } = await supabaseAdmin()
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("hike_id", hikeId);
    if (error)
        throw new Error(error.message);
    return count ?? 0;
}
// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------
/** Persist a Stripe product id onto a hike row. Used after syncHikeToStripe. */
export async function setHikeStripeProductId(id, productId) {
    const { error } = await supabaseAdmin()
        .from("hikes")
        .update({ stripe_product_id: productId })
        .eq("id", id);
    if (error)
        throw new Error(error.message);
}
/** Persist a Stripe product id onto an equipment row. Used after syncEquipmentToStripe. */
export async function setEquipmentStripeProductId(id, productId) {
    const { error } = await supabaseAdmin()
        .from("equipment")
        .update({ stripe_product_id: productId })
        .eq("id", id);
    if (error)
        throw new Error(error.message);
}
export async function listAllEquipment(type) {
    let q = supabaseAdmin()
        .from("equipment")
        .select("*")
        .order("type", { ascending: true })
        .order("price_pence", { ascending: true });
    if (type)
        q = q.eq("type", type);
    const { data, error } = await q;
    if (error)
        throw new Error(error.message);
    return (data ?? []).map(normaliseEquipment);
}
export async function loadEquipmentById(id) {
    const { data, error } = await supabaseAdmin()
        .from("equipment")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    return data ? normaliseEquipment(data) : null;
}
export async function upsertEquipment(input) {
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
    if (error)
        throw new Error(error.message);
}
export async function deleteEquipment(id) {
    const { error, count } = await supabaseAdmin()
        .from("equipment")
        .delete({ count: "exact" })
        .eq("id", id);
    if (error)
        throw new Error(error.message);
    return (count ?? 0) > 0;
}
// ---------------------------------------------------------------------------
// Hike bookings
// ---------------------------------------------------------------------------
export async function loadHikeBookingById(id) {
    const { data, error } = await supabaseAdmin()
        .from("bookings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    if (!data)
        return null;
    const r = data;
    return {
        id: r.id,
        hike_id: r.hike_id,
        party_size: r.party_size,
        status: r.status,
        payment_status: r.payment_status,
        stripe_session_id: r.stripe_session_id ?? null,
    };
}
export async function updateHikeBooking(id, patch) {
    const row = {};
    if (patch.status !== undefined)
        row.status = patch.status;
    if (patch.payment_status !== undefined)
        row.payment_status = patch.payment_status;
    if (Object.keys(row).length === 0)
        return;
    const { error } = await supabaseAdmin()
        .from("bookings")
        .update(row)
        .eq("id", id);
    if (error)
        throw new Error(error.message);
}
export async function decrementHikeSpots(hikeId, partySize) {
    const { data, error } = await supabaseAdmin().rpc("decrement_hike_spots", { hike_id: hikeId, delta: partySize });
    if (error)
        return { ok: false, error: error.message };
    if (data == null)
        return { ok: false, error: "Not enough spots remaining." };
    return { ok: true };
}
// ---------------------------------------------------------------------------
// Equipment bookings
// ---------------------------------------------------------------------------
export async function loadEquipmentBookingById(id) {
    const { data, error } = await supabaseAdmin()
        .from("equipment_bookings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    if (!data)
        return null;
    const r = data;
    return {
        id: r.id,
        status: r.status,
        payment_status: r.payment_status,
        stripe_session_id: r.stripe_session_id ?? null,
    };
}
export async function updateEquipmentBooking(id, patch) {
    const row = {};
    if (patch.status !== undefined)
        row.status = patch.status;
    if (patch.payment_status !== undefined)
        row.payment_status = patch.payment_status;
    if (Object.keys(row).length === 0)
        return;
    const { error } = await supabaseAdmin()
        .from("equipment_bookings")
        .update(row)
        .eq("id", id);
    if (error)
        throw new Error(error.message);
}
// ---------------------------------------------------------------------------
// Telegram allowlist
// ---------------------------------------------------------------------------
export async function countTelegramAllowlist() {
    const { count, error } = await supabaseAdmin()
        .from("telegram_allowlist")
        .select("chat_id", { count: "exact", head: true });
    if (error)
        throw new Error(error.message);
    return count ?? 0;
}
export async function isTelegramChatAllowed(chatId) {
    const { data, error } = await supabaseAdmin()
        .from("telegram_allowlist")
        .select("chat_id")
        .eq("chat_id", chatId)
        .maybeSingle();
    if (error)
        return false;
    return data !== null;
}
export async function insertTelegramAllowlist(chatId, label, addedBy) {
    const { error } = await supabaseAdmin()
        .from("telegram_allowlist")
        .insert({
        chat_id: chatId,
        label: label ?? null,
        added_at: Date.now(),
        added_by: addedBy ?? "edge-function",
    });
    if (error)
        throw new Error(error.message);
}
// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------
export async function deleteContactMessagesOlderThan(cutoffMs) {
    const { count, error } = await supabaseAdmin()
        .from("contact_messages")
        .delete({ count: "exact" })
        .lt("created_at", new Date(cutoffMs).toISOString());
    if (error)
        throw new Error(error.message);
    return count ?? 0;
}
// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------
export async function listRecentProfiles(sinceMs) {
    const { data, error } = await supabaseAdmin()
        .from("profiles")
        .select("id, email, name, created_at")
        .gt("created_at", new Date(sinceMs).toISOString())
        .order("created_at", { ascending: false });
    if (error)
        throw new Error(error.message);
    return (data ?? []).map((r) => {
        const d = r;
        return {
            id: d.id,
            email: d.email,
            name: d.name,
            created_at: d.created_at,
        };
    });
}
// ---------------------------------------------------------------------------
// Normalisers
// ---------------------------------------------------------------------------
function normaliseHike(r) {
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
        stripe_product_id: r.stripe_product_id ?? null,
    };
}
function normaliseEquipment(r) {
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
        stripe_product_id: r.stripe_product_id ?? null,
    };
}
