// Eventbrite publishing edge function.
//
// Called by the Badr Adventures admin API after a hike is created or
// updated with publish_to_eventbrite = true.  Creates, updates, or
// unpublishes an Eventbrite event that links back to the hike page on
// badradventures.co.uk.
//
// POST /  with JSON body:
//   action: "publish" | "update" | "unpublish"
//   hike: {
//     id: string              // hike slug
//     title: string
//     summary: string
//     description: string
//     location: string
//     region: string
//     date: string            // YYYY-MM-DD
//     duration: string        // e.g. "2 days"
//     priceGbp: number
//     image: string
//     spotsTotal: number
//   }
//   eventbrite_event_id?: string   // required for update/unpublish
//
// Env vars:
//   EVENTBRITE_OAUTH_TOKEN   — Personal OAuth token from Eventbrite
//   EVENTBRITE_ORG_ID        — Cached Eventbrite organization ID
//
// Returns:
//   { ok: true, eventbriteEventId: "..." }
//   { ok: false, error: "..." }

const BASE = "https://www.eventbriteapi.com/v3";
const HIKE_URL = "https://badradventures.co.uk/hikes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function token(): string {
  const t = Deno.env.get("EVENTBRITE_OAUTH_TOKEN");
  if (!t) throw new Error("EVENTBRITE_OAUTH_TOKEN not set");
  return t;
}

function orgId(): string {
  const id = Deno.env.get("EVENTBRITE_ORG_ID");
  if (!id) throw new Error("EVENTBRITE_ORG_ID not set");
  return id;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json",
  };
}

