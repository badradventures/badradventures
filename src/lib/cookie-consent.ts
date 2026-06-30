// Cookie consent management — UK GDPR & PECR compliant.
//
// What this gives us:
//   - Granular per-category consent (essential, analytics, marketing).
//   - Versioned consent: a stored decision only applies to the policy
//     version it was made under. If we ship a new consent version, the
//     banner re-appears for everyone (even if they previously accepted).
//   - DNT / GPC honour: if the browser signals Global Privacy Control or
//     Do-Not-Track, we record an essential-only decision and don't show
//     the banner.
//   - No fingerprinting, no server-side record. The decision is stored
//     in localStorage only and is per-device.
//   - Helper functions: hasConsented, hasAnalyticsConsent,
//     hasMarketingConsent, isAccepted, clearConsent, onConsentChange.

export const CONSENT_VERSION = "2026-07";

export type ConsentCategory = "essential" | "analytics" | "marketing";

export type ConsentCategories = Record<ConsentCategory, boolean>;

export type ConsentDecision = {
  categories: ConsentCategories;
  timestamp: number;
  version: string;
  method: "banner" | "dnt" | "gpc";
};

const STORAGE_KEY = "badr.cookie-consent";
const CONSENT_EVENT = "zo:consent-updated";

const ALL_OFF: ConsentCategories = {
  essential: true,
  analytics: false,
  marketing: false,
};

function readRaw(): ConsentDecision | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentDecision>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.timestamp !== "number" ||
      typeof parsed.version !== "string" ||
      !parsed.categories
    ) {
      return null;
    }
    return {
      categories: { ...ALL_OFF, ...parsed.categories },
      timestamp: parsed.timestamp,
      version: parsed.version,
      method: parsed.method || "banner",
    };
  } catch {
    return null;
  }
}

function writeRaw(decision: ConsentDecision): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decision));
  } catch {
    // ignore quota / private-mode errors
  }
}

function browserSignalsOptOut(): "dnt" | "gpc" | null {
  if (typeof navigator === "undefined") return null;
  // Global Privacy Control
  // https://globalprivacycontrol.github.io/gpc-spec/
  const gpc =
    (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl;
  if (gpc === true) return "gpc";
  // Do Not Track
  if (navigator.doNotTrack === "1") return "dnt";
  return null;
}

/**
 * Returns the consent decision that should currently be in effect, taking
 * into account:
 *   - A previously stored decision (if it matches the current CONSENT_VERSION)
 *   - Browser DNT/GPC signals (only used if the user has not yet decided)
 *
 * The result is always a non-null ConsentDecision. If the user has not
 * decided and the browser has not signalled, categories are all off
 * (essential-only is implied by being on the safe side).
 */
export function getEffectiveConsent(): ConsentDecision {
  const stored = readRaw();
  if (stored && stored.version === CONSENT_VERSION) {
    return stored;
  }
  const signal = browserSignalsOptOut();
  if (signal) {
    return {
      categories: ALL_OFF,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
      method: signal,
    };
  }
  // No decision yet. The banner will appear; callers should treat the
  // result as "no consent granted".
  return {
    categories: ALL_OFF,
    timestamp: 0,
    version: CONSENT_VERSION,
    method: "banner",
  };
}

export function getConsent(): ConsentDecision | null {
  const stored = readRaw();
  if (!stored) return null;
  if (stored.version !== CONSENT_VERSION) return null;
  return stored;
}

export function setConsent(input: { categories: Partial<ConsentCategories> } | boolean): void {
  if (typeof window === "undefined") return;
  const categories: ConsentCategories =
    typeof input === "boolean"
      ? {
          essential: true,
          analytics: input,
          marketing: input,
        }
      : { ...ALL_OFF, ...input.categories, essential: true };
  const decision: ConsentDecision = {
    categories,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
    method: "banner",
  };
  writeRaw(decision);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function clearConsent(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** True if the user has made a consent decision (accepted or rejected). */
export function hasConsented(): boolean {
  return getConsent() !== null;
}

/** True if analytics cookies are allowed. */
export function hasAnalyticsConsent(): boolean {
  return getEffectiveConsent().categories.analytics === true;
}

/** True if marketing cookies are allowed. */
export function hasMarketingConsent(): boolean {
  return getEffectiveConsent().categories.marketing === true;
}

/**
 * Subscribe to consent changes. Returns an unsubscribe function. The
 * listener fires once on subscription with the current state, then on
 * every change.
 */
export function onConsentChange(
  listener: (decision: ConsentDecision) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener(getEffectiveConsent());
  // Fire once with current state on subscribe (defer to next tick so
  // initial mount effects run first).
  queueMicrotask(handler);
  window.addEventListener(CONSENT_EVENT, handler);
  // Also listen to the `storage` event for cross-tab sync.
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) handler();
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(CONSENT_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}

/**
 * @deprecated Kept for backwards compatibility with existing callers.
 * True if the user has accepted all cookies. Defaults to false if no decision.
 */
export function isAccepted(): boolean {
  const c = getConsent();
  if (!c) return false;
  return c.categories.analytics && c.categories.marketing;
}
