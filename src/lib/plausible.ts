import { useEffect } from "react";
import { getConsent } from "@/lib/cookie-consent";

const PLAUSIBLE_DOMAIN = "badradventures.co.uk";
const PLAUSIBLE_SCRIPT = "https://plausible.io/js/script.js";

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string | number | boolean>; callback?: () => void }) => void;
  }
}

/** Loads Plausible analytics only after the user has accepted cookies.
 *  Re-checks when consent changes via the zo:consent-updated event.
 *  Plausible is cookie-free by default (no GDPR banner needed in EU),
 *  but we gate it behind consent as a matter of transparency. */
export function usePlausible() {
  useEffect(() => {
    function checkConsentAndLoad() {
      const consent = getConsent();
      const accepted = consent?.accepted === true;
      const existing = document.getElementById("plausible-script");

      if (accepted && !existing) {
        const script = document.createElement("script");
        script.id = "plausible-script";
        script.src = PLAUSIBLE_SCRIPT;
        script.setAttribute("data-domain", PLAUSIBLE_DOMAIN);
        script.defer = true;
        document.head.appendChild(script);
      } else if (!accepted && existing) {
        existing.remove();
      }
    }

    checkConsentAndLoad();
    window.addEventListener("zo:consent-updated", checkConsentAndLoad);
    return () => window.removeEventListener("zo:consent-updated", checkConsentAndLoad);
  }, []);
}
