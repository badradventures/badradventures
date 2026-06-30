// Lightweight Web Vitals reporter. Sends Core Web Vitals to Umami as
// custom events. Only runs if analytics consent is granted.
//
// Reports LCP, FCP, CLS, INP, and TTFB. No external dependencies.

import { isAccepted } from "./cookie-consent";

type Metric = { name: string; value: number; id: string };

const sent = new Set<string>();

function safeSend(name: string, value: number) {
  if (!isAccepted()) return;
  if (typeof window === "undefined" || !window.umami?.track) return;
  const id = `${name}-${Math.round(value)}`;
  if (sent.has(id)) return;
  sent.add(id);
  try {
    window.umami.track("web-vital", { name, value: Math.round(value) });
  } catch {
    // ignore
  }
}

function initLcp() {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    let largest = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const size = (entry as PerformanceEntry & { renderTime?: number; loadTime?: number; startTime?: number }).renderTime
          || (entry as PerformanceEntry & { loadTime?: number }).loadTime
          || entry.startTime
          || 0;
        if (size > largest) largest = size;
      }
    });
    po.observe({ type: "largest-contentful-paint", buffered: true });
    addEventListener("beforeunload", () => safeSend("lcp", largest), { once: true });
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") safeSend("lcp", largest);
    });
  } catch {
    // ignore
  }
}

function initFcp() {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          safeSend("fcp", entry.startTime);
        }
      }
    });
    po.observe({ type: "paint", buffered: true });
  } catch {
    // ignore
  }
}

function initCls() {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    let cls = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput?: boolean }>) {
        if (!entry.hadRecentInput) cls += entry.value;
      }
    });
    po.observe({ type: "layout-shift", buffered: true });
    addEventListener("beforeunload", () => safeSend("cls", cls * 10000), { once: true });
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") safeSend("cls", cls * 10000);
    });
  } catch {
    // ignore
  }
}

function initInp() {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    let worst = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { duration: number }>) {
        if (entry.duration > worst) worst = entry.duration;
      }
    });
    // event-timing covers INP since Chrome 96
    po.observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    addEventListener("beforeunload", () => safeSend("inp", worst), { once: true });
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") safeSend("inp", worst);
    });
  } catch {
    // ignore — not all browsers support event-timing
  }
}

function initTtfb() {
  if (typeof performance === "undefined") return;
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return;
    const ttfb = nav.responseStart - nav.requestStart;
    if (ttfb > 0) safeSend("ttfb", ttfb);
  } catch {
    // ignore
  }
}

let started = false;

/** Start observing Web Vitals. Idempotent. */
export function startWebVitals() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!isAccepted()) return;
  // Defer so the analytics script has a chance to load.
  setTimeout(() => {
    initLcp();
    initFcp();
    initCls();
    initInp();
    initTtfb();
  }, 0);
}

export type { Metric };
