// Minimal structured logger for email transport fallbacks. Writes JSON
// lines to stdout so they show up in Netlify function logs and can be
// filtered (e.g. by Loki). Kept tiny on purpose so the function bundle
// stays small.
type LogRecord = Record<string, unknown>;

export async function logEmailFallback(
  record: LogRecord,
): Promise<void> {
  try {
    console.log(
      JSON.stringify({
        at: new Date().toISOString(),
        kind: "email-fallback",
        ...record,
      }),
    );
  } catch {
    // best effort — never throw from logging
  }
}
