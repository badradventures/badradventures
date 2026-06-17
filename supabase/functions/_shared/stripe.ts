// Lightweight Stripe REST helper. Avoids depending on the official SDK so the
// project stays small. Only the endpoints we need are implemented.

const STRIPE_API = "https://api.stripe.com/v1";

export class StripeError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function basicAuthHeader(): Record<string, string> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new StripeError(503, "Stripe is not configured.");
  return { Authorization: `Basic ${Buffer.from(key + ":").toString("base64")}` };
}

async function stripePost<T>(path: string, body: Record<string, string> | URLSearchParams): Promise<T> {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) form.append(k, v);
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: { ...basicAuthHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new StripeError(res.status, text || `Stripe error ${res.status}`);
  }
  return JSON.parse(text) as T;
}

async function stripePostSafe<T>(path: string, body: Record<string, string>): Promise<T | null> {
  try { return await stripePost<T>(path, body); } catch { return null; }
}

async function stripeGet<T>(path: string): Promise<T> {
  const res = await fetch(`${STRIPE_API}${path}`, { headers: basicAuthHeader() });
  const text = await res.text();
  if (!res.ok) {
    throw new StripeError(res.status, text || `Stripe error ${res.status}`);
  }
  return JSON.parse(text) as T;
}

export type StripeCheckoutSession = {
  id: string;
  url: string;
  amount_total: number | null;
  payment_status: string;
  customer_email: string | null;
  metadata: Record<string, string>;
};

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function createCheckoutSession(args: {
  hikeTitle: string;
  amountPence: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  metadata: Record<string, string>;
}): Promise<StripeCheckoutSession> {
  return stripePost<StripeCheckoutSession>("/checkout/sessions", {
    "payment_method_types[0]": "card",
    mode: "payment",
    "line_items[0][price_data][currency]": "gbp",
    "line_items[0][price_data][unit_amount]": String(args.amountPence),
    "line_items[0][price_data][product_data][name]": args.hikeTitle,
    "line_items[0][quantity]": "1",
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    customer_email: args.customerEmail,
    ...Object.fromEntries(
      Object.entries(args.metadata).map(([k, v]) => [`metadata[${k}]`, v]),
    ),
  });
}

export async function retrieveCheckoutSession(
  id: string,
): Promise<StripeCheckoutSession> {
  return stripeGet<StripeCheckoutSession>(`/checkout/sessions/${id}`);
}

export async function createCartCheckoutSession(args: {
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  lineItems: Array<{
    price: string;
    quantity: number;
  }>;
  metadata: Record<string, string>;
}): Promise<StripeCheckoutSession> {
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
  return stripePost<StripeCheckoutSession>("/checkout/sessions", form);
}

// Lightweight Stripe webhook signature verifier (HMAC SHA-256 over
// `${timestamp}.${body}`). Returns true when the signature is valid.
export async function verifyStripeSignature(
  body: string,
  header: string,
  secret: string,
): Promise<boolean> {
  const parts = header.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {});
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  const expected = await hmacSha256Hex(secret, `${t}.${body}`);
  return timingSafeEqual(expected, v1);
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Product CRUD (for syncing hikes & equipment to Stripe Products)
// ---------------------------------------------------------------------------

export type StripeProduct = {
  id: string;
  name: string;
  active: boolean;
  metadata: Record<string, string>;
  default_price?: string | null;
  description?: string | null;
};

export type StripePrice = {
  id: string;
  product: string;
  active: boolean;
  unit_amount: number | null;
  currency: string;
};

/** Create a Stripe product with a single price (in pence). Returns { productId, priceId } or null. */
export async function createProduct(args: {
  name: string;
  description: string;
  amountPence: number;
  metadata: Record<string, string>;
}): Promise<{ productId: string; priceId: string } | null> {
  if (!isStripeConfigured()) return null;
  try {
    const product = await stripePost<StripeProduct>("/products", {
      name: args.name,
      description: args.description,
      ...Object.fromEntries(
        Object.entries(args.metadata).map(([k, v]) => [`metadata[${k}]`, v]),
      ),
    });
    const price = await stripePost<StripePrice>("/prices", {
      product: product.id,
      currency: "gbp",
      unit_amount: String(args.amountPence),
    });
    await stripePost<StripeProduct>("/products/" + product.id, {
      default_price: price.id,
    });
    return { productId: product.id, priceId: price.id };
  } catch (err) {
    console.error("[stripe] createProduct failed:", err);
    return null;
  }
}

/** Update product name/description and optionally replace the price if the amount changed. */
export async function updateProduct(args: {
  productId: string;
  name?: string;
  description?: string;
  amountPence?: number;
}): Promise<{ priceId?: string } | null> {
  if (!isStripeConfigured()) return null;
  try {
    const body: Record<string, string> = {};
    if (args.name !== undefined) body.name = args.name;
    if (args.description !== undefined) body.description = args.description;

    if (args.amountPence !== undefined) {
      const current = await stripeGet<StripeProduct>("/products/" + args.productId);
      if (current.default_price) {
        const oldPrice = await stripeGet<StripePrice>("/prices/" + current.default_price);
        if (oldPrice.unit_amount === args.amountPence && oldPrice.active) {
          if (Object.keys(body).length > 0) await stripePost<StripeProduct>("/products/" + args.productId, body);
          return { priceId: oldPrice.id };
        }
      }
      const newPrice = await stripePost<StripePrice>("/prices", {
        product: args.productId,
        currency: "gbp",
        unit_amount: String(args.amountPence),
      });
      body.default_price = newPrice.id;
    }

    if (Object.keys(body).length > 0) {
      await stripePost<StripeProduct>("/products/" + args.productId, body);
    }
    return {};
  } catch (err) {
    console.error("[stripe] updateProduct failed:", err);
    return null;
  }
}

/** Archive a Stripe product (active=false) along with its prices. */
export async function archiveProduct(productId: string): Promise<boolean> {
  if (!isStripeConfigured()) return false;
  try {
    const prices = await stripeGet<{ data: StripePrice[] }>("/prices?product=" + productId + "&active=true");
    for (const price of prices.data ?? []) {
      await stripePostSafe<StripePrice>("/prices/" + price.id, { active: "false" });
    }
    await stripePost<StripeProduct>("/products/" + productId, { active: "false" });
    return true;
  } catch (err) {
    console.error("[stripe] archiveProduct failed:", err);
    return false;
  }
}

/** Reactivate a previously archived Stripe product. */
export async function reactivateProduct(productId: string): Promise<boolean> {
  if (!isStripeConfigured()) return false;
  try {
    await stripePost<StripeProduct>("/products/" + productId, { active: "true" });
    return true;
  } catch (err) {
    console.error("[stripe] reactivateProduct failed:", err);
    return false;
  }
}

/** Find a Stripe product by metadata key:value. Returns the first matching active product, or null. */
export async function findProductByMetadata(key: string, value: string): Promise<StripeProduct | null> {
  if (!isStripeConfigured()) return null;
  try {
    const res = await stripeGet<{ data: StripeProduct[] }>(`/products?active=true&limit=100`);
    return res.data?.find((p) => p.metadata?.[key] === value) ?? null;
  } catch (err) {
    console.error("[stripe] findProductByMetadata failed:", err);
    return null;
  }
}