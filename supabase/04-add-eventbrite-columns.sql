-- Add Eventbrite publishing columns to the hikes table.
-- These allow the admin to optionally publish a hike to Eventbrite.
--
-- publish_to_eventbrite: when true, the backend calls the Eventbrite API
--   to create/update a corresponding event on Eventbrite.
-- eventbrite_event_id: the Eventbrite event ID returned by the API.
-- eventbrite_venue_id: the Eventbrite venue ID for this hike's location.
-- eventbrite_org_id: cached organization ID for this hike.
--   Set once per hike for consistency.
-- eventbrite_last_synced: when the Eventbrite event was last synced.
--
-- Run this in Supabase SQL Editor. It's idempotent.

ALTER TABLE hikes
  ADD COLUMN IF NOT EXISTS publish_to_eventbrite BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS eventbrite_event_id TEXT;

-- Index for quick lookups of hikes published to Eventbrite
CREATE INDEX IF NOT EXISTS idx_hikes_eventbrite_event_id ON hikes(eventbrite_event_id)
  WHERE eventbrite_event_id IS NOT NULL;
