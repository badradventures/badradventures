# Supabase backend for Badr Adventures UK

This folder holds SQL and edge function code that runs in
Supabase itself (not in this Zo site), so the Zo site can rely
on Supabase for the full stack:

- **Database**: tables, views, and RLS policies
- **Auth**: `auth.users` + a `public.profiles` table bridged by
  a trigger (see `01-handle-new-user-trigger.sql`)
- **Edge Functions**: long-running integrations (Telegram bot,
  Stripe webhook, Zo call-zo) that need to run *outside* the
  Zo site so the site can be redeployed without dropping them
- **Storage**: image bucket for hike / equipment photos
  (referenced from the `image` / `hero` columns as URLs)

## Migration order

Run these in order in the Supabase SQL Editor (Dashboard → SQL
→ New query) or via the Supabase CLI:

1. **Schema + RLS** — your existing project already has the
   tables and RLS policies from the original setup. No action
   here unless you need to re-apply.
2. `01-handle-new-user-trigger.sql` — creates the trigger that
   turns an `auth.users` row into a `public.profiles` row, and
   backfills any users that signed up before the trigger
   existed.
3. `02-hike-spots-atomic.sql` — adds atomic
   `decrement_hike_spots` and `increment_hike_spots` RPCs the
   booking flow calls so two concurrent bookings can never
   oversell a hike.

## Wiring this Zo site to Supabase

The site reads from `process.env` on the server and from
`import.meta.env` on the client. The values are set in the
Netlify dashboard under Site settings → Environment variables
(see `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`).

- The **server** uses the service-role key because it does its
  own auth checks (admin gates, ownership checks) instead of
  using RLS-aware sessions. The service-role key must NEVER
  reach the browser.
- The **client** uses the anon key. RLS policies on the tables
  limit what each signed-in user can do. The site calls the
  server's `/api/*` routes for everything (the anon key is
  only used for the sign-in/sign-up round trip and to mint
  the access token that the server then validates).

## Edge Functions

Long-running or webhook-receiving tasks live in
`supabase/functions/` (one folder per function). They run in
Deno, NOT in this Zo site, so:

- They survive redeploys of the Zo site.
- They can be hit by external services (Telegram webhook,
  Stripe webhook) without the Zo site needing to be public.
- They have their own secrets configured under
  `supabase/functions/<name>/.env.local` (or via
  `supabase secrets set`).

See `supabase/functions/README.md` (when added) for the per-
function contracts and deploy commands.

## Storage

A single bucket named `site-assets` holds all images currently
served from the Zo site's `public/images/`. The `image` and
`hero` columns on `hikes` / `equipment` are plain text
columns that store either a `/images/...` path (legacy) or a
public URL from the bucket.

### Bucket setup

Create the bucket (Dashboard → Storage → New bucket):

- **Name**: `site-assets`
- **Public bucket**: ON (the public URL of each object is
  what gets stored in `hikes.image` / `equipment.image`).
- **Allowed MIME types**: `image/jpeg`, `image/png`,
  `image/webp`, `image/gif`, `image/avif`.
- **File size limit**: 1.5 MB (the API caps at 1.4 MB to
  stay under Netlify Functions' default 6 MB request limit
  with JSON + multipart overhead).

Folder layout inside the bucket:

- `site-assets/hikes/<slug>/<timestamp>-<rand>.jpg` — hike
  cover & hero images uploaded from the admin "Add new hike"
  form.
- `site-assets/equipment/<slug>/<timestamp>-<rand>.jpg` —
  equipment images uploaded from "Add new equipment".

The admin "Add new hike" / "Add new equipment" forms upload
via `POST /api/admin/upload` (admin-only) and the returned
public URL is what the form binds to `image` / `hero`.

To migrate an existing image:

```sql
update public.hikes
set image = 'https://<project-ref>.supabase.co/storage/v1/object/public/site-assets/hikes/kinder-scout.jpg'
where id = 'kinder-scout';
```

## Local development

The Zo site reads its Supabase env from the Netlify dashboard
(or a local `.env` if running `netlify dev`). To point at a
different project, update the env vars and reload the dev
server.
