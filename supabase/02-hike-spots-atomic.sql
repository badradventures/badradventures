-- Atomic spot decrement and increment for the bookings flow.
-- These run inside Postgres with a row-level FOR UPDATE lock so two
-- concurrent bookings can't both see "14 spots left" and both succeed.
--
-- Parameters are named hike_id and delta (no p_ prefix) so they line
-- up with what the Supabase JS client sends by default when you call
-- .rpc("name", { hike_id, delta }).
--
-- Run this file in the Supabase SQL Editor.

create or replace function public.decrement_hike_spots(
  hike_id text,
  delta int
)
returns int
language plpgsql
as $$
declare
  v_left int;
begin
  select spots_left into v_left
  from public.hikes
  where id = hike_id
  for update;
  if v_left is null then
    return null;  -- hike not found
  end if;
  if v_left < delta then
    return null;  -- not enough spots
  end if;
  update public.hikes
     set spots_left = spots_left - delta
   where id = hike_id;
  return v_left - delta;  -- new spots_left
end;
$$;

create or replace function public.increment_hike_spots(
  hike_id text,
  delta int
)
returns int
language plpgsql
as $$
declare
  v_new int;
begin
  update public.hikes
     set spots_left = least(spots_total, spots_left + delta)
   where id = hike_id
   returning spots_left into v_new;
  return v_new;
end;
$$;

grant execute on function public.decrement_hike_spots(text, int) to service_role;
grant execute on function public.increment_hike_spots(text, int) to service_role;
