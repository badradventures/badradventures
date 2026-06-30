// Cookie consent management — UK GDPR & PECR compliant.
// Stores consent decision in localStorage with timestamp and policy version.
// The site only uses essential cookies (Supabase session), so "rejected" state
// simply means no non-essential third-party requests should fire.

const STORAGE_KEY = "badr.cookie-consent";
export const CONSENT_VERSION = "2026-06"; // bump when policy changes

export type ConsentDecision = {
  accepted: boolean; // true = all; false = essential only
  timestamp: number;
  version: string; // which policy version this applies to
};

export function getConsent(): ConsentDecision | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentDecision;
  } catch {
    return null;
  }
}

export function setConsent(accepted: boolean): void {
  if (typeof window === "undefined") return;
  const decision: ConsentDecision = {
    accepted,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decision));
}

export function clearConsent(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** True if the user has made a consent decision (either accepted or rejected). */
export function hasConsented(): boolean {
  return getConsent() !== null;
}

/** True if the user has accepted all cookies. Defaults to false if no decision. */
export function isAccepted(): boolean {
  const c = getConsent();
  return c !== null && c.accepted;
}