async function api(
  method: string,
  path: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (data.error as string) ||
      (data.error_description as string) ||
      `Eventbrite API error (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Venue management — find or create a venue for the hike location
// ---------------------------------------------------------------------------

/** Try to find a matching venue by name/location, or create one. */
async function resolveVenue(
  location: string,
  region: string,
): Promise<string> {
  const org = orgId();

  // List existing venues to find a match
  const venues = await api(
    "GET",
    `/organizations/${org}/venues?page_size=50`,
  );

  const venueList = (venues.venues as Array<Record<string, unknown>>) ?? [];
  const match = venueList.find((v) => {
    const addr = v.address as Record<string, unknown> | null;
    if (!addr) return false;
    const city = (addr.city as string ?? "").toLowerCase();
    const regionStr = (addr.region as string ?? "").toLowerCase();
    return (
      city === location.toLowerCase() ||
      regionStr === region.toLowerCase()
    );
  });

  if (match) return match.id as string;

  // Create a new venue
  // We parse location into city + region heuristically
  const city = location.split(",")[0]?.trim() ?? location;

  const created = await api("POST", "/venues/", {
    venue: {
      name: `${location}, ${region}`,
      address: {
        city,
        region,
        country: "GB",
      },
    },
  });

  return created.id as string;
}

// ---------------------------------------------------------------------------
// Event builders
// ---------------------------------------------------------------------------

function buildEventPayload(hike: {
  id: string;
  title: string;
  summary: string;
  description: string;
  location: string;
  region: string;
  date: string;
  duration: string;
  priceGbp: number;
  image: string;
  spotsTotal: number;
}) {
  const price = typeof hike.priceGbp === "number" && !Number.isNaN(hike.priceGbp) ? hike.priceGbp : 0;
  const hikeUrl = `${HIKE_URL}/${encodeURIComponent(hike.id)}`;
  const startTime = `${hike.date}T09:00:00Z`;
  // Infer end time from duration: try to parse "N days" or "N hours"
  // default to 6 hours for a day hike, or multi-day
  let hours = 6;
  const dur = hike.duration.toLowerCase();
  const dayMatch = dur.match(/(\d+)\s*days?/);
  const hourMatch = dur.match(/(\d+)\s*hours?/);
  if (dayMatch) {
    hours = parseInt(dayMatch[1]) * 8; // 8 hours per day
  } else if (hourMatch) {
    hours = parseInt(hourMatch[1]);
  }
  const endDate = new Date(
    new Date(hike.date + "T09:00:00Z").getTime() + hours * 60 * 60 * 1000,
  );
  const endTime = endDate.toISOString();

  const descriptionHtml = `
    <h2>${hike.title}</h2>
    <p>${hike.summary}</p>
    <hr />
    <p>${hike.description.replace(/\n/g, "<br />")}</p>
    <hr />
    <p><strong>Location:</strong> ${hike.location}, ${hike.region}</p>
    <p><strong>Duration:</strong> ${hike.duration}</p>
    <p><strong>Price:</strong> £${price.toFixed(2)} per person</p>
    <p><strong>Spots:</strong> ${hike.spotsTotal}</p>
    <hr />
    <p>Book your place at: <a href="${hikeUrl}">${hikeUrl}</a></p>
    <p><em>Powered by <a href="https://badradventures.co.uk">Badr Adventures</a> — Muslim hiking, camping and outdoor adventures in the UK.</em></p>
  `.trim();

  return {
    event: {
      name: { html: `🏔️ ${hike.title} — Badr Adventures` },
      description: { html: descriptionHtml },
      start: {
        timezone: "Europe/London",
        utc: startTime,
      },
      end: {
        timezone: "Europe/London",
        utc: endTime,
      },
      currency: "GBP",
      online_event: false,
      listed: true,
      capacity: hike.spotsTotal,
    },
  };
}

// ---------------------------------------------------------------------------
// Main handlers
// ---------------------------------------------------------------------------

async function publishEvent(hike: Parameters<typeof buildEventPayload>[0]) {
  // Resolve venue
  const venueId = await resolveVenue(hike.location, hike.region);
  const payload = buildEventPayload(hike);
  payload.event.venue_id = venueId;

  // Get or create a free ticket class
  const org = orgId();
  const events = await api(
    "POST",
    `/organizations/${org}/events/`,
    payload,
  );
  const eventId = events.id as string;

  // Create a free ticket class so the event is complete
  try {
    await api(
      "POST",
      `/events/${eventId}/ticket_classes/`,
      {
        ticket_class: {
          name: "General Admission",
          quantity_total: hike.spotsTotal,
          free: true,
          donation: false,
          sales_start: new Date().toISOString(),
          hidden: false,
        },
      },
    );
  } catch {
    // Ticket class may have auto-created; that's fine
  }

  // Publish the event
  try {
    await api("POST", `/events/${eventId}/publish/`);
  } catch {
    // May already be published
  }

  return eventId;
}

async function updateEvent(
  eventId: string,
  hike: Parameters<typeof buildEventPayload>[0],
) {
  const payload = buildEventPayload(hike);

  // Try to update the venue on the existing event
  try {
    const venueId = await resolveVenue(hike.location, hike.region);
    payload.event.venue_id = venueId;
  } catch {
    // Venue resolution failed — proceed without venue update
  }

  await api(
    "POST",
    `/events/${eventId}/`,
    payload,
  );

  // Ensure it's published
  try {
    await api("POST", `/events/${eventId}/publish/`);
  } catch {
    // Already published or no change needed
  }

  return eventId;
}

async function unpublishEvent(eventId: string) {
  try {
    await api("POST", `/events/${eventId}/unpublish/`);
  } catch {
    // May already be unpublished
  }
  return eventId;
}

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

interface PublishRequest {
  action: "publish" | "update" | "unpublish";
  hike?: {
    id: string;
    title: string;
    summary: string;
    description: string;
    location: string;
    region: string;
    date: string;
    duration: string;
    priceGbp: number;
    image: string;
    spotsTotal: number;
  };
  eventbriteEventId?: string;
}

function validate(req: unknown): PublishRequest {
  const r = req as Record<string, unknown>;
  if (!r || typeof r !== "object") throw new Error("Body is required");
  const action = r.action as string;
  if (!["publish", "update", "unpublish"].includes(action)) {
    throw new Error('action must be "publish", "update", or "unpublish"');
  }

  const typedReq: PublishRequest = { action: action as PublishRequest["action"] };

  if (action === "publish" || action === "update") {
    const hike = r.hike as Record<string, unknown> | undefined;
    if (!hike) throw new Error("hike object is required for publish/update");
    if (!hike.id || !hike.title || !hike.date) {
      throw new Error("hike.id, hike.title, and hike.date are required");
    }
    typedReq.hike = hike as PublishRequest["hike"];
  }

  if (action === "update" || action === "unpublish") {
    const eventbriteEventId = r.eventbriteEventId as string | undefined;
    if (!eventbriteEventId) {
      throw new Error("eventbriteEventId is required for update/unpublish");
    }
    typedReq.eventbriteEventId = eventbriteEventId;
  }

  return typedReq;
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json().catch(() => ({}));
    const input = validate(body);

    let eventbriteEventId: string | undefined;

    switch (input.action) {
      case "publish":
        if (!input.hike) {
          return new Response(
            JSON.stringify({ error: "hike data required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        eventbriteEventId = await publishEvent(input.hike);
        break;

      case "update":
        if (!input.hike || !input.eventbriteEventId) {
          return new Response(
            JSON.stringify({ error: "hike data and eventbriteEventId required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        eventbriteEventId = await updateEvent(
          input.eventbriteEventId,
          input.hike,
        );
        break;

      case "unpublish":
        if (!input.eventbriteEventId) {
          return new Response(
            JSON.stringify({ error: "eventbriteEventId required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        await unpublishEvent(input.eventbriteEventId);
        eventbriteEventId = input.eventbriteEventId;
        break;
    }

    return new Response(
      JSON.stringify({ ok: true, eventbriteEventId }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[publish-to-eventbrite]", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
