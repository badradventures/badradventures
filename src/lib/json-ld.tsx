// Schema.org JSON-LD templates. Each function returns an object suitable
// for use with `useJsonLd` (or any other JSON-LD injector).
//
// References:
//   https://schema.org/Organization
//   https://schema.org/LocalBusiness  (extends Organization)
//   https://schema.org/TouristAttraction / https://schema.org/Event
//   https://schema.org/Product
//   https://schema.org/BreadcrumbList
//   https://schema.org/WebSite  (for the sitelinks search box)

import { SITE_NAME, SITE_URL } from "./seo";

const ORG_NAME = "Badr Adventures UK Ltd";
const COMPANY_NUMBER = "15921546";
export const AUTHOR_NAME = "Saif Mahmood";
export const AUTHOR_ID = `${SITE_URL}#author-saif`;
const REGISTERED_OFFICE = {
  streetAddress: "106 Castlesteads Drive",
  addressLocality: "Carlisle",
  addressRegion: "England",
  postalCode: "CA2 7XD",
  addressCountry: "GB",
};

export const ORG_ID = `${SITE_URL}#organization`;

/** LocalBusiness schema (the strongest match for a UK guided-hike operator). */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": ORG_ID,
    name: ORG_NAME,
    legalName: ORG_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    image: `${SITE_URL}/og-default.png`,
    description:
      "Badr Adventures runs guided hikes across the Lake District, Peak District, Snowdonia and beyond. Small groups, qualified guides, real trips.",
    telephone: "+44-0000-000000",
    email: "enquiries@badradventures.co.uk",
    priceRange: "££",
    currenciesAccepted: "GBP",
    paymentAccepted: "Cash, Credit Card",
    address: {
      "@type": "PostalAddress",
      ...REGISTERED_OFFICE,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 54.8905,
      longitude: -2.9441,
    },
    areaServed: [
      { "@type": "AdministrativeArea", name: "Lake District" },
      { "@type": "AdministrativeArea", name: "Peak District" },
      { "@type": "AdministrativeArea", name: "Snowdonia" },
      { "@type": "Country", name: "United Kingdom" },
    ],
    knowsAbout: [
      "Guided hiking",
      "Wild camping",
      "Mountain scrambling",
      "Hill walking",
    ],
    sameAs: [],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "08:00",
        closes: "18:00",
      },
    ],
    identifier: COMPANY_NUMBER,
  };
}

/** WebSite schema with a SearchAction (drives the sitelinks search box). */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en-GB",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/hikes?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** A single guided hike as a TouristTrip + Event with Offer. */
export function hikeJsonLd(hike: {
  id: string;
  title: string;
  description: string;
  summary: string;
  location: string;
  region: string;
  date: string;
  duration: string;
  image: string;
  pricePence: number;
  spotsLeft: number;
  spotsTotal: number;
  difficulty: string;
}) {
  const url = `${SITE_URL}/hikes/${hike.id}`;
  const inStock = hike.spotsLeft > 0;
  const startDate = new Date(hike.date);
  const endDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000);
  return {
    "@context": "https://schema.org",
    "@type": ["TouristTrip", "Event"],
    "@id": url,
    name: hike.title,
    description: hike.description || hike.summary,
    image: hike.image.startsWith("http") ? hike.image : `${SITE_URL}${hike.image}`,
    url,
    touristType: "Outdoor enthusiasts",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    startDate: isNaN(startDate.getTime()) ? hike.date : startDate.toISOString(),
    endDate: isNaN(endDate.getTime()) ? hike.date : endDate.toISOString(),
    location: {
      "@type": "Place",
      name: hike.location,
      address: { "@type": "PostalAddress", addressRegion: hike.region, addressCountry: "GB" },
    },
    offers: {
      "@type": "Offer",
      price: (hike.pricePence / 100).toFixed(2),
      priceCurrency: "GBP",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      url,
      validFrom: new Date().toISOString(),
      inventoryLevel: { "@type": "QuantitativeValue", value: hike.spotsLeft },
      seller: { "@id": ORG_ID },
    },
    provider: { "@id": ORG_ID },
    organizer: { "@id": ORG_ID },
    remainingAttendeeCapacity: hike.spotsLeft,
    maximumAttendeeCapacity: hike.spotsTotal,
  };
}

/** Equipment rental as a Product with Offer. */
export function equipmentJsonLd(item: {
  id: string;
  name: string;
  type: string;
  description: string;
  image: string;
  pricePence: number;
  availableUnits: number;
  totalUnits: number;
  location: string;
}) {
  const url = `${SITE_URL}/equipment/${item.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": url,
    name: item.name,
    description: item.description,
    image: item.image.startsWith("http") ? item.image : `${SITE_URL}${item.image}`,
    url,
    category: item.type,
    offers: {
      "@type": "Offer",
      price: (item.pricePence / 100).toFixed(2),
      priceCurrency: "GBP",
      availability:
        item.availableUnits > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORG_ID },
    },
  };
}

/** Breadcrumb list, e.g. Home > Hikes > Snowdonia Scramble. */
export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.path.startsWith("http") ? it.path : `${SITE_URL}${it.path}`,
    })),
  };
}

/** Speakable schema — points voice assistants and AI search at the
 *  one short paragraph that best answers "What is Muslim hiking?" */
export function speakableJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SpeakableSpecification",
    xpath: [
      "/html/head/title",
      "/html/body//*[@data-speakable='true']",
    ],
  };
}

/** FAQ schema for the about / FAQ page. */
export function faqJsonLd(
  qa: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
/** A person schema for the founder/lead guide. Linked from articles
 *  to establish E-E-A-T authorship in Google and AI search. */
export function authorJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": AUTHOR_ID,
    name: AUTHOR_NAME,
    jobTitle: "Founder & Lead Mountain Leader",
    worksFor: { "@id": ORG_ID },
    url: `${SITE_URL}/about`,
    knowsAbout: [
      "Mountain Leadership",
      "Wild camping",
      "Islamic outdoor ethics",
      "Hillwalking safety",
    ],
  };
}
export function articleJsonLd(options: {
  headline: string;
  description: string;
  author: string;
  publisher: string;
  datePublished: string;
  dateModified: string;
  image: string;
  mainEntityOfPage: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: options.headline,
    description: options.description,
    author: { "@type": "Person", name: options.author, "@id": options.author === AUTHOR_NAME ? AUTHOR_ID : undefined },
    publisher: { "@id": ORG_ID },
    datePublished: options.datePublished,
    dateModified: options.dateModified,
    image: options.image.startsWith("http") ? options.image : `${SITE_URL}${options.image}`,
    mainEntityOfPage: options.mainEntityOfPage,
  };
}
export function blogPostingJsonLd(options: {
  headline: string;
  description: string;
  author: string;
  publisher: string;
  datePublished: string;
  dateModified: string;
  image: string;
  mainEntityOfPage: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: options.headline,
    description: options.description,
    author: { "@type": "Person", name: options.author },
    publisher: { "@type": "Organization", name: options.publisher },
    datePublished: options.datePublished,
    dateModified: options.dateModified,
    image: options.image.startsWith("http") ? options.image : `${SITE_URL}${options.image}`,
    mainEntityOfPage: options.mainEntityOfPage,
  };
}
