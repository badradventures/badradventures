// Global ambient declarations shared across the app. Keep this file
// minimal: only types that are not provided by installed packages.

export {};

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number | boolean>) => void;
      trackView: (url?: string, referrer?: string) => void;
      identify: (id: string, data?: Record<string, string | number | boolean>) => void;
    };
    __ENV__?: Record<string, string>;
    dataLayer?: unknown[];
  }
}
