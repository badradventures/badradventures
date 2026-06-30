import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getConsent } from "@/lib/cookie-consent";

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number>) => void;
      trackView: (url?: string, referrer?: string) => void;
    };
    __ENV__?: Record<string, string>;
  }
}

function getUmamiUrl(): string {
  if (import.meta.env.VITE_UMAMI_URL) return import.meta.env.VITE_UMAMI_URL;
  if (typeof window !== "undefined" && window.__ENV__?.VITE_UMAMI_URL) return window.__ENV__.VITE_UMAMI_URL;
  return "";
}

function getUmamiWebsiteId(): string {
  if (import.meta.env.VITE_UMAMI_WEBSITE_ID) return import.meta.env.VITE_UMAMI_WEBSITE_ID;
  if (typeof window !== "undefined" && window.__ENV__?.VITE_UMAMI_WEBSITE_ID) return window.__ENV__.VITE_UMAMI_WEBSITE_ID;
  return "";
}

export default function UmamiTracker() {
  const location = useLocation();

  // Load script once when consent is given
  useEffect(() => {
    const scriptId = "umami-script";

    function checkAndLoad() {
      const consent = getConsent();
      const accepted = consent?.accepted === true;
      const existing = document.getElementById(scriptId);
      const umamiUrl = getUmamiUrl();
      const websiteId = getUmamiWebsiteId();

      if (accepted && !existing && umamiUrl && websiteId) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.defer = true;
        script.src = `${umamiUrl}/script.js`;
        script.setAttribute("data-website-id", websiteId);
        script.setAttribute("data-auto-track", "false");
        script.setAttribute("data-do-not-track", "true");
        document.head.appendChild(script);
      } else if (!accepted && existing) {
        existing.remove();
      }
    }

    checkAndLoad();
    window.addEventListener("zo:consent-updated", checkAndLoad);
    return () => window.removeEventListener("zo:consent-updated", checkAndLoad);
  }, []);

  // Track page views on route changes (SPA support)
  useEffect(() => {
    if (!window.umami) return;
    const consent = getConsent();
    if (consent?.accepted !== true) return;
    const timer = setTimeout(() => {
      window.umami?.trackView(window.location.href, document.referrer);
    }, 300);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
}
