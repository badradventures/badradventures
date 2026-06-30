// Stripe product sync — keeps Stripe products in sync with hikes & equipment.
//
// Every CRUD operation on hikes/equipment (admin API, Telegram bot) should
// call the relevant sync function so Stripe always reflects the latest
// name, description, and price.
//
// Each product carries metadata so we can find it later:
//   badr_kind: "hike" | "equipment"
//   badr_id:   the local DB id
import { createProduct, updateProduct, archiveProduct, findProductByMetadata, isStripeConfigured, } from "./stripe.ts";
// ---------------------------------------------------------------------------
// Hikes
// ---------------------------------------------------------------------------
export async function syncHikeToStripe(hike) {
    if (!isStripeConfigured())
        return {};
    try {
        // Check if this hike already has a product in Stripe
        if (hike.stripe_product_id) {
            const result = await updateProduct({
                productId: hike.stripe_product_id,
                name: hike.title,
                description: `${hike.summary}\n${hike.location} · ${hike.date} · ${hike.duration}`,
                amountPence: hike.price_pence,
            });
            return { productId: hike.stripe_product_id, priceId: result?.priceId };
        }
        // Check by metadata in case we have a product but lost the DB ref
        const existing = await findProductByMetadata("badr_id", hike.id);
        if (existing) {
            const result = await updateProduct({
                productId: existing.id,
                name: hike.title,
                description: `${hike.summary}\n${hike.location} · ${hike.date} · ${hike.duration}`,
                amountPence: hike.price_pence,
            });
            return { productId: existing.id, priceId: result?.priceId };
        }
        // Create new product
        const created = await createProduct({
            name: hike.title,
            description: `${hike.summary}\n${hike.location} · ${hike.date} · ${hike.duration}`,
            amountPence: hike.price_pence,
            metadata: { badr_kind: "hike", badr_id: hike.id },
        });
        return created ? { productId: created.productId, priceId: created.priceId } : {};
    }
    catch (err) {
        console.error("[stripe-sync] syncHikeToStripe failed:", err);
        return {};
    }
}
export async function removeHikeFromStripe(productId, hikeId) {
    if (!isStripeConfigured())
        return false;
    let pid = productId;
    if (!pid && hikeId) {
        const found = await findProductByMetadata("badr_id", hikeId);
        pid = found?.id;
    }
    if (!pid)
        return false;
    return archiveProduct(pid);
}
// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------
export async function syncEquipmentToStripe(item) {
    if (!isStripeConfigured())
        return {};
    try {
        const name = `${item.name} (${item.type})`;
        const desc = `${item.summary}\n${item.location} · ${item.unit_label} · Capacity ${item.capacity}`;
        if (item.stripe_product_id) {
            const result = await updateProduct({
                productId: item.stripe_product_id,
                name,
                description: desc,
                amountPence: item.price_pence,
            });
            return { productId: item.stripe_product_id, priceId: result?.priceId };
        }
        const existing = await findProductByMetadata("badr_id", `equip_${item.id}`);
        if (existing) {
            const result = await updateProduct({
                productId: existing.id,
                name,
                description: desc,
                amountPence: item.price_pence,
            });
            return { productId: existing.id, priceId: result?.priceId };
        }
        const created = await createProduct({
            name,
            description: desc,
            amountPence: item.price_pence,
            metadata: { badr_kind: "equipment", badr_id: `equip_${item.id}` },
        });
        return created ? { productId: created.productId, priceId: created.priceId } : {};
    }
    catch (err) {
        console.error("[stripe-sync] syncEquipmentToStripe failed:", err);
        return {};
    }
}
export async function removeEquipmentFromStripe(productId, equipmentId) {
    if (!isStripeConfigured())
        return false;
    let pid = productId;
    if (!pid && equipmentId) {
        const found = await findProductByMetadata("badr_id", `equip_${equipmentId}`);
        pid = found?.id;
    }
    if (!pid)
        return false;
    return archiveProduct(pid);
}
