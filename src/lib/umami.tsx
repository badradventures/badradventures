// Umami analytics loader — consent-gated.
//
// Behaviour:
//   - Loads the Umami script only when analytics consent is granted.
//   - On consent revocation, removes the script and clears any cached
//     identifiers we can reach (localStorage Umami keys).
//   - Tracks SPA route changes as pageviews (Umami's auto-track is off so
//     we control what gets recorded).
//   - Captures UTM parameters from the URL on first touch and re-attaches
//     them to every pageview so attribution works even though we don't
//     use cookies.
//   - Tracks outbound link clicks for attribution.
//   - Honours the browser's Global Privacy Control signal by not loading
//     the script at all (the consent store handles that decision).

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  hasAnalyticsConsent,
  hasConsented,
} from "@/lib/cookie-consent";

const UTM_STORAGE_KEY = "badr.utm";
const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

function getUmamiUrl(): string {
  if (import.meta.env.VITE_UMAMI_URL) return import.meta.env.VITE_UMAMI_URL;
  if (typeof window !== "undefined" && window.__ENV__?.VITE_UMAMI_URL)
    return window.__ENV__.VITE_UMAMI_URL;
  return "";
}

function getUmamiWebsiteId(): string {
  if (import.meta.env.VITE_UMAMI_WEBSITE_ID) return import.meta.env.VITE_UMAMI_WEBSITE_ID;
  if (typeof window !== "undefined" && window.__ENV__?.VITE_UMAMI_WEBSITE_ID)
    return window.__ENV__.VITE_UMAMI_WEBSITE_ID;
  return "";
}

function readUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const out: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    if (raw) Object.assign(out, JSON.parse(raw));
  } catch {
    // ignore
  }
  return out;
}

function captureUtm(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const incoming: Record<string, string> = {};
  let hasAny = false;
  for (const k of UTM_PARAMS) {
    const v = params.get(k);
    if (v) {
      incoming[k] = v;
      hasAny = true;
    }
  }
  if (!hasAny) return;
  // First-touch attribution: keep the original UTMs and only overwrite if
  // the current visit introduced a new value.
  const existing = readUtm();
  const merged = { ...existing, ...incoming };
  try {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

function clearUmamiStorage(): void {
  if (typeof window === "undefined") return;
  // Umami stores a per-site session id under its own key. Wipe any
  // umami-* keys we find so a user who revokes consent is treated as
  // fresh on the next load.
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (!k) continue;
    const lower = k.toLowerCase();
    if (lower.startsWith("umami") || lower.includes("umami-session")) {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    }
  }
}

function trackOutboundLinks(): () => void {
  if (typeof document === "undefined") return () => {};
  const onClick = (e: MouseEvent) => {
    if (!window.umami) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href) return;
    let url: URL;
    try {
      url = new URL(href, window.location.origin);
    } catch {
      return;
    }
    if (url.host === window.location.host) return;
    window.umami.track("outbound-link-click", {
      host: url.host,
      path: url.pathname,
      text: (anchor.textContent || "").trim().slice(0, 80),
    });
  };
  document.addEventListener("click", onClick, { capture: true });
  return () => document.removeEventListener("click", onClick, { capture: true } as any);
}

export default function UmamiTracker() {
  const location = useLocation();

  // Load / unload the script based on consent.
  useEffect(() => {
    const scriptId = "umami-script";

    function checkAndLoad() {
      const umamiUrl = getUmamiUrl();
      const websiteId = getUmamiWebsiteId();
      const existing = document.getElementById(scriptId);
      const granted = hasAnalyticsConsent() && hasConsented();

      if (granted && !existing && umamiUrl && websiteId) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.defer = true;
        script.src = `${umamiUrl}/script.js`;
        script.setAttribute("data-website-id", websiteId);
        script.setAttribute("data-auto-track", "false");
        script.setAttribute("data-do-not-track", "true");
        script.setAttribute("data-host-url", umamiUrl);
        document.head.appendChild(script);
      } else if (!granted) {
        if (existing) existing.remove();
        clearUmamiStorage();
      }
    }

    captureUtm();
    checkAndLoad();
    window.addEventListener("zo:consent-updated", checkAndLoad);
    return () => window.removeEventListener("zo:consent-updated", checkAndLoad);
  }, []);

  // Track pageviews on SPA route changes.
  useEffect(() => {
    if (!window.umami) return;
    if (!hasAnalyticsConsent()) return;
    const utm = readUtm();
    const timer = setTimeout(() => {
      window.umami?.trackView(window.location.href, document.referrer);
      if (Object.keys(utm).length > 0) {
        window.umami?.track("pageview-with-utm", {
          path: location.pathname,
          ...utm,
        });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  // Outbound link tracking.
  useEffect(() => {
    if (!hasAnalyticsConsent()) return;
    return trackOutboundLinks();
  }, [hasAnalyticsConsent()]);

  return null;
}
