// Telegram bot edge function — replaces the in-process Bun webhook.
//
// Receives updates from the Telegram Bot API, dispatches commands
// (/new-hike, /edit-hike, /new-rent, etc.), and manages multi-step
// session flows for creating/editing/deleting hikes and equipment.
//
// Env vars (set via `supabase secrets set`):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   TELEGRAM_BOT_TOKEN
//   TELEGRAM_ADMIN_CHAT
//   PUBLIC_SITE_URL         (optional, for hike links in confirm messages)
import { sendTelegramMessage } from "../_shared/telegram-api.ts";
import { loadSession, saveSession } from "../_shared/bot-sessions.ts";
import { parseHikeText } from "../_shared/hike-parser.ts";
import { listAllHikes, loadHikeByIdFull, insertHike, patchHike, deleteHike, listAllEquipment, loadEquipmentById, upsertEquipment, patchEquipment, deleteEquipment, countTelegramAllowlist, isTelegramChatAllowed, setHikeStripeProductId, setEquipmentStripeProductId, } from "../_shared/db.ts";
import { syncHikeToStripe, removeHikeFromStripe, syncEquipmentToStripe, removeEquipmentFromStripe, } from "../_shared/stripe-sync.ts";
import { isStripeConfigured } from "../_shared/stripe.ts";
// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
function env(name) {
    const v = Deno.env.get(name);
    if (!v)
        throw new Error(`Missing env var: ${name}`);
    return v;
}
const envConfig = {
    botToken: env("TELEGRAM_BOT_TOKEN"),
    adminChat: env("TELEGRAM_ADMIN_CHAT"),
    publicSiteUrl: Deno.env.get("PUBLIC_SITE_URL") || "https://kkthenuttah.zo.space",
};
const rentDrafts = new Map();
async function sessionFor(chat) {
    return (await loadSession(chat));
}
async function setSession(chat, s) {
    await saveSession(chat, s);
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const VALID_UNIT_LABELS = ["per night", "per stay", "per day"];
// Allowlist: env-var fallback when table is empty
async function isAllowedChat(chatId) {
    if (typeof chatId !== "number" && typeof chatId !== "string")
        return false;
    const key = String(chatId);
    if (await isTelegramChatAllowed(key))
        return true;
    const total = await countTelegramAllowlist();
    if (total === 0) {
        return key === envConfig.adminChat;
    }
    return false;
}
function buildHikeSummary(h) {
    const tags = h.tags.length ? `\nTags: ${h.tags.join(", ")}` : "";
    return (`<b>New hike draft</b>\n\n` +
        `<b>${h.title}</b>\n` +
        `📍 ${h.location}, ${h.region}\n` +
        `📅 ${h.date} · ${h.duration}\n` +
        `🥾 ${h.difficulty} · ${h.spotsTotal} spots\n` +
        `💷 £${h.priceGbp.toFixed(2)} per person\n` +
        `👤 ${h.guide}\n` +
        `🖼 ${h.image}${tags}\n\n` +
        `<i>${h.summary}</i>`);
}
async function listHikes() {
    const rows = await listAllHikes();
    return rows.map((r) => ({ id: r.id, title: r.title, date: r.date }));
}
async function buildHikeListMessage() {
    const hikes = await listHikes();
    if (hikes.length === 0) {
        return "<b>No hikes on the site yet.</b>\nUse /new-hike to create one.";
    }
    const lines = hikes.slice(0, 30).map((h, i) => {
        const idx = String(i + 1).padStart(2, "0");
        return `${idx}. <b>${h.title}</b> — ${h.date}`;
    });
    return `<b>Hikes (${hikes.length})</b>\n\n${lines.join("\n")}\n\nReply with the <b>number</b> of the hike you want.`;
}
async function buildRentListMessage() {
    const items = await listAllEquipment();
    if (items.length === 0) {
        return "<b>No rent items on the site yet.</b>\nUse /new-rent to create one.";
    }
    const lines = items.slice(0, 30).map((it, i) => {
        const idx = String(i + 1).padStart(2, "0");
        return `${idx}. <b>${it.name}</b> <i>(${it.type})</i> — ${it.location}`;
    });
    return `<b>Rent items (${items.length})</b>\n\n${lines.join("\n")}\n\nReply with the <b>number</b> of the item you want.`;
}
function buildErrorReply(errors) {
    const lines = errors.map((e) => `• <b>${e.field}</b>: ${e.message}`);
    return (`<b>I couldn't read that as a hike.</b>\n` +
        `Please add:\n${lines.join("\n")}\n\n` +
        `Example: <code>Yorkshire Dales 3 day trek, £85, hard, 12 spots, 2026-08-12, led by Abu Jabal</code>\n\n` +
        `Add a <code>Description:</code> section with at least a few sentences.`);
}
function buildRentErrorReply(errors) {
    const lines = errors.map((e) => `• <b>${e.field}</b>: ${e.message}`);
    return (`<b>I couldn't read that as a rent item.</b>\n` +
        `Please add:\n${lines.join("\n")}\n\n` +
        `Example:\n<code>type: tent\nname: 4-person wild camp tent\nsummary: 4-person geodesic, sleeps 4\n...</code>\n\n` +
        `All fields are required except <code>features</code> and <code>image</code>. /cancel to abort.`);
}
function buildRentItemSummary(it) {
    const features = it.features.length ? `\nFeatures: ${it.features.join(", ")}` : "";
    const capacity = it.capacity ? ` · Capacity ${it.capacity}` : "";
    return (`<b>New rent item draft</b>\n\n` +
        `<b>${it.name}</b> <i>(${it.type})</i>\n` +
        `📍 ${it.location}\n` +
        `💷 £${it.pricePerNightGbp.toFixed(2)} ${it.unitLabel}\n` +
        `📦 Total ${it.totalUnits} · Available ${it.availableUnits}${capacity}\n` +
        `🖼 ${it.image}${features}\n\n` +
        `<i>${it.summary}</i>`);
}
function buildHelp() {
    return ("<b>Badr Adventures admin bot</b>\n\n" +
        "<b>Hikes</b>\n" +
        "• /new-hike &lt;text&gt; — parse a hike from text\n" +
        "• /edit-hike — list and edit hikes\n" +
        "• /delete-hike — list and delete hikes\n\n" +
        "<b>Rent items</b>\n" +
        "• /new-rent &lt;fields&gt; — create a rent item\n" +
        "• /edit-rent — list and edit items\n" +
        "• /delete-rent — list and delete items\n\n" +
        "<b>Other</b>\n" +
        "• /drafts — show current hike draft\n" +
        "• /cancel — abort current flow\n" +
        "• /help — this message");
}
function buildRentPrompt() {
    return ("<b>New rent item.</b> Send the fields now, one per line:\n\n" +
        "<code>type: tent | bnb | gear\nname: 4-person wild camp tent\nsummary: ...\ndescription: ...\nlocation: Lake District\npricePerNightGbp: 25\ncapacity: 4\ntotalUnits: 6\navailableUnits: 6\nunitLabel: per night\nimage: /images/tent-camp.jpg\nfeatures: waterproof, 2-bedrooms</code>\n\n" +
        "Or send /cancel to abort.");
}
// ---------------------------------------------------------------------------
// Rent parser
// ---------------------------------------------------------------------------
function parseRentText(input, imageHint) {
    const errors = [];
    const fields = {};
    for (const line of input.split(/\r?\n/)) {
        const m = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.+?)\s*$/);
        if (m)
            fields[m[1].toLowerCase()] = m[2];
    }
    if (fields["price"] && !fields["pricepernightgbp"])
        fields["pricepernightgbp"] = fields["price"];
    if (fields["per_night"] && !fields["pricepernightgbp"])
        fields["pricepernightgbp"] = fields["per_night"];
    const id = fields["id"]?.trim();
    if (!id)
        errors.push({ field: "id", message: "Add an id like 4p-tent-ld." });
    const type = (fields["type"] ?? "").toLowerCase();
    if (!["tent", "bnb", "gear"].includes(type))
        errors.push({ field: "type", message: "Must be: tent, bnb, gear." });
    const name = fields["name"]?.trim();
    if (!name)
        errors.push({ field: "name", message: "Add a name." });
    const summary = fields["summary"]?.trim();
    if (!summary)
        errors.push({ field: "summary", message: "Add a summary." });
    const description = fields["description"]?.trim();
    if (!description)
        errors.push({ field: "description", message: "Add a description." });
    const location = fields["location"]?.trim();
    if (!location)
        errors.push({ field: "location", message: "Add a location." });
    const price = Number(fields["pricepernightgbp"] ?? "");
    if (!Number.isFinite(price) || price < 0)
        errors.push({ field: "pricePerNightGbp", message: "Add a non-negative number." });
    const capacity = Number(fields["capacity"] ?? "");
    if (!Number.isInteger(capacity) || capacity < 1)
        errors.push({ field: "capacity", message: "Add a positive integer." });
    const totalUnits = Number(fields["totalunits"] ?? fields["stock"] ?? "");
    if (!Number.isInteger(totalUnits) || totalUnits < 0)
        errors.push({ field: "totalUnits", message: "Add a non-negative integer." });
    const availableUnits = Number(fields["availableunits"] ?? "");
    if (!Number.isInteger(availableUnits) || availableUnits < 0)
        errors.push({ field: "availableUnits", message: "Add a non-negative integer." });
    const unitLabel = fields["unitlabel"] ?? "per night";
    if (!VALID_UNIT_LABELS.includes(unitLabel))
        errors.push({ field: "unitLabel", message: `Must be: ${VALID_UNIT_LABELS.join(", ")}.` });
    const image = (fields["image"] ?? imageHint ?? "/images/tent-camp.jpg").trim();
    const features = (fields["features"] ?? fields["amenities"] ?? "")
        .split(",").map((s) => s.trim()).filter(Boolean);
    if (errors.length > 0)
        return { ok: false, errors };
    return {
        ok: true,
        item: {
            id: id,
            type: type,
            name: name,
            summary: summary,
            description: description,
            image,
            location: location,
            pricePerNightGbp: price,
            capacity,
            totalUnits,
            availableUnits,
            unitLabel,
            features,
        },
    };
}
// ---------------------------------------------------------------------------
// DB write wrappers (mirror the existing command handler pattern)
// ---------------------------------------------------------------------------
async function saveHike(h) {
    try {
        const existing = await loadHikeByIdFull(h.id);
        if (existing)
            return { ok: false, error: `A hike with id "${h.id}" already exists.` };
        await insertHike({
            id: h.id, title: h.title, location: h.location, region: h.region, date: h.date,
            duration: h.duration, difficulty: h.difficulty, spots_total: h.spotsTotal, spots_left: h.spotsTotal,
            summary: h.summary, description: h.description, image: h.image, hero: h.hero, tags: h.tags, guide: h.guide,
            price_pence: Math.round(h.priceGbp * 100),
        });
        // Sync to Stripe (best-effort; never block the bot)
        if (isStripeConfigured()) {
            try {
                const reloaded = await loadHikeByIdFull(h.id);
                if (reloaded) {
                    const { productId } = await syncHikeToStripe(reloaded);
                    if (productId && productId !== reloaded.stripe_product_id) {
                        await setHikeStripeProductId(h.id, productId);
                    }
                }
            }
            catch (err) {
                console.error("[stripe-sync] saveHike sync failed:", err);
            }
        }
        return { ok: true, id: h.id };
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}
async function updateHike(id, body) {
    try {
        const patch = {};
        if (body.title !== undefined)
            patch.title = body.title;
        if (body.location !== undefined)
            patch.location = body.location;
        if (body.region !== undefined)
            patch.region = body.region;
        if (body.date !== undefined)
            patch.date = body.date;
        if (body.duration !== undefined)
            patch.duration = body.duration;
        if (body.difficulty !== undefined)
            patch.difficulty = body.difficulty;
        if (body.summary !== undefined)
            patch.summary = body.summary;
        if (body.description !== undefined)
            patch.description = body.description;
        if (body.image !== undefined)
            patch.image = body.image;
        if (body.hero !== undefined)
            patch.hero = body.hero;
        if (body.guide !== undefined)
            patch.guide = body.guide;
        if (body.spotsTotal !== undefined)
            patch.spotsTotal = Number(body.spotsTotal);
        if (body.priceGbp !== undefined)
            patch.priceGbp = Number(body.priceGbp);
        if (body.tags !== undefined)
            patch.tags = body.tags;
        const result = await patchHike(id, patch);
        if (!result.ok)
            return result;
        // Sync to Stripe
        if (isStripeConfigured()) {
            try {
                const reloaded = await loadHikeByIdFull(id);
                if (reloaded) {
                    const { productId } = await syncHikeToStripe(reloaded);
                    if (productId && productId !== reloaded.stripe_product_id) {
                        await setHikeStripeProductId(id, productId);
                    }
                }
            }
            catch (err) {
                console.error("[stripe-sync] updateHike sync failed:", err);
            }
        }
        return { ok: true };
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}
async function deleteHikes(ids) {
    let count = 0;
    for (const id of ids) {
        // Capture the stripe_product_id before deletion so we can archive the product
        let productId;
        if (isStripeConfigured()) {
            try {
                const existing = await loadHikeByIdFull(id);
                productId = existing?.stripe_product_id;
            }
            catch (err) {
                console.error("[stripe-sync] deleteHikes preload failed:", err);
            }
        }
        const ok = await deleteHike(id);
        if (ok) {
            count++;
            if (isStripeConfigured()) {
                try {
                    await removeHikeFromStripe(productId, id);
                }
                catch (err) {
                    console.error("[stripe-sync] deleteHikes archive failed:", err);
                }
            }
        }
    }
    return count > 0 ? { ok: true } : { ok: false, error: "No hikes deleted." };
}
async function saveRentItem(it) {
    try {
        const existing = await loadEquipmentById(it.id);
        if (existing)
            return { ok: false, error: `Item "${it.id}" already exists.` };
        await upsertEquipment({
            id: it.id, type: it.type, name: it.name, summary: it.summary, description: it.description,
            image: it.image, location: it.location, pricePerNightGbp: it.pricePerNightGbp,
            capacity: it.capacity, totalUnits: it.totalUnits, availableUnits: it.availableUnits,
            unitLabel: it.unitLabel, features: it.features,
        });
        if (isStripeConfigured()) {
            try {
                const reloaded = await loadEquipmentById(it.id);
                if (reloaded) {
                    const { productId } = await syncEquipmentToStripe(reloaded);
                    if (productId && productId !== reloaded.stripe_product_id) {
                        await setEquipmentStripeProductId(it.id, productId);
                    }
                }
            }
            catch (err) {
                console.error("[stripe-sync] saveRentItem sync failed:", err);
            }
        }
        return { ok: true, id: it.id };
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}
async function updateRentItem(id, body) {
    try {
        const patch = {};
        if (body.name !== undefined)
            patch.name = body.name;
        if (body.type !== undefined)
            patch.type = body.type;
        if (body.summary !== undefined)
            patch.summary = body.summary;
        if (body.description !== undefined)
            patch.description = body.description;
        if (body.location !== undefined)
            patch.location = body.location;
        if (body.image !== undefined)
            patch.image = body.image;
        if (body.pricePerNightGbp !== undefined)
            patch.pricePerNightGbp = Number(body.pricePerNightGbp);
        if (body.capacity !== undefined)
            patch.capacity = Number(body.capacity);
        if (body.totalUnits !== undefined)
            patch.totalUnits = Number(body.totalUnits);
        if (body.availableUnits !== undefined)
            patch.availableUnits = Number(body.availableUnits);
        if (body.unitLabel !== undefined)
            patch.unitLabel = body.unitLabel;
        if (body.features !== undefined)
            patch.features = body.features;
        const result = await patchEquipment(id, patch);
        if (!result.ok)
            return result;
        if (isStripeConfigured()) {
            try {
                const reloaded = await loadEquipmentById(id);
                if (reloaded) {
                    const { productId } = await syncEquipmentToStripe(reloaded);
                    if (productId && productId !== reloaded.stripe_product_id) {
                        await setEquipmentStripeProductId(id, productId);
                    }
                }
            }
            catch (err) {
                console.error("[stripe-sync] updateRentItem sync failed:", err);
            }
        }
        return { ok: true };
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}
async function deleteRentItems(ids) {
    let count = 0;
    for (const id of ids) {
        let productId;
        if (isStripeConfigured()) {
            try {
                const existing = await loadEquipmentById(id);
                productId = existing?.stripe_product_id;
            }
            catch (err) {
                console.error("[stripe-sync] deleteRentItems preload failed:", err);
            }
        }
        const ok = await deleteEquipment(id);
        if (ok) {
            count++;
            if (isStripeConfigured()) {
                try {
                    await removeEquipmentFromStripe(productId, id);
                }
                catch (err) {
                    console.error("[stripe-sync] deleteRentItems archive failed:", err);
                }
            }
        }
    }
    return count > 0 ? { ok: true } : { ok: false, error: "No items deleted." };
}
// ---------------------------------------------------------------------------
// Hike edit helpers
// ---------------------------------------------------------------------------
const HIKE_EDITABLE_FIELDS = [
    "title", "date", "duration", "location", "region", "difficulty",
    "spots", "price", "summary", "description", "image", "guide", "tags",
];
function mapHikeFieldToBody(field, value) {
    switch (field) {
        case "title": return { title: value };
        case "date": return { date: value };
        case "duration": return { duration: value };
        case "location": return { location: value };
        case "region": return { region: value };
        case "difficulty": return { difficulty: value };
        case "spots": return { spotsTotal: Number(value) };
        case "price": return { priceGbp: Number(value) };
        case "summary": return { summary: value };
        case "description": return { description: value };
        case "image": return { image: value };
        case "guide": return { guide: value };
        case "tags": return { tags: value.split(",").map((s) => s.trim()).filter(Boolean) };
    }
}
const RENT_EDITABLE_FIELDS = [
    "name", "type", "summary", "description", "location", "pricePerNightGbp",
    "capacity", "totalUnits", "availableUnits", "unitLabel", "image", "features",
];
// Fields that may have default values worth flagging before save
const HIKE_DEFAULTED_FIELDS = [
    { key: "priceGbp", label: "Price (£)", check: (d) => d.priceGbp === 0 ? "The price looks like £0. Set a price in GBP (e.g. 85)." : null },
    { key: "spotsTotal", label: "Spots", check: (d) => d.spotsTotal === 12 ? "Spots are 12 (default). How many spots?" : null },
    { key: "duration", label: "Duration", check: (d) => d.duration === "Full day" ? "Duration is 'Full day'. What should it be?" : null },
    { key: "guide", label: "Guide", check: (d) => d.guide === "Abu Jabal" ? "The guide is set to 'Abu Jabal'. Who's the guide?" : null },
    { key: "image", label: "Image", check: (d) => d.image === "/images/hero-mountains.jpg" ? "Image is the default. Provide an image path or send 'skip'." : null },
    { key: "tags", label: "Tags", check: (d) => !(d.tags?.length > 0) ? "No tags set. Send comma-separated tags or 'none'." : null },
];
function mapRentFieldToBody(field, value) {
    switch (field) {
        case "name": return { name: value };
        case "type": return { type: value.toLowerCase() };
        case "summary": return { summary: value };
        case "description": return { description: value };
        case "location": return { location: value };
        case "pricePerNightGbp": return { pricePerNightGbp: Number(value) };
        case "capacity": return { capacity: Number(value) };
        case "totalUnits": return { totalUnits: Number(value) };
        case "availableUnits": return { availableUnits: Number(value) };
        case "unitLabel": return { unitLabel: value };
        case "image": return { image: value };
        case "features": return { features: value.split(",").map((s) => s.trim()).filter(Boolean) };
    }
}
// ---------------------------------------------------------------------------
// Main request handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
    // Only accept POST
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
            status: 405, headers: { "Content-Type": "application/json" },
        });
    }
    let update;
    try {
        update = await req.json();
    }
    catch {
        return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
            status: 400, headers: { "Content-Type": "application/json" },
        });
    }
    try {
        const msg = update.message;
        if (!msg) {
            return new Response(JSON.stringify({ ok: true, skipped: "no message" }), {
                headers: { "Content-Type": "application/json" },
            });
        }
        if (!(await isAllowedChat(msg.chat.id))) {
            console.warn(`[telegram-webhook] rejected chat ${msg.chat.id}`);
            return new Response(JSON.stringify({ ok: true, dropped: "unauthorized" }), {
                headers: { "Content-Type": "application/json" },
            });
        }
        let imageUrl;
        if (Array.isArray(msg.photo) && msg.photo.length > 0) {
            const best = msg.photo[msg.photo.length - 1];
            imageUrl = await getFileDownloadUrl(best.file_id) ?? undefined;
        }
        const text = msg.text ?? msg.caption ?? "";
        await handleTextOrPhoto(chatKey(msg.chat.id), text, msg.message_id, imageUrl);
        return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
        });
    }
    catch (err) {
        console.error("[telegram-webhook] handler error", err);
        return new Response(JSON.stringify({ ok: false, error: "Internal error" }), {
            status: 500, headers: { "Content-Type": "application/json" },
        });
    }
});
// ---------------------------------------------------------------------------
// Telegram file helper
// ---------------------------------------------------------------------------
async function getFileDownloadUrl(fileId) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${envConfig.botToken}/getFile?file_id=${fileId}`);
        const j = await res.json();
        if (!j.ok || !j.result?.file_path)
            return null;
        return `https://api.telegram.org/file/bot${envConfig.botToken}/${j.result.file_path}`;
    }
    catch {
        return null;
    }
}
function chatKey(chatId) {
    return String(chatId);
}
// ---------------------------------------------------------------------------
// Command dispatcher
// ---------------------------------------------------------------------------
async function handleTextOrPhoto(chat, text, messageId, imageUrl) {
    const trimmed = text.trim();
    const session = await sessionFor(chat);
    const lower = trimmed.toLowerCase();
    // ---- cancel ----
    if (lower === "/cancel" || lower === "/discard") {
        if (session) {
            await setSession(chat, null);
            await sendTelegramMessage("Session cancelled. ✋");
        }
        else {
            await sendTelegramMessage("Nothing to cancel.");
        }
        return;
    }
    // ---- /start /help ----
    if (lower === "/start" || lower === "/help") {
        await sendTelegramMessage(buildHelp());
        return;
    }
    // ---- /drafts ----
    if (lower === "/drafts") {
        if (session && session.kind.type === "hike-new" && session.draft) {
            await sendTelegramMessage(buildHikeSummary(session.draft));
            await sendTelegramMessage("Reply <code>yes</code> to save, <code>no</code> to discard.");
        }
        else {
            await sendTelegramMessage("No active hike draft. Use /new-hike to start one.");
        }
        return;
    }
    // ---- /new-hike ----
    if (lower === "/new-hike" || lower.startsWith("/new-hike ")) {
        const after = trimmed.slice("/new-hike".length).trim();
        if (after.length > 0) {
            await startHikeDraft(chat, after, imageUrl);
        }
        else {
            await setSession(chat, { kind: { type: "hike-new" }, lastMessageId: messageId });
            await sendTelegramMessage("<b>New hike.</b> Send the hike description now.\n\n" +
                "Example:\n<code>Yorkshire Dales 3 day trek, £85, hard, 12 spots, 2026-08-12, led by Abu Jabal</code>\n\n" +
                "Add a <code>Description:</code> section with a few sentences.\n\nOr /cancel to abort.");
        }
        return;
    }
    // ---- /edit-hike ----
    if (lower === "/edit-hike" || lower === "/edit" || lower.startsWith("/edit-hike ") || lower.startsWith("/edit ")) {
        const after = trimmed.startsWith("/edit-hike")
            ? trimmed.slice("/edit-hike".length).trim()
            : trimmed.slice("/edit".length).trim();
        const hikes = await listHikes();
        if (after.length > 0) {
            const n = Number(after);
            if (!Number.isInteger(n) || n < 1 || n > hikes.length) {
                await sendTelegramMessage(`Couldn't parse "${after}" as a hike number. Please use a number 1–${hikes.length}.`);
                return;
            }
            await handleHikeEditPick(chat, after, messageId);
            return;
        }
        await setSession(chat, { kind: { type: "hike-edit" }, lastMessageId: messageId });
        await sendTelegramMessage(await buildHikeListMessage());
        return;
    }
    // ---- /delete-hike ----
    if (lower === "/delete-hike" || lower === "/delete") {
        await setSession(chat, { kind: { type: "hike-delete", selected: [] }, lastMessageId: messageId });
        await sendTelegramMessage((await buildHikeListMessage()) +
            "\n\nReply with the <b>number</b> to delete, <b>all</b>, or comma-separated numbers (e.g. <code>1,3,5</code>).");
        return;
    }
    // ---- /new-rent ----
    if (lower === "/new-rent" || lower.startsWith("/new-rent ")) {
        const after = trimmed.slice("/new-rent".length).trim();
        if (after.length > 0) {
            await startRentDraft(chat, after, imageUrl);
        }
        else {
            await setSession(chat, { kind: { type: "rent-new" }, lastMessageId: messageId });
            await sendTelegramMessage(buildRentPrompt());
        }
        return;
    }
    // ---- /edit-rent ----
    if (lower === "/edit-rent") {
        await setSession(chat, { kind: { type: "rent-edit" }, lastMessageId: messageId });
        await sendTelegramMessage(await buildRentListMessage());
        return;
    }
    // ---- /delete-rent ----
    if (lower === "/delete-rent") {
        await setSession(chat, { kind: { type: "rent-delete", selected: [] }, lastMessageId: messageId });
        await sendTelegramMessage((await buildRentListMessage()) +
            "\n\nReply with the <b>number</b> to delete, <b>all</b>, or comma-separated numbers.");
        return;
    }
    // ---- Multi-step session handling ----
    if (session) {
        if (session.kind.type === "hike-new") {
            if (session.draft) {
                if (/^(yes|y|save|confirm|sure|ok|okay|yeah|yep)$/i.test(trimmed)) {
                    const d = session.draft;
                    // Check for defaulted fields before saving
                    const flagged = [];
                    for (const f of HIKE_DEFAULTED_FIELDS) {
                        if (f.check(d) !== null)
                            flagged.push(f.key);
                    }
                    if (flagged.length > 0) {
                        await setSession(chat, {
                            kind: { type: "hike-new-check", draft: d, pendingFields: flagged, currentFieldIndex: 0 },
                            lastMessageId: messageId,
                        });
                        const f = HIKE_DEFAULTED_FIELDS.find((x) => x.key === flagged[0]);
                        const msg = f.check(d);
                        await sendTelegramMessage(`⚠️ <b>Check this before saving</b>\n\n${msg}\n\nReply with the value, or <code>keep</code> to keep the current value.`);
                        return;
                    }
                    await setSession(chat, null);
                    const r = await saveHike(d);
                    if (!r.ok) {
                        await setSession(chat, { kind: { type: "hike-new" }, draft: d });
                        await sendTelegramMessage(`❌ Couldn't save: ${r.error}\n\nDraft still active. Reply YES to retry, NO to discard.`);
                        return;
                    }
                    await sendTelegramMessage(`✅ <b>Hike saved and live on the site.</b>\n<a href="${envConfig.publicSiteUrl}/hikes/${r.id}">${envConfig.publicSiteUrl}/hikes/${r.id}</a>`);
                    return;
                }
                if (/^(no|n|discard|cancel|nope|nah)$/i.test(trimmed)) {
                    await setSession(chat, null);
                    await sendTelegramMessage("Draft discarded.");
                    return;
                }
            }
            await startHikeDraft(chat, trimmed, imageUrl, messageId);
            return;
        }
        if (session.kind.type === "hike-new-check") {
            await handleHikeNewCheck(chat, trimmed, messageId);
            return;
        }
        if (session.kind.type === "hike-edit") {
            await handleHikeEditPick(chat, trimmed, messageId);
            return;
        }
        if (session.kind.type === "hike-edit-field") {
            await handleHikeEditField(chat, trimmed, messageId);
            return;
        }
        if (session.kind.type === "hike-delete") {
            await handleHikeDelete(chat, trimmed, messageId);
            return;
        }
        if (session.kind.type === "rent-new") {
            await startRentDraft(chat, trimmed, imageUrl, messageId);
            return;
        }
        if (session.kind.type === "rent-edit") {
            await handleRentEditPick(chat, trimmed, messageId);
            return;
        }
        if (session.kind.type === "rent-edit-field") {
            await handleRentEditField(chat, trimmed, messageId);
            return;
        }
        if (session.kind.type === "rent-delete") {
            await handleRentDelete(chat, trimmed, messageId);
            return;
        }
    }
    // ---- fallback: check for session loss, then treat as hike description ----
    if (/^\d+$/.test(trimmed)) {
        // User replied with just a number but the session was lost (cold start).
        await sendTelegramMessage("That looks like a number, but I lost track of what we were doing. " +
            "Use /edit-hike to choose again, or paste a full hike description to create one.");
        return;
    }
    await startHikeDraft(chat, trimmed, imageUrl, messageId);
}
// ---------------------------------------------------------------------------
// Hike flows
// ---------------------------------------------------------------------------
async function startHikeDraft(chat, text, imageUrl, messageId) {
    const result = parseHikeText(text, { imageHint: imageUrl });
    if (!result.ok) {
        await sendTelegramMessage(buildErrorReply(result.errors));
        return;
    }
    await setSession(chat, { kind: { type: "hike-new" }, draft: result.hike, lastMessageId: messageId });
    await sendTelegramMessage(buildHikeSummary(result.hike));
    await sendTelegramMessage("Reply <b>YES</b> to save, <b>NO</b> to discard, or send a corrected description.");
}
async function handleHikeEditPick(chat, text, messageId) {
    const s = await sessionFor(chat);
    if (!s || s.kind.type !== "hike-edit")
        return;
    const hikes = await listHikes();
    const trimmed = text.trim();
    if (/^(cancel|stop|never mind)$/i.test(trimmed)) {
        await setSession(chat, null);
        await sendTelegramMessage("Cancelled. ✋");
        return;
    }
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n < 1 || n > hikes.length) {
        await sendTelegramMessage(`Please reply with a number between 1 and ${hikes.length}, or /cancel.`);
        return;
    }
    const picked = hikes[n - 1];
    await setSession(chat, { kind: { type: "hike-edit-field", hikeId: picked.id, field: "", partial: {} }, lastMessageId: messageId });
    const fieldLines = HIKE_EDITABLE_FIELDS.map((f, i) => `${i + 1}. ${f}`).join("\n");
    await sendTelegramMessage(`<b>Editing:</b> ${picked.title} — ${picked.date}\n\n` +
        `What would you like to change? Reply with <b>number(s)</b>, comma-separated.\n` +
        `${fieldLines}\n\n` +
        `Example: <code>8,2</code> changes price and date. Or /cancel.`);
}
async function handleHikeEditField(chat, text, messageId) {
    const s = await sessionFor(chat);
    if (!s || s.kind.type !== "hike-edit-field")
        return;
    const trimmed = text.trim();
    if (/^(cancel|stop|never mind)$/i.test(trimmed)) {
        await setSession(chat, null);
        await sendTelegramMessage("Cancelled. ✋");
        return;
    }
    if (!s.kind.field) {
        const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
        const nums = parts.map((p) => Number(p)).filter((n) => Number.isInteger(n));
        if (nums.length === 0 || nums.some((n) => n < 1 || n > HIKE_EDITABLE_FIELDS.length)) {
            const fieldList = HIKE_EDITABLE_FIELDS.map((f, i) => `${i + 1}. ${f}`).join("\n");
            await sendTelegramMessage(`Pick number(s) 1–${HIKE_EDITABLE_FIELDS.length}.\n\n${fieldList}\n\nExample: <code>8,2</code> changes price and date.`);
            return;
        }
        const requested = nums.map((n) => HIKE_EDITABLE_FIELDS[n - 1]);
        const first = requested[0];
        await setSession(chat, { ...s, kind: { ...s.kind, field: first } });
        await sendTelegramMessage(`<b>New ${first}?</b>` + (requested.length > 1 ? ` (After this: ${requested.slice(1).join(", ")})` : "") +
            `\n\nReply with the new value, <code>skip</code>, or /cancel.`);
        return;
    }
    const field = s.kind.field;
    if (/^skip$/i.test(trimmed)) {
        await advanceHikeFieldQueue(chat, s, messageId);
        return;
    }
    const update = mapHikeFieldToBody(field, trimmed);
    s.kind.partial = { ...s.kind.partial, ...update };
    await advanceHikeFieldQueue(chat, s, messageId, field);
}
async function advanceHikeFieldQueue(chat, s, messageId, _justSet) {
    if (s.kind.type !== "hike-edit-field")
        return;
    const partial = s.kind.partial;
    if (Object.keys(partial).length === 0) {
        await setSession(chat, null);
        await sendTelegramMessage("No changes made.");
        return;
    }
    const result = await updateHike(s.kind.hikeId, partial);
    if (!result.ok) {
        await setSession(chat, null);
        await sendTelegramMessage(`❌ Save failed: ${result.error}`);
        return;
    }
    await setSession(chat, { ...s, kind: { ...s.kind, field: "", partial: {} } });
    const lines = Object.keys(partial).map((k) => `• <b>${k}</b>`).join("\n");
    const fieldNumList = HIKE_EDITABLE_FIELDS.map((f, i) => `${i + 1}. ${f}`).join("\n");
    await sendTelegramMessage(`✅ Updated.\n\n${lines}\n\nWant to change another field? Reply with number(s), or <code>done</code> to finish.\n\n${fieldNumList}`);
}
async function handleHikeDelete(chat, text, messageId) {
    const s = await sessionFor(chat);
    if (!s || s.kind.type !== "hike-delete")
        return;
    const hikes = await listHikes();
    const trimmed = text.trim();
    if (/^(cancel|stop)$/i.test(trimmed)) {
        await setSession(chat, null);
        await sendTelegramMessage("Cancelled. ✋");
        return;
    }
    if (trimmed === "all") {
        const ids = hikes.map((h) => h.id);
        const r = await deleteHikes(ids);
        await setSession(chat, null);
        await sendTelegramMessage(r.ok ? `🗑 Deleted ${ids.length} hikes.` : `❌ ${r.error}`);
        return;
    }
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    const nums = parts.map((p) => Number(p)).filter((n) => Number.isInteger(n));
    if (nums.length === 0 || nums.some((n) => n < 1 || n > hikes.length)) {
        await sendTelegramMessage(`Invalid. There are ${hikes.length} hikes. Reply with numbers or 'all'.`);
        return;
    }
    const ids = nums.map((n) => hikes[n - 1].id);
    const names = nums.map((n) => hikes[n - 1].title).join(", ");
    const r = await deleteHikes(ids);
    await setSession(chat, null);
    await sendTelegramMessage(r.ok ? `🗑 Deleted: ${names}` : `❌ ${r.error}`);
}
// ---------------------------------------------------------------------------
// Rent flows
// ---------------------------------------------------------------------------
async function startRentDraft(chat, text, imageUrl, messageId) {
    const result = parseRentText(text, imageUrl);
    if (!result.ok) {
        await sendTelegramMessage(buildRentErrorReply(result.errors));
        return;
    }
    await setSession(chat, { kind: { type: "rent-new" } });
    rentDrafts.set(chat, result.item);
    await sendTelegramMessage(buildRentItemSummary(result.item) + "\n\nReply <b>YES</b> to save, <b>NO</b> to discard, or /cancel.");
}
async function handleHikeNewCheck(chat, text, messageId) {
    const s = await sessionFor(chat);
    if (!s || s.kind.type !== "hike-new-check")
        return;
    const trimmed = text.trim();
    if (/^(cancel|stop|abort)$/i.test(trimmed)) {
        await setSession(chat, null);
        await sendTelegramMessage("Cancelled. Hike not saved. ✋");
        return;
    }
    const idx = s.kind.currentFieldIndex;
    const fieldKey = s.kind.pendingFields[idx];
    const fieldDef = HIKE_DEFAULTED_FIELDS.find((f) => f.key === fieldKey);
    if (!fieldDef) {
        // Shouldn't happen — skip to next
        await setSession(chat, { ...s, kind: { ...s.kind, currentFieldIndex: idx + 1 } });
        return;
    }
    const draft = { ...s.kind.draft };
    if (!/^(keep|skip|default|same)$/i.test(trimmed)) {
        // Apply the value
        switch (fieldKey) {
            case "priceGbp":
                draft.priceGbp = Number(trimmed);
                break;
            case "spotsTotal":
                draft.spotsTotal = Number(trimmed);
                break;
            case "duration":
                draft.duration = trimmed;
                break;
            case "guide":
                draft.guide = trimmed;
                break;
            case "image":
                draft.image = trimmed;
                break;
            case "tags":
                draft.tags = /^none$/i.test(trimmed) ? [] : trimmed.split(",").map((s) => s.trim()).filter(Boolean);
                break;
        }
    }
    const nextIdx = idx + 1;
    if (nextIdx >= s.kind.pendingFields.length) {
        // All fields handled — save directly
        await setSession(chat, null);
        const r = await saveHike(draft);
        if (!r.ok) {
            await setSession(chat, { kind: { type: "hike-new" }, draft, lastMessageId: messageId });
            await sendTelegramMessage(`❌ Couldn't save: ${r.error}\n\nLet's try again. Use /new-hike to restart.`);
            return;
        }
        await sendTelegramMessage(`✅ <b>Hike saved and live on the site.</b>\n<a href="${envConfig.publicSiteUrl}/hikes/${r.id}">${envConfig.publicSiteUrl}/hikes/${r.id}</a>`);
        return;
    }
    // Next field
    await setSession(chat, { ...s, kind: { ...s.kind, draft, currentFieldIndex: nextIdx } });
    const nextField = HIKE_DEFAULTED_FIELDS.find((x) => x.key === s.kind.pendingFields[nextIdx]);
    const nextMsg = nextField.check(draft);
    await sendTelegramMessage(`✅ Saved. Next up:\n\n${nextMsg}\n\nReply with the value, or <code>keep</code> to keep the current value.`);
}
async function handleRentEditPick(chat, text, messageId) {
    const s = await sessionFor(chat);
    if (!s || s.kind.type !== "rent-edit")
        return;
    const items = await listAllEquipment();
    const trimmed = text.trim();
    if (/^(cancel|stop)$/i.test(trimmed)) {
        await setSession(chat, null);
        await sendTelegramMessage("Cancelled. ✋");
        return;
    }
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n < 1 || n > items.length) {
        await sendTelegramMessage(`Reply with a number between 1 and ${items.length}, or /cancel.`);
        return;
    }
    const picked = items[n - 1];
    await setSession(chat, { kind: { type: "rent-edit-field", itemId: picked.id, field: "", partial: {} }, lastMessageId: messageId });
    const rentFieldLines = RENT_EDITABLE_FIELDS.map((f, i) => `${i + 1}. ${f}`).join("\n");
    await sendTelegramMessage(`<b>Editing:</b> ${picked.name} (${picked.type}) — ${picked.location}\n\n` +
        `What would you like to change? Reply with <b>number(s)</b>, comma-separated.\n` +
        `${rentFieldLines}\n\n` +
        `Example: <code>4,5</code> changes location and price. Or /cancel.`);
}
async function handleRentEditField(chat, text, messageId) {
    const s = await sessionFor(chat);
    if (!s || s.kind.type !== "rent-edit-field")
        return;
    const trimmed = text.trim();
    if (/^(cancel|stop)$/i.test(trimmed)) {
        await setSession(chat, null);
        await sendTelegramMessage("Cancelled. ✋");
        return;
    }
    if (!s.kind.field) {
        const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
        const nums = parts.map((p) => Number(p)).filter((n) => Number.isInteger(n));
        if (nums.length === 0 || nums.some((n) => n < 1 || n > RENT_EDITABLE_FIELDS.length)) {
            const rentFieldList = RENT_EDITABLE_FIELDS.map((f, i) => `${i + 1}. ${f}`).join("\n");
            await sendTelegramMessage(`Pick number(s) 1–${RENT_EDITABLE_FIELDS.length}.\n\n${rentFieldList}\n\nExample: <code>4,5</code> changes location and price.`);
            return;
        }
        const requested = nums.map((n) => RENT_EDITABLE_FIELDS[n - 1]);
        const first = requested[0];
        await setSession(chat, { ...s, kind: { ...s.kind, field: first } });
        await sendTelegramMessage(`<b>New ${first}?</b>` + (requested.length > 1 ? ` (After this: ${requested.slice(1).join(", ")})` : "") +
            `\n\nReply with the new value, <code>skip</code>, or /cancel.`);
        return;
    }
    const field = s.kind.field;
    if (/^skip$/i.test(trimmed)) {
        await advanceRentFieldQueue(chat, s, messageId);
        return;
    }
    const update = mapRentFieldToBody(field, trimmed);
    s.kind.partial = { ...s.kind.partial, ...update };
    await advanceRentFieldQueue(chat, s, messageId, field);
}
async function advanceRentFieldQueue(chat, s, messageId, _justSet) {
    if (s.kind.type !== "rent-edit-field")
        return;
    const partial = s.kind.partial;
    if (Object.keys(partial).length === 0) {
        await setSession(chat, null);
        await sendTelegramMessage("No changes made.");
        return;
    }
    const result = await updateRentItem(s.kind.itemId, partial);
    if (!result.ok) {
        await setSession(chat, null);
        await sendTelegramMessage(`❌ Save failed: ${result.error}`);
        return;
    }
    await setSession(chat, { ...s, kind: { ...s.kind, field: "", partial: {} } });
    const lines = Object.keys(partial).map((k) => `• <b>${k}</b>`).join("\n");
    const rentFieldNumList = RENT_EDITABLE_FIELDS.map((f, i) => `${i + 1}. ${f}`).join("\n");
    await sendTelegramMessage(`✅ Updated.\n\n${lines}\n\nWant to change another field? Reply with number(s), or <code>done</code>.\n\n${rentFieldNumList}`);
}
async function handleRentDelete(chat, text, messageId) {
    const s = await sessionFor(chat);
    if (!s || s.kind.type !== "rent-delete")
        return;
    const items = await listAllEquipment();
    const trimmed = text.trim();
    if (/^(cancel|stop)$/i.test(trimmed)) {
        await setSession(chat, null);
        await sendTelegramMessage("Cancelled. ✋");
        return;
    }
    if (trimmed === "all") {
        const ids = items.map((it) => it.id);
        const r = await deleteRentItems(ids);
        await setSession(chat, null);
        await sendTelegramMessage(r.ok ? `🗑 Deleted ${ids.length} items.` : `❌ ${r.error}`);
        return;
    }
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    const nums = parts.map((p) => Number(p)).filter((n) => Number.isInteger(n));
    if (nums.length === 0 || nums.some((n) => n < 1 || n > items.length)) {
        await sendTelegramMessage(`Invalid. There are ${items.length} items. Reply with numbers or 'all'.`);
        return;
    }
    const ids = nums.map((n) => items[n - 1].id);
    const r = await deleteRentItems(ids);
    await setSession(chat, null);
    const names = nums.map((n) => items[n - 1].name).join(", ");
    await sendTelegramMessage(r.ok ? `🗑 Deleted: ${names}` : `❌ ${r.error}`);
}
