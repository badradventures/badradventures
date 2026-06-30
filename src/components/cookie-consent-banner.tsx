// Cookie consent banner — UK GDPR / PECR compliant.
//
// UX:
//   - First visit: a small bottom banner offers "Accept all" / "Reject
//     all" / "Customise". Customise opens a panel with per-category
//     toggles. Essential is always on and cannot be disabled.
//   - Returning visit: the banner is hidden. The footer "Manage cookies"
//     link dispatches `zo:manage-cookies` to re-open it at any time.
//   - If the policy version changes, the banner re-appears for everyone.
//   - If the browser signals Global Privacy Control (GPC) or
//     Do-Not-Track, we silently record an essential-only decision and
//     don't show the banner — the user has already opted out at the
//     browser level.

import { useEffect, useMemo, useState } from "react";
import { Cookie, Settings2, X } from "lucide-react";
import {
  CONSENT_VERSION,
  getEffectiveConsent,
  hasConsented,
  setConsent,
  type ConsentCategory,
} from "@/lib/cookie-consent";

type Mode = "banner" | "panel";

const CATEGORIES: Array<{
  key: ConsentCategory;
  label: string;
  description: string;
  required?: boolean;
}> = [
  {
    key: "essential",
    label: "Essential",
    description:
      "Authentication, session, cart, and security. These are required for the site to work and cannot be turned off.",
    required: true,
  },
  {
    key: "analytics",
    label: "Analytics",
    description:
      "Anonymous, aggregated usage data (Umami) so we can see which pages are useful and which aren't. No personal data, no cross-site tracking.",
  },
  {
    key: "marketing",
    label: "Marketing",
    description:
      "We don't currently use marketing cookies. This toggle is here in case we ever add ad or remarketing features — it will stay off until you turn it on.",
  },
];

export default function CookieConsentBanner() {
  const [mode, setMode] = useState<Mode>("banner");
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<Record<ConsentCategory, boolean>>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  // Decide whether the banner should appear.
  useEffect(() => {
    function sync() {
      if (hasConsented()) {
        setVisible(false);
        return;
      }
      const effective = getEffectiveConsent();
      setDraft(effective.categories);
      setVisible(true);
    }
    sync();
    window.addEventListener("zo:consent-updated", sync);
    window.addEventListener("zo:manage-cookies", () => {
      setMode("panel");
      setVisible(true);
    });
    return () => {
      window.removeEventListener("zo:consent-updated", sync);
    };
  }, []);

  const acceptAll = () => {
    setConsent({ categories: { essential: true, analytics: true, marketing: true } });
    setVisible(false);
  };
  const rejectAll = () => {
    setConsent({ categories: { essential: true, analytics: false, marketing: false } });
    setVisible(false);
  };
  const saveCustom = () => {
    setConsent({ categories: draft });
    setVisible(false);
    setMode("banner");
  };

  const statusLine = useMemo(
    () => `Consent version ${CONSENT_VERSION} · your choice is stored in this browser only.`,
    [],
  );

  if (!visible) return null;

  if (mode === "panel") {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-panel-title"
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6"
      >
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-2xl">
          <div className="flex items-start justify-between border-b border-ink/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine/10 text-pine">
                <Settings2 className="h-4 w-4" />
              </span>
              <div>
                <h2 id="cookie-panel-title" className="font-display text-lg font-semibold text-ink">
                  Cookie preferences
                </h2>
                <p className="text-xs text-ink-3">{statusLine}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setVisible(false);
                setMode("banner");
              }}
              className="rounded-full p-2 text-ink-3 hover:bg-ink/5 hover:text-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
            <p className="text-sm text-ink-2">
              We use cookies and similar technologies. You can choose which
              categories to allow. Your choice is stored in this browser only and
              you can change it at any time from the footer's "Manage cookies"
              link.
            </p>
            <div className="mt-5 space-y-3">
              {CATEGORIES.map((cat) => {
                const checked = draft[cat.key];
                return (
                  <div
                    key={cat.key}
                    className="flex items-start justify-between gap-4 rounded-xl border border-ink/10 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{cat.label}</span>
                        {cat.required && (
                          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-2">
                            Always on
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-ink-2">{cat.description}</p>
                    </div>
                    <label className="relative inline-flex shrink-0 cursor-pointer items-center pt-1">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={checked}
                        disabled={cat.required}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, [cat.key]: e.target.checked }))
                        }
                      />
                      <span
                        className={
                          "h-6 w-11 rounded-full border border-ink/15 transition " +
                          (checked ? "bg-pine" : "bg-ink/10") +
                          (cat.required ? " opacity-60" : "")
                        }
                      />
                      <span
                        className={
                          "absolute left-0.5 top-[5px] h-5 w-5 rounded-full bg-paper shadow transition " +
                          (checked ? "translate-x-5" : "translate-x-0")
                        }
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-ink/10 bg-paper-2/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium text-ink-2 transition hover:border-pine hover:text-pine"
            >
              Reject all
            </button>
            <button
              type="button"
              onClick={saveCustom}
              className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium text-ink-2 transition hover:border-pine hover:text-pine"
            >
              Save preferences
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-full bg-pine px-4 py-1.5 text-sm font-medium text-amber-200 shadow-sm transition hover:bg-pine-2"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-ink/10 bg-paper shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
          <Cookie className="h-4 w-4" />
        </span>
        <p className="flex-1 text-sm text-ink-2 leading-relaxed">
          We use essential cookies so you can sign in, book hikes, and use the
          site properly. With your permission we'll also use anonymous
          analytics to understand what's working. You decide.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="/cookies"
            className="whitespace-nowrap rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium text-ink-2 transition hover:border-pine hover:text-pine"
          >
            View cookies
          </a>
          <button
            type="button"
            onClick={() => setMode("panel")}
            className="whitespace-nowrap rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium text-ink-2 transition hover:border-pine hover:text-pine"
          >
            Customise
          </button>
          <button
            type="button"
            onClick={rejectAll}
            className="whitespace-nowrap rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium text-ink-2 transition hover:border-pine hover:text-pine"
          >
            Reject all
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="whitespace-nowrap rounded-full bg-pine px-4 py-1.5 text-sm font-medium text-amber-200 shadow-sm transition hover:bg-pine-2"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
