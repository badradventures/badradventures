import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Minus,
  Moon,
  Plus,
  ShoppingBag,
  Tent,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { api, formatGbp } from "@/lib/api";
import { useAuth } from "@/components/site-shell";
import { useCart, type CartItem } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { usePageSeo } from "@/lib/seo";

const TYPE_ICONS: Record<string, typeof Tent> = {
  hike: Tent,
  equipment: Tent,
};

const TYPE_LABELS: Record<string, string> = {
  hike: "Hike",
  equipment: "Rental",
};

export default function CartPage() {
  usePageSeo({ path: '/cart', title: 'Your cart', description: 'Review your hikes and rental gear before checkout.', noindex: true });
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, totalPence, itemCount } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function handleCheckout() {
    if (!user) {
      navigate("/sign-in?next=/cart");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        items: items.map((i) => {
          const base: Record<string, unknown> = {
            kind: i.kind,
            id: i.itemId,
            quantity: i.quantity,
          };
          if (i.kind === "equipment") {
            base.startDate = i.startDate;
            base.endDate = i.endDate;
          }
          return base;
        }),
      };
      const res = await api<{ checkoutUrl: string; sessionId: string; bookingIds: string[] }>(
        "/api/cart/checkout",
        { method: "POST", body: JSON.stringify(body) },
      );
      if (res.checkoutUrl) {
        clearCart();
        window.location.href = res.checkoutUrl;
      } else {
        toast.error("Checkout response missing URL.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  function groupLabel(item: CartItem): string {
    if (item.kind === "hike") return "Hikes";
    return "Rentals";
  }

  // Group items by kind
  const hikeItems = items.filter((i) => i.kind === "hike");
  const equipmentItems = items.filter((i) => i.kind === "equipment");

  return (
    <div className="font-body">
      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-ink/10 bg-paper py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-topo" />
        <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
            · {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? "s" : ""}` : "Empty cart"}
          </span>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Your{" "}
            <em className="text-rust">cart</em>.
          </h1>
          <p className="mt-3 max-w-xl text-ink/70">
            Review what you're booking before heading to checkout. Items are
            reserved in real-time when you pay.
          </p>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="py-20">
          <div className="mx-auto max-w-xl px-6 text-center sm:px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-ink/15 bg-paper-deep">
              <ShoppingBag className="h-7 w-7 text-rust" />
            </div>
            <h2 className="mt-6 font-display text-3xl font-semibold text-ink">
              Nothing here yet
            </h2>
            <p className="mt-2 text-ink/70">
              Add hikes or rental equipment to your cart and come back here
              when you're ready to check out.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/hikes"
                className="inline-flex items-center gap-2 rounded-full bg-pine px-6 py-3 text-sm font-medium text-amber-200 transition hover:bg-pine-light"
              >
                Browse hikes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/rent"
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-6 py-3 text-sm font-medium text-ink-2 transition hover:border-pine hover:text-pine"
              >
                Browse rentals
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[1fr_380px] lg:px-10">
          {/* CART ITEMS */}
          <div className="space-y-8">
            {hikeItems.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">
                  Hikes
                  <Badge className="ml-2 align-middle bg-pine/15 text-pine font-mono text-[10px] tracking-wider">
                    {hikeItems.length}
                  </Badge>
                </h2>
                <div className="mt-4 space-y-3">
                  {hikeItems.map((item) => (
                    <CartItemRow
                      key={item.uid}
                      item={item}
                      onRemove={() => removeItem(item.uid)}
                      onQuantityChange={(q) => updateQuantity(item.uid, q)}
                    />
                  ))}
                </div>
              </div>
            )}

            {equipmentItems.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">
                  Rentals
                  <Badge className="ml-2 align-middle bg-pine/15 text-pine font-mono text-[10px] tracking-wider">
                    {equipmentItems.length}
                  </Badge>
                </h2>
                <div className="mt-4 space-y-3">
                  {equipmentItems.map((item) => (
                    <CartItemRow
                      key={item.uid}
                      item={item}
                      onRemove={() => removeItem(item.uid)}
                      onQuantityChange={(q) => updateQuantity(item.uid, q)}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                clearCart();
                toast.success("Cart cleared");
              }}
              className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-rust transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all items
            </button>
          </div>

          {/* SIDEBAR — ORDER SUMMARY */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="paper-card rounded-xl p-6 space-y-5">
              <h3 className="font-display text-lg font-semibold text-ink">
                Order summary
              </h3>

              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.uid} className="flex justify-between text-ink-2">
                    <span className="truncate max-w-[200px]">
                      {item.title}
                      {item.nights ? ` · ${item.nights} night${item.nights > 1 ? "s" : ""}` : ""}
                      {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                    </span>
                    <span className="shrink-0 ml-2">
                      {formatGbp(item.pricePence * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="bg-ink/10" />

              <div className="flex justify-between font-display text-xl font-semibold text-ink">
                <span>Total</span>
                <span>{formatGbp(totalPence)}</span>
              </div>

              {!user && (
                <div className="rounded-md border border-amber-200/60 bg-amber-50 p-3 text-xs text-amber-900">
                  <TriangleAlert className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                  You'll need to{" "}
                  <Link to="/sign-in?next=/cart" className="font-semibold underline">
                    sign in
                  </Link>{" "}
                  or{" "}
                  <Link to="/sign-up?next=/cart" className="font-semibold underline">
                    create an account
                  </Link>{" "}
                  to complete checkout.
                </div>
              )}

              <Button
                onClick={handleCheckout}
                disabled={submitting || items.length === 0}
                className="w-full bg-pine hover:bg-pine-light text-amber-200"
                size="lg"
              >
                {submitting ? (
                  "Processing…"
                ) : (
                  <>
                    Proceed to checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-[10px] font-mono uppercase tracking-[0.18em] text-ink-3">
                Payment secured by Stripe
              </p>
            </div>
          </aside>
        </section>
      )}

      {/* FOOTNOTE */}
      <section className="border-t border-ink/10 bg-paper-deep/40 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 text-xs font-mono uppercase tracking-[0.22em] text-ink-3 sm:px-8 lg:px-10">
          <span>Cart · Badr Adventures UK</span>
          <span>
            {itemCount} item{itemCount !== 1 ? "s" : ""} ·{" "}
            {formatGbp(totalPence)}
          </span>
        </div>
      </section>
    </div>
  );
}

function CartItemRow({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: CartItem;
  onRemove: () => void;
  onQuantityChange: (q: number) => void;
}) {
  const Icon = TYPE_ICONS[item.kind] ?? Tent;

  return (
    <div className="paper-card overflow-hidden rounded-xl">
      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        {/* Thumbnail */}
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-stone-100 sm:h-24 sm:w-28">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-400">
              <Icon className="h-7 w-7" />
            </div>
          )}
          <div className="absolute left-1 top-1">
            <Badge className="bg-paper/90 text-[9px] font-mono text-ink-2 capitalize px-1.5 py-0.5">
              {TYPE_LABELS[item.kind] ?? item.kind}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link
                to={item.kind === "hike" ? `/hikes/${item.itemId}` : `/rent`}
                className="font-display text-base font-semibold text-ink hover:text-pine transition truncate"
              >
                {item.title}
              </Link>
              <button
                type="button"
                onClick={onRemove}
                className="shrink-0 text-ink-3 hover:text-rust transition"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {item.nights ? (
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-3">
                <CalendarDays className="h-3 w-3" />
                <span>
                  {item.startDate} → {item.endDate}
                </span>
                <span className="text-ink-2/50">·</span>
                <span>{item.nights} night{item.nights > 1 ? "s" : ""}</span>
              </div>
            ) : null}

            {item.unitLabel && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-3">
                <Moon className="h-3 w-3" />
                <span>{item.unitLabel}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Quantity */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
                disabled={item.quantity <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink-2 hover:border-pine hover:text-pine transition disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-6 text-center font-mono text-sm text-ink">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantityChange(item.quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-ink-2 hover:border-pine hover:text-pine transition"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="font-display text-base font-semibold text-ink">
                {formatGbp(item.pricePence * item.quantity)}
              </div>
              {item.quantity > 1 && (
                <div className="text-[10px] font-mono text-ink-3">
                  {formatGbp(item.pricePence)} each
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}