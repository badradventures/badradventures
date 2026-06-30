// Lightweight Stripe REST helper. Avoids depending on the official SDK so the
// project stays small. Only the endpoints we need are implemented.
const STRIPE_API = "https://api.stripe.com/v1";
export class StripeError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
function basicAuthHeader() {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key)
        throw new StripeError(503, "Stripe is not configured.");
    return { Authorization: `Basic ${btoa(key + ":")}` };
}
async function stripePost(path, body) {
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(body))
        form.append(k, v);
    const res = await fetch(`${STRIPE_API}${path}`, {
        method: "POST",
        headers: { ...basicAuthHeader(), "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
    });
    const text = await res.text();
    if (!res.ok) {
        throw new StripeError(res.status, text || `Stripe error ${res.status}`);
    }
    return JSON.parse(text);
}
async function stripePostSafe(path, body) {
    try {
        return await stripePost(path, body);
    }
    catch {
        return null;
    }
}
async function stripeGet(path) {
    const res = await fetch(`${STRIPE_API}${path}`, { headers: basicAuthHeader() });
    const text = await res.text();
    if (!res.ok) {
        throw new StripeError(res.status, text || `Stripe error ${res.status}`);
    }
    return JSON.parse(text);
}
export function isStripeConfigured() {
    return Boolean(Deno.env.get("STRIPE_SECRET_KEY"));
}
export async function createCheckoutSession(args) {
    return stripePost("/checkout/sessions", {
        "payment_method_types[0]": "card",
        mode: "payment",
        "line_items[0][price_data][currency]": "gbp",
        "line_items[0][price_data][unit_amount]": String(args.amountPence),
        "line_items[0][price_data][product_data][name]": args.hikeTitle,
        "line_items[0][quantity]": "1",
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        customer_email: args.customerEmail,
        ...Object.fromEntries(Object.entries(args.metadata).map(([k, v]) => [`metadata[${k}]`, v])),
    });
}
export async function retrieveCheckoutSession(id) {
    return stripeGet(`/checkout/sessions/${id}`);
}
export async function createCartCheckoutSession(args) {
    const form = new URLSearchParams();
    form.append("mode", "payment");
    form.append("success_url", args.successUrl);
    form.append("cancel_url", args.cancelUrl);
    form.append("customer_email", args.customerEmail);
    for (const [k, v] of Object.entries(args.metadata)) {
        form.append(`metadata[${k}]`, v);
    }
    for (let i = 0; i < args.lineItems.length; i++) {
        form.append(`line_items[${i}][price]`, args.lineItems[i].price);
        form.append(`line_items[${i}][quantity]`, String(args.lineItems[i].quantity));
    }
    return stripePost("/checkout/sessions", form);
}
// Lightweight Stripe webhook signature verifier (HMAC SHA-256 over
// `${timestamp}.${body}`). Returns true when the signature is valid.
export async function verifyStripeSignature(body, header, secret) {
    const parts = header.split(",").reduce((acc, part) => {
        const [k, v] = part.split("=");
        if (k && v)
            acc[k] = v;
        return acc;
    }, {});
    const t = parts["t"];
    const v1 = parts["v1"];
    if (!t || !v1)
        return false;
    const expected = await hmacSha256Hex(secret, `${t}.${body}`);
    return timingSafeEqual(expected, v1);
}
async function hmacSha256Hex(secret, message) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
    return Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}
function timingSafeEqual(a, b) {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}
/** Create a Stripe product with a single price (in pence). Returns { productId, priceId } or null. */
export async function createProduct(args) {
    if (!isStripeConfigured())
        return null;
    try {
        const product = await stripePost("/products", {
            name: args.name,
            description: args.description,
            ...Object.fromEntries(Object.entries(args.metadata).map(([k, v]) => [`metadata[${k}]`, v])),
        });
        const price = await stripePost("/prices", {
            product: product.id,
            currency: "gbp",
            unit_amount: String(args.amountPence),
        });
        await stripePost("/products/" + product.id, {
            default_price: price.id,
        });
        return { productId: product.id, priceId: price.id };
    }
    catch (err) {
        console.error("[stripe] createProduct failed:", err);
        return null;
    }
}
/** Update product name/description and optionally replace the price if the amount changed. */
export async function updateProduct(args) {
    if (!isStripeConfigured())
        return null;
    try {
        const body = {};
        if (args.name !== undefined)
            body.name = args.name;
        if (args.description !== undefined)
            body.description = args.description;
        if (args.amountPence !== undefined) {
            const current = await stripeGet("/products/" + args.productId);
            if (current.default_price) {
                const oldPrice = await stripeGet("/prices/" + current.default_price);
                if (oldPrice.unit_amount === args.amountPence && oldPrice.active) {
                    if (Object.keys(body).length > 0)
                        await stripePost("/products/" + args.productId, body);
                    return { priceId: oldPrice.id };
                }
            }
            const newPrice = await stripePost("/prices", {
                product: args.productId,
                currency: "gbp",
                unit_amount: String(args.amountPence),
            });
            body.default_price = newPrice.id;
        }
        if (Object.keys(body).length > 0) {
            await stripePost("/products/" + args.productId, body);
        }
        return {};
    }
    catch (err) {
        console.error("[stripe] updateProduct failed:", err);
        return null;
    }
}
/** Archive a Stripe product (active=false) along with its prices. */
export async function archiveProduct(productId) {
    if (!isStripeConfigured())
        return false;
    try {
        const prices = await stripeGet("/prices?product=" + productId + "&active=true");
        for (const price of prices.data ?? []) {
            await stripePostSafe("/prices/" + price.id, { active: "false" });
        }
        await stripePost("/products/" + productId, { active: "false" });
        return true;
    }
    catch (err) {
        console.error("[stripe] archiveProduct failed:", err);
        return false;
    }
}
/** Reactivate a previously archived Stripe product. */
export async function reactivateProduct(productId) {
    if (!isStripeConfigured())
        return false;
    try {
        await stripePost("/products/" + productId, { active: "true" });
        return true;
    }
    catch (err) {
        console.error("[stripe] reactivateProduct failed:", err);
        return false;
    }
}
/** Find a Stripe product by metadata key:value. Returns the first matching active product, or null. */
export async function findProductByMetadata(key, value) {
    if (!isStripeConfigured())
        return null;
    try {
        const res = await stripeGet(`/products?active=true&limit=100`);
        return res.data?.find((p) => p.metadata?.[key] === value) ?? null;
    }
    catch (err) {
        console.error("[stripe] findProductByMetadata failed:", err);
        return null;
    }
}
