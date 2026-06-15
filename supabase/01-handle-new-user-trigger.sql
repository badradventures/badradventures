-- Trigger: auto-create a profile row when a user signs up in
-- Supabase Auth, and keep the profile.is_admin flag in sync with
-- raw_app_meta_data.is_admin (so admin status can be set/unset from
-- either Supabase Auth or the Badr admin UI without losing it).
--
-- Run this in Supabase SQL Editor. It's idempotent.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_is_admin boolean;
begin
  v_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    split_part(new.email, '@', 1)
  );
  v_is_admin := coalesce(
    (new.raw_user_meta_data->>'is_admin')::boolean,
    (new.raw_app_meta_data->>'is_admin')::boolean,
    false
  );
  insert into public.profiles (id, email, name, is_admin, created_at)
  values (new.id, new.email, v_name, v_is_admin, now())
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name;
  -- We deliberately do NOT overwrite is_admin on subsequent signups
  -- so the admin UI flag isn't reset by metadata changes.
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create or update profile rows for any users that signed up
-- before the trigger existed, or whose name was set to the email prefix.
insert into public.profiles (id, email, name, created_at)
select
  u.id,
  u.email,
  coalesce(
    nullif(u.raw_user_meta_data->>'name', ''),
    nullif(u.raw_user_meta_data->>'full_name', ''),
    split_part(u.email, '@', 1)
  ),
  u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
