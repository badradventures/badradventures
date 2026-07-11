// Eventbrite publishing edge function.
//
// Called by the Badr Adventures admin API after a hike is created or
// updated with publish_to_eventbrite = true.
//
// POST /
//   action: "publish" | "update" | "unpublish"
//
// Env vars:
//   EVENTBRITE_OAUTH_TOKEN
//   EVENTBRITE_ORG_ID

const BASE = "https://www.eventbriteapi.com/v3";
const HIKE_URL = "https://badradventures.co.uk/hikes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Normalise the price field — it may come in as null, undefined, string, or number.
function normalisePrice(raw: unknown): number {
  if (typeof raw === "number" && !Number.isNaN(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

/// Build the cost string for a ticket class (Eventbrite V3 format: "CURRENCY,amount_in_cents").
function buildCost(gbp: number): string | undefined {
  if (gbp <= 0) return undefined;
  return `GBP,${Math.round(gbp * 100)}`;
}

function token(): string {
  const t = Deno.env.get("EVENTBRITE_OAUTH_TOKEN");

  if (!t) {
    throw new Error("EVENTBRITE_OAUTH_TOKEN not set");
  }

  return t;
}

function orgId(): string {
  const id = Deno.env.get("EVENTBRITE_ORG_ID");

  if (!id) {
    throw new Error("EVENTBRITE_ORG_ID not set");
  }

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

  const data = await res
    .json()
    .catch(() => ({})) as Record<string, unknown>;


  if (!res.ok) {

    console.error(
      "Eventbrite API error",
      {
        method,
        url,
        status: res.status,
        response: data,
      },
    );


    const msg =
      (data.error as string) ||
      (data.error_description as string) ||
      `Eventbrite API error (${res.status})`;

    throw new Error(msg);
  }

  return data;
}


// ---------------------------------------------------------------------------
// Image upload
// ---------------------------------------------------------------------------

/// Upload a hike cover image to Eventbrite and return its image ID (for use
/// as `logo_id` on the event).
async function uploadImage(imageUrl: string): Promise<string> {
  // Step 1: Get upload instructions — this endpoint requires the token
  // as both a Bearer header and a query parameter
  const t = token();
  const uploadInstructionsUrl = `${BASE}/media/upload/?type=image-event-logo&token=${t}`;
  const instructionsRes = await fetch(uploadInstructionsUrl, {
    headers: {
      Authorization: `Bearer ${t}`,
    },
  });
  const instructions = await instructionsRes.json() as Record<string, unknown>;

  if (!instructionsRes.ok || !instructions.upload_url) {
    const msg = (instructions.error as string) ?? "Failed to get media upload instructions";
    throw new Error(msg);
  }

  const uploadUrl = instructions.upload_url as string;
  const uploadToken = instructions.upload_token as string;
  const uploadData = instructions.upload_data as Record<string, string>;
  const fileParam = (instructions.file_parameter_name as string) ?? "file";

  // Step 2: Download the image from the hike URL
  let imageRes = await fetch(imageUrl);
  if (!imageRes.ok && imageUrl.includes("supabase.co/storage/v1/object/public/")) {
    // Supabase public URLs without file extensions return 400 (can't determine content type).
    // Adding ?download=1 bypasses content-type negotiation.
    imageRes = await fetch(`${imageUrl}?download=1`);
  }
  if (!imageRes.ok) {
    throw new Error(`Failed to download image from ${imageUrl}: ${imageRes.status}`);
  }
  const imageBlob = await imageRes.blob();

  // Step 3: Upload the image to Eventbrite's S3
  const form = new FormData();
  for (const [key, value] of Object.entries(uploadData)) {
    form.append(key, value);
  }
  form.append(fileParam, imageBlob);
  const uploadRes = await fetch(uploadUrl, { method: "POST", body: form });
  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => "unknown");
    throw new Error(`S3 upload failed: ${uploadRes.status} ${text}`);
  }

  // Step 4: Notify Eventbrite the upload is done
  const notifyRes = await fetch(`${BASE}/media/upload/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      upload_token: uploadToken,
      crop_mask: {
        top_left: { y: 0, x: 0 },
        width: 1280,
        height: 640,
      },
    }),
  });
  const notifyData = await notifyRes.json() as Record<string, unknown>;

  if (!notifyRes.ok) {
    const msg = (notifyData.error as string) ?? "Failed to finalise image upload";
    throw new Error(msg);
  }

  const image = notifyData.image as Record<string, unknown> | undefined;
  const imageId = image?.id as string | undefined;
  if (!imageId) {
    throw new Error("Eventbrite did not return an image ID");
  }

  console.log("Uploaded image to Eventbrite:", imageId);
  return imageId;
}

  
// ---------------------------------------------------------------------------
// Venue management
// ---------------------------------------------------------------------------

async function resolveVenue(
  location: string,
  region: string,
): Promise<string> {

  const org = orgId();


  const venues = await api(
    "GET",
    `/organizations/${org}/venues?page_size=50`,
  );


  const venueList = Array.isArray(venues.venues)
    ? venues.venues as Array<Record<string, unknown>>
    : [];


  const match = venueList.find((v) => {

    const addr =
      v.address as Record<string, unknown> | null;


    if (!addr) return false;


    const city =
      String(addr.city ?? "").toLowerCase();


    const regionName =
      String(addr.region ?? "").toLowerCase();


    return (
      city === location.toLowerCase() ||
      regionName === region.toLowerCase()
    );
  });


  if (match) {
    return String(match.id);
  }


  const city =
    location.split(",")[0]?.trim() ?? location;


  const created = await api(
    "POST",
    `/organizations/${org}/venues/`,
    {
      venue: {
        name: `${location}, ${region}`,
        address: {
          city,
          country: "GB",
        },
      },
    },
  );


  return String(created.id);
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
}, logoId?: string) {
  const price = typeof hike.priceGbp === "number" && !Number.isNaN(hike.priceGbp) ? hike.priceGbp : 0;
  const hikeUrl =
    `${HIKE_URL}/${encodeURIComponent(hike.id)}`;


  const startTime =
    `${hike.date}T09:00:00Z`;


  let hours = 6;

  const dur =
    hike.duration.toLowerCase();


  const dayMatch =
    dur.match(/(\d+)\s*days?/);


  const hourMatch =
    dur.match(/(\d+)\s*hours?/);


  if (dayMatch) {
    hours = parseInt(dayMatch[1]) * 8;
  } else if (hourMatch) {
    hours = parseInt(hourMatch[1]);
  }


  const endDate =
    new Date(
      new Date(startTime).getTime() +
        hours * 60 * 60 * 1000,
    );


  const endTime =
    endDate.toISOString().replace(/\.\d{3}Z$/, "Z");


  const descriptionHtml = `
    <h2>${hike.title}</h2>

    <p>${hike.summary}</p>

    <hr />

    <p>
      ${hike.description.replace(/\n/g, "<br />")}
    </p>

    <hr />

    <p>
      <strong>Location:</strong>
      ${hike.location}, ${hike.region}
    </p>

    <p>
      <strong>Duration:</strong>
      ${hike.duration}
    </p>

    <p>
      <strong>Price:</strong>
      £${price.toFixed(2)} per person 
    </p>

    <p>
      <strong>Available spaces:</strong>
      ${hike.spotsTotal}
    </p>

    <hr />

    <p>
      Book your place:
      <a href="${hikeUrl}">
        ${hikeUrl}
      </a>
    </p>

    <p>
      Powered by
      <a href="https://badradventures.co.uk">
        Badr Adventures
      </a>
    </p>
  `.trim();


  return {
    event: {

      name: {
        html: `${hike.title} — Badr Adventures`,
      },


      description: {
        html: descriptionHtml,
      },


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

      ...(logoId ? { logo_id: logoId } : {}),
    },
  };
}


// ---------------------------------------------------------------------------
// Publish event
// ---------------------------------------------------------------------------

async function publishEvent(
  hike: Parameters<typeof buildEventPayload>[0],
  skipImage?: boolean,
) {
  // Run venue resolution and image upload in parallel — they're independent
  const [venueId, logoId] = await Promise.all([
    resolveVenue(hike.location, hike.region),
    (!skipImage && hike.image
      ? uploadImage(hike.image).catch((err) => {
          console.warn("Image upload failed, proceeding without logo", err);
          return undefined;
        })
      : Promise.resolve(undefined)),
  ]);

  const payload =
    buildEventPayload(hike, logoId);


  payload.event.venue_id =
    venueId;


  const org =
    orgId();


  const created =
    await api(
      "POST",
      `/organizations/${org}/events/`,
      payload,
    );


  const eventId =
    String(created.id);


  // --- Debug: log what we received ---
  console.log("publishEvent hike:", JSON.stringify(hike, null, 2));
  console.log("priceGbp raw:", hike.priceGbp, "| type:", typeof hike.priceGbp);

  // Normalise price once, use everywhere
  const priceGbp = normalisePrice(hike.priceGbp);
  console.log("priceGbp normalised:", priceGbp);


  // Create ticket class
  try {
    const ticketPayload: Record<string, unknown> = {
      ticket_class: {
        name: "General Admission",
        quantity_total: hike.spotsTotal,
      },
    };

    // Paid ticket → cost as string "GBP,500"; free ticket → free flag, no cost
    const cost = buildCost(priceGbp);
    if (cost) {
      (ticketPayload.ticket_class as Record<string, unknown>).cost = cost;
    } else {
      (ticketPayload.ticket_class as Record<string, unknown>).free = true;
    }

    console.log("Ticket class payload:", JSON.stringify(ticketPayload, null, 2));

    await api(
      "POST",
      `/events/${eventId}/ticket_classes/`,
      ticketPayload,
    );
  } catch (err) {
    console.warn(
      "Ticket class creation skipped",
      err,
    );
  }


  try {
    await api(
      "POST",
      `/events/${eventId}/publish/`,
    );
  } catch (err) {
    console.warn(
      "Publish skipped",
      err,
    );
  }


  return eventId;
}


// ---------------------------------------------------------------------------
// Update event
// ---------------------------------------------------------------------------

async function updateEvent(
  eventId: string,
  hike: Parameters<typeof buildEventPayload>[0],
  skipImage?: boolean,
) {
  // Run image upload and venue resolution in parallel — they're independent
  const [logoId, venueId] = await Promise.all([
    (!skipImage && hike.image
      ? uploadImage(hike.image).catch((err) => {
          console.warn("Image upload failed during update, proceeding without logo", err);
          return undefined;
        })
      : Promise.resolve(undefined)),
    resolveVenue(hike.location, hike.region).catch((err) => {
      console.warn("Venue update skipped", err);
      return undefined;
    }),
  ]);

  const payload =
    buildEventPayload(hike, logoId);


  try {

    payload.event.venue_id =
      venueId;


  } catch (err) {

    console.warn(
      "Venue update skipped",
      err,
    );

  }


  await api(
    "POST",
    `/events/${eventId}/`,
    payload,
  );


  // --- Debug: log what we received ---
  console.log("updateEvent hike:", JSON.stringify(hike, null, 2));
  console.log("priceGbp raw:", hike.priceGbp, "| type:", typeof hike.priceGbp);

  // Normalise price once, use everywhere
  const priceGbp = normalisePrice(hike.priceGbp);
  console.log("priceGbp normalised:", priceGbp);


  // Update existing ticket classes (GET existing ones and PATCH, since POST creates a new one every time)
  try {
    const existingTicketClasses = await api(
      "GET",
      `/events/${eventId}/ticket_classes/`,
    );
    const classes = existingTicketClasses.ticket_classes as Array<Record<string, unknown>> | undefined;

    const cost = buildCost(priceGbp);
    const ticketClassPatch: Record<string, unknown> = {};
    if (cost) {
      ticketClassPatch.cost = cost;
      ticketClassPatch.free = false;
    } else {
      ticketClassPatch.free = true;
      ticketClassPatch.cost = null;
    }

    if (classes && classes.length > 0) {
      // Patch the first ticket class
      const existingId = classes[0].id;
      console.log("Patching existing ticket class:", existingId);
      await api(
        "PATCH",
        `/events/${eventId}/ticket_classes/${existingId}/`,
        { ticket_class: ticketClassPatch },
      );
    } else {
      // Create a new one
      console.log("No existing ticket class found, creating one");
      const ticketPayload: Record<string, unknown> = {
        ticket_class: {
          name: "General Admission",
          quantity_total: hike.spotsTotal,
          ...ticketClassPatch,
        },
      };
      await api(
        "POST",
        `/events/${eventId}/ticket_classes/`,
        ticketPayload,
      );
    }

    console.log("Ticket class updated successfully");
  } catch (err) {
    console.warn(
      "Ticket class update skipped",
      err,
    );
  }


  try {
    await api(
      "POST",
      `/events/${eventId}/publish/`,
    );
  } catch (err) {
    console.warn(
      "Publish skipped (event may already be published)",
      err,
    );
  }


  return eventId;
}


// ---------------------------------------------------------------------------
// Unpublish event
// ---------------------------------------------------------------------------

async function unpublishEvent(
  eventId: string,
) {

  try {

    await api(
      "POST",
      `/events/${eventId}/unpublish/`,
    );

  } catch {

  }


  return eventId;
}


// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

interface PublishRequest {

  action:
    | "publish"
    | "update"
    | "unpublish";


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
  skip_image?: boolean;
}



function validate(
  req: unknown,
): PublishRequest {


  const r =
    req as Record<string, unknown>;


  if (!r || typeof r !== "object") {

    throw new Error(
      "Body is required",
    );

  }


  const action =
    r.action as string;


  if (
    ![
      "publish",
      "update",
      "unpublish",
    ].includes(action)
  ) {

    throw new Error(
      "Invalid action",
    );

  }


  const result: PublishRequest = {
    action:
      action as PublishRequest["action"],
  };



  if (
    action === "publish" ||
    action === "update"
  ) {

    if (!r.hike) {

      throw new Error(
        "hike required",
      );

    }


    result.hike =
      r.hike as PublishRequest["hike"];
    result.skip_image = r.skip_image as boolean | undefined;

  }



  if (
    action === "update" ||
    action === "unpublish"
  ) {

    if (!r.eventbriteEventId) {

      throw new Error(
        "eventbriteEventId required",
      );

    }


    result.eventbriteEventId =
      String(r.eventbriteEventId);

  }


  return result;
}


// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {

  try {

    if (req.method !== "POST") {

      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            "Content-Type":
              "application/json",
          },
        },
      );

    }



    const body =
      await req.json();


    const input =
      validate(body);



    let eventbriteEventId:
      string | undefined;



    switch (input.action) {


      case "publish":

        eventbriteEventId =
          await publishEvent(
            input.hike!,
            input.skip_image,
          );

        break;



      case "update":

        eventbriteEventId =
          await updateEvent(
            input.eventbriteEventId!,
            input.hike!,
            input.skip_image,
          );

        break;



      case "unpublish":

        eventbriteEventId =
          await unpublishEvent(
            input.eventbriteEventId!,
          );

        break;

    }



    return new Response(

      JSON.stringify({
        ok: true,
        eventbriteEventId,
      }),

      {
        headers: {
          "Content-Type":
            "application/json",
        },
      },

    );


  } catch (err) {


    console.error(
      "[publish-to-eventbrite]",
      err,
    );



    return new Response(

      JSON.stringify({

        ok: false,

        error:
          err instanceof Error
            ? err.message
            : String(err),

      }),

      {
        status: 500,

        headers: {
          "Content-Type":
            "application/json",
        },
      },

    );

  }

});