import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { setConsent, clearConsent, getConsent } from "@/lib/cookie-consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => getConsent() === null);

  useEffect(() => {
    function show() {
      setVisible(true);
    }
    window.addEventListener("zo:manage-cookies", show);
    return () => window.removeEventListener("zo:manage-cookies", show);
  }, []);

  function handleAccept() {
    setConsent(true);
    setVisible(false);
    window.dispatchEvent(new Event("zo:consent-updated"));
  }

  function handleReject() {
    setConsent(false);
    setVisible(false);
    window.dispatchEvent(new Event("zo:consent-updated"));
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-ink/10 bg-paper shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
          <Cookie className="h-4 w-4" />
        </span>
        <p className="flex-1 text-sm text-ink-2 leading-relaxed">
          This site uses essential cookies so you can sign in, book hikes, and use the site
          properly. We don't use analytics, marketing, or tracking cookies.
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
            onClick={handleReject}
            className="whitespace-nowrap rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium text-ink-2 transition hover:border-pine hover:text-pine"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="whitespace-nowrap rounded-full bg-pine px-4 py-1.5 text-sm font-medium text-amber-200 shadow-sm transition hover:bg-pine-2"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-3 hover:bg-ink/5 hover:text-ink"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
