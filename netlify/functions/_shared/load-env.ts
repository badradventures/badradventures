// Loads .env / .env.local files into process.env on cold start so that
// the Netlify function picks up secrets the user prefers to keep out of
// the dashboard (or — more importantly — so the function works locally
// via `netlify dev`).
//
// Netlify Functions run on AWS Lambda under Node.js. By the time this
// module is imported, Netlify's own environment-variable injection has
// already happened (Function env vars + process.env are populated), so
// we only fill in anything *not* already set. That way the dashboard is
// the source of truth for production, and `.env` only fills gaps for
// local dev.
//
// Imported as a side-effect from api.ts.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());

// Parse a .env-style file. Handles quotes, comments, and empty lines.
function parseDotEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

async function loadEnvFile(path: string): Promise<void> {
  if (!existsSync(path)) return;
  try {
    const text = await readFile(path, "utf8");
    const parsed = parseDotEnv(text);
    // Never overwrite values Netlify already injected.
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === undefined || process.env[k] === "") {
        process.env[k] = v;
      }
    }
  } catch (err) {
    console.warn(`[load-env] failed to read ${path}:`, err);
  }
}

// .env.local takes priority over .env (matches Vite/Next convention).
await loadEnvFile(resolve(ROOT, ".env.local"));
await loadEnvFile(resolve(ROOT, ".env"));
