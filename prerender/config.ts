// Per-route prerender config. The prerender script iterates over ROUTES,
// renders each one with the same React tree the browser uses, and writes
// a static HTML file to dist/<route>/index.html.
//
// Keep this in sync with src/App.tsx. If you add a new page to the live
// site and want it indexed, add an entry here.

import HomePage from "@/pages/home";
import HikesPage from "@/pages/hikes";
import HikeDetailPage from "@/pages/hike-detail";
import RentPage from "@/pages/rent";
import MuslimHikingPage from "@/pages/muslim-hiking";
import MuslimHikingUkPage from "@/pages/muslim-hiking-uk";
import MuslimHikingBeginnersPage from "@/pages/muslim-hiking-beginners";
import MuslimHikingWomenPage from "@/pages/muslim-hiking-women";
import MuslimHikingNearMePage from "@/pages/muslim-hiking-near-me";
import MuslimCampingUkPage from "@/pages/muslim-camping-uk";
import FamilyHikingPage from "@/pages/family-hiking";
import MuslimHikingGuidePage from "@/pages/muslim-hiking-guide";
import MuslimHikingEquipmentPage from "@/pages/muslim-hiking-equipment";
import MuslimHikingRamadanPage from "@/pages/muslim-hiking-ramadan";
import BlogIndexPage from "@/pages/blog-index";
import BlogPostPage from "@/pages/blog-post";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import PrivacyPage from "@/pages/privacy";
import CookiesPage from "@/pages/cookies";
import TermsPage from "@/pages/terms";
import RefundPage from "@/pages/refund";
import NotFoundPage from "@/pages/not-found";
import {
  organizationJsonLd,
  websiteJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  articleJsonLd,
  authorJsonLd,
  speakableJsonLd,
  firstMuslimHikeHowToJsonLd,
  muslimHikingKitHowToJsonLd,
  ramadanHikingHowToJsonLd,
} from "@/lib/json-ld";
import type { ComponentType } from "react";

const SITE = "https://badradventures.co.uk";

type QuestionAnswer = { question: string; answer: string };

const FAQS: QuestionAnswer[] = [
  { question: "What is Muslim hiking?", answer: "Muslim hiking is outdoor hiking (walking up mountains, hills and nature trails) organised around the needs of Muslim participants. That means prayer breaks built into the route, halal food on every trip, women-friendly group options, modest dress respected, and a community where deen and the outdoors go hand in hand. Badr Adventures is the UK's leading Muslim hiking group." },
  { question: "Do I need to be fit to come on a Muslim hiking trip?", answer: "Not at all. About half our group has never hiked before they joined us. We grade every route from 'gentle first mountain' to 'multi-day expedition', and we pace every day to the slowest hiker." },
  { question: "Is the food halal?", answer: "Yes — 100%. Trail snacks, lunches on the summit, expedition dinners, even the emergency chocolate. Everything is halal, and we can cater for vegetarian, vegan, and common allergies with advance notice." },
  { question: "How do prayer breaks work on a hike?", answer: "Every route is plotted with prayer times in mind. We carry a compact prayer mat, a qibla compass, and a bottle of wudu water in every group. We stop for Fajr, Dhuhr, Asr, Maghrib and Isha — even if we're 20 minutes from the summit." },
  { question: "Do you run women-only Muslim hiking trips?", answer: "Yes. We run a regular programme of sisters-only hiking weekends, women-only camping trips, and modest mixed-group hikes. Browse upcoming dates on our hikes page." },
  { question: "Where in the UK do you run Muslim hiking trips?", answer: "All over. The Lake District, Peak District, Snowdonia (Eryri), Scottish Highlands, Yorkshire Dales, Brecon Beacons, the South Downs, and the Kent Downs. If there's a hill, we'll take you up it." },
  { question: "How do I book a Muslim hiking trip?", answer: "Browse upcoming hikes on our hikes page, pick a date and route, and book online. A small deposit secures your place, and the balance is due 4 weeks before the trip." },
];

const MUSLIM_HIKING_FAQS: QuestionAnswer[] = FAQS;
const MUSLIM_HIKING_UK_FAQS: QuestionAnswer[] = [
  { question: "Where can I go Muslim hiking in the UK?", answer: "Muslim hiking groups run regular trips across the Lake District, Peak District, Snowdonia (Eryri), Yorkshire Dales, Brecon Beacons, South Downs, Kent Downs, and the Scottish Highlands. Badr Adventures runs guided weekends in every major UK range, all year round." },
  { question: "Is there a Muslim hiking group near me?", answer: "Most major UK cities are within two hours of at least one Muslim hiking group. London, Manchester, Birmingham, Leeds, Bradford, Leicester, Glasgow, Edinburgh, Cardiff and Bristol all have active groups. Badr Adventures is based in Cumbria and runs nationwide weekends." },
  { question: "How much does a guided Muslim hiking trip cost?", answer: "A day-walk with a qualified Muslim hiking guide costs roughly £35–£75 per person, including guide fees, packed lunch and group kit. An overnight expedition (camp or bunkhouse) typically runs £120–£220." },
  { question: "Do I need my own hiking gear?", answer: "Day-walks: you need boots, a waterproof jacket and a daypack. We can lend kit on a first-come basis. Overnight trips: Badr Adventures rents full kit lists through the Rent page, delivered to your meeting point." },
  { question: "Are there sisters-only Muslim hiking groups in the UK?", answer: "Yes. Most active Muslim hiking groups run a regular sisters-only programme. Badr Adventures runs two sisters-only weekends a month in the Lake District and Peak District, led by a qualified female Mountain Leader." },
  { question: "Can I bring my kids on a Muslim hiking trip?", answer: "Yes. Most groups run family-friendly routes for kids aged 5 and up. Short distances, shaded paths, regular prayer stops, and a café at the end. Badr Adventures runs dedicated family weekends four times a year." },
  { question: "What's the difference between Muslim hiking and a regular hiking group?", answer: "Three things: prayer breaks are planned into the route, food is halal, and the group is built around modest kit and women-friendly options. The mountains are exactly the same." },
];

const MUSLIM_HIKING_NEAR_ME_FAQS: QuestionAnswer[] = [
  { question: "Is there Muslim hiking near me?", answer: "Most major UK cities are within 1–2 hours of a national park or Area of Outstanding Natural Beauty with Muslim hiking groups. London, Manchester, Birmingham, Leeds, Glasgow, Cardiff, Bristol, Leicester and Nottingham all have active communities. Badr Adventures runs guided Muslim hiking trips from all these cities — we organise car shares so you don't need a car." },
  { question: "How do I find a Muslim hiking group near me?", answer: "The fastest way is to search for 'Muslim hiking near me' on Instagram or Facebook — most groups post their events there. Badr Adventures runs guided Muslim hiking weekends from 8 cities across the UK, with transport arranged from a central meeting point. You can also check the Muslim Hikers network at muslimhikers.com for local chapters." },
  { question: "I don't drive — can I still join a Muslim hiking trip?", answer: "Yes. Most Badr Adventures trips arrange car shares from a major train station or city-centre meeting point. We also run trips that start from trailheads accessible by train. Message us for the nearest pick-up point to you." },
  { question: "What's the closest mountain to London for Muslim hiking?", answer: "The South Downs and the Chilterns are your closest options — Box Hill (45 min by train from London Victoria), Seven Sisters (1h 15min from London Bridge), and Ditchling Beacon (1h from London Victoria). For proper mountain terrain, the Peak District is 2h by train from St Pancras." },
  { question: "Do you run Muslim hiking trips from Manchester?", answer: "Yes — Manchester is our busiest hub. We run regular Peak District trips (Mam Tor, Kinder Scout, Stanage Edge) from Manchester Piccadilly, and Lake District weekends (Helvellyn, Catbells) from Manchester Victoria. Most trips depart Saturday morning and return Sunday evening." },
];

export type RouteConfig = {
  path: string;
  Page: ComponentType;
  seo: {
    title: string;
    description: string;
    keywords?: string[];
    ogType?: "website" | "article";
    publishedTime?: string;
    modifiedTime?: string;
  };
  jsonLd?: Array<Record<string, unknown>>;
};

export const ROUTES: RouteConfig[] = [
  {
    path: "/",
    Page: HomePage,
    seo: {
      title: "Muslim Hiking UK | Guided Hikes, Camping & Adventures | Badr Adventures",
      description:
        "The UK's #1 Muslim hiking group. Guided hikes, wild camping and family adventures in the Lake District, Peak District, Snowdonia and Scottish Highlands — with prayer breaks, halal food and women-friendly groups. Beginners welcome.",
      keywords: [
        "Muslim hiking",
        "Muslim hiking UK",
        "Muslim hikers UK",
        "halal hiking",
        "Islamic hiking group",
        "Muslim hiking club UK",
        "women's Muslim hiking",
        "family Muslim hiking",
        "Muslim hiking Lake District",
        "Muslim hiking Peak District",
        "Muslim hiking Snowdonia",
        "Muslim hiking beginners",
        "guided Muslim hikes",
      ],
      ogType: "website",
    },
    jsonLd: [organizationJsonLd(), websiteJsonLd(), authorJsonLd(), faqJsonLd(MUSLIM_HIKING_FAQS)],
  },
  {
    path: "/muslim-hiking",
    Page: MuslimHikingPage,
    seo: {
      title: "Muslim Hiking UK | Guided Hikes, Camping & Adventures | Badr Adventures",
      description:
        "Muslim hiking across the UK with Badr Adventures. Guided hikes, wild camping and family adventures in the Lake District, Peak District, Snowdonia and Scottish Highlands — with prayer breaks, halal food and women-friendly groups. Beginners welcome.",
      keywords: [
        "Muslim hiking",
        "Muslim hiking UK",
        "Muslim hikers",
        "halal hiking",
        "Islamic hiking group",
        "Muslim hiking club UK",
        "women's Muslim hiking",
        "family Muslim hiking",
        "Muslim hiking beginners",
        "Muslim hiking Lake District",
        "Muslim hiking Peak District",
        "Muslim hiking Snowdonia",
        "Muslim hiking Scotland",
      ],
      ogType: "website",
    },
    jsonLd: [
      breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Muslim Hiking", path: "/muslim-hiking" }]),
      faqJsonLd(MUSLIM_HIKING_FAQS),
      authorJsonLd(),
    ],
  },
  {
    path: "/muslim-hiking/uk",
    Page: MuslimHikingUkPage,
    seo: {
      title: "Muslim Hiking in the UK: A 2026 Guide to Guided Trips, Groups & Routes",
      description:
        "Looking for Muslim hiking in the UK? This guide covers the best regions, what to expect on a guided trip, how prayer and halal food work on the hill, and how to find a Muslim hiking group near you. Lake District, Peak District, Snowdonia, Scotland.",
      keywords: [
        "Muslim hiking UK",
        "Muslim hiking in the UK",
        "halal hiking UK",
        "Muslim hiking group UK",
        "Islamic hiking UK",
        "Muslim hiking near me",
        "sisters hiking UK",
        "family Muslim hiking UK",
      ],
      ogType: "website",
    },
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Muslim Hiking", path: "/muslim-hiking" },
        { name: "UK", path: "/muslim-hiking/uk" },
      ]),
      faqJsonLd(MUSLIM_HIKING_UK_FAQS),
    ],
  },
  {
    path: "/muslim-hiking/beginners",
    Page: MuslimHikingBeginnersPage,
    seo: {
      title: "Muslim Hiking for Beginners UK | First Mountain Guide | Badr Adventures",
      description:
        "New to Muslim hiking? Start your first UK mountain with Badr Adventures. Beginner-friendly guided hikes, prayer breaks, halal food, women-friendly groups. Lake District, Peak District & Snowdonia. From £35/day.",
      keywords: [
        "Muslim hiking beginners",
        "beginner Muslim hiking UK",
        "first Muslim hike",
        "easy Muslim hiking UK",
        "Muslim hiking starter",
        "new to Muslim hiking",
        "Muslim hiking first mountain",
      ],
      ogType: "website",
    },
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Muslim Hiking", path: "/muslim-hiking" },
        { name: "For Beginners", path: "/muslim-hiking/beginners" },
      ]),
      speakableJsonLd(),
    ],
  },
  {
    path: "/muslim-hiking/women",
    Page: MuslimHikingWomenPage,
    seo: {
      title: "Sisters-Only Muslim Hiking UK | Women's Guided Hikes | Badr Adventures",
      description:
        "Sisters-only Muslim hiking weekends across the UK. Female Mountain Leaders, sisters-only prayer space, halal food, modest by default. Lake District, Peak District, Snowdonia. Beginners welcome.",
      keywords: [
        "sisters only Muslim hiking",
        "women Muslim hiking UK",
        "Muslim women hiking group",
        "female Muslim hiking UK",
        "hijab hiking UK",
        "sisters hiking weekend",
        "women only hiking Muslim",
      ],
      ogType: "website",
    },
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Muslim Hiking", path: "/muslim-hiking" },
        { name: "For Women", path: "/muslim-hiking/women" },
      ]),
      speakableJsonLd(),
    ],
  },
  {
    path: "/muslim-hiking/near-me",
    Page: MuslimHikingNearMePage,
    seo: {
      title: "Muslim Hiking Near Me UK | Find Guided Muslim Hikes in Your City | Badr Adventures",
      description:
        "Find Muslim hiking trips near you across the UK — London, Manchester, Birmingham, Glasgow, Leeds, Bristol, Cardiff, Nottingham and more. Guided hikes with prayer breaks, halal food, women-friendly groups. Beginners welcome.",
      keywords: [
        "Muslim hiking near me",
        "Muslim hiking near London",
        "Muslim hiking near Manchester",
        "Muslim hiking near Birmingham",
        "Muslim hiking Glasgow",
        "Muslim hiking Leeds",
        "Muslim hiking Bristol",
        "Muslim hiking Nottingham",
        "Muslim hiking Cardiff",
        "sisters hiking near me",
        "guided Muslim hikes near me",
        "Muslim hiking weekend near me",
      ],
      ogType: "website",
    },
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Muslim Hiking", path: "/muslim-hiking" },
        { name: "Near Me", path: "/muslim-hiking/near-me" },
      ]),
      faqJsonLd(MUSLIM_HIKING_NEAR_ME_FAQS),
      speakableJsonLd(),
    ],
  },
  {
    path: "/blog",
    Page: BlogIndexPage,
    seo: {
      title: "Muslim Hiking Blog | Guides, Trail Tips & Stories | Badr Adventures",
      description:
        "Read the Badr Adventures blog — practical guides on Muslim hiking in the UK, prayer and halal-friendly trail tips, women's hiking groups, family adventures, and stories from the trail.",
      keywords: [
        "Muslim hiking blog",
        "hiking tips Muslim",
        "halal hiking guide",
        "Islamic outdoor adventures",
      ],
      ogType: "website",
    },
  },
  {
    path: "/hikes",
    Page: HikesPage,
    seo: {
      title: "Upcoming Muslim Hiking Trips, Weekends & Day Walks | Badr Adventures",
      description:
        "Browse upcoming Muslim hiking trips, weekends and day walks across the UK — Lake District, Peak District, Snowdonia, Yorkshire Dales, Brecon Beacons and the Scottish Highlands. All hikes guided, halal food included, prayer breaks built in.",
      keywords: [
        "Muslim hiking",
        "Muslim hiking UK",
        "halal hiking trips",
        "upcoming Muslim hiking",
        "guided Muslim hiking weekends",
        "Muslim hiking Lake District",
        "Muslim hiking Peak District",
        "Muslim hiking Snowdonia",
        "sisters only hiking UK",
      ],
      ogType: "website",
    },
  },
  {
    path: "/about",
    Page: AboutPage,
    seo: {
      title: "About Badr Adventures | The Team Behind the UK's Leading Muslim Hiking Group",
      description:
        "Meet the qualified Mountain Training guides behind Badr Adventures, the UK's leading Muslim hiking group. Learn how the trips are run, what makes our Muslim hiking weekends different, and our safety standards.",
      keywords: ["about Badr Adventures", "guided Muslim hiking group", "Mountain Training guides", "Muslim hikers UK", "halal hiking UK"],
      ogType: "website",
    },
  },
  {
    path: "/contact",
    Page: ContactPage,
    seo: {
      title: "Contact Badr Adventures | Bookings, Questions & Group Enquiries",
      description:
        "Get in touch with Badr Adventures. Booking questions, group enquiries, custom trips, and press contact. We reply within one working day.",
      keywords: ["contact Badr Adventures", "hiking group enquiries UK", "book a hike"],
      ogType: "website",
    },
  },
  {
    path: "/rent",
    Page: RentPage,
    seo: {
      title: "Rent Hiking & Camping Kit for Muslim Hiking Trips | Badr Adventures",
      description:
        "Rent hiking and camping kit for your Muslim hiking trip from Badr Adventures. Tents, sleeping bags, stoves, waterproofs — delivered to your meeting point. UK-wide shipping on multi-day trips.",
      keywords: ["hiking kit rental UK", "camping gear rental", "rent tent UK", "Muslim hiking kit", "halal hiking gear"],
      ogType: "website",
    },
  },
  {
    path: "/privacy",
    Page: PrivacyPage,
    seo: {
      title: "Privacy Notice | Badr Adventures UK",
      description:
        "Privacy notice for badradventures.co.uk. What we collect, why, how long we keep it, and your rights under UK GDPR.",
      keywords: ["privacy notice Badr Adventures", "UK GDPR hiking site"],
      ogType: "website",
    },
  },
  {
    path: "/cookies",
    Page: CookiesPage,
    seo: {
      title: "Cookie Policy | Badr Adventures UK",
      description:
        "Cookie policy for badradventures.co.uk — which cookies we set, why, and how to change your preferences.",
      keywords: ["cookie policy Badr Adventures", "manage cookies UK"],
      ogType: "website",
    },
  },
  {
    path: "/terms",
    Page: TermsPage,
    seo: {
      title: "Terms & Conditions | Badr Adventures UK",
      description:
        "Terms and conditions for booking hikes, kit rentals, and events with Badr Adventures UK Ltd.",
      keywords: ["terms and conditions Badr Adventures", "booking terms UK"],
      ogType: "website",
    },
  },
  {
    path: "/refund",
    Page: RefundPage,
    seo: {
      title: "Refund Policy | Badr Adventures UK",
      description:
        "Refund policy for Badr Adventures hikes, kit rentals, and events. Clear, fair, and based on UK Consumer Contracts Regulations.",
      keywords: ["refund policy Badr Adventures", "hike cancellation UK"],
      ogType: "website",
    },
  },
  {
    path: "/blog/prayer-on-the-trail-muslim-hikers",
    Page: BlogPostPage,
    seo: {
      title: "Prayer on the Trail: A Practical Guide for Muslim Hikers",
      description:
        "How to pray salah on a UK hike — wudu with limited water, finding a clean spot, combining prayers, dhuhr at the summit, and what every guide should know about Muslim prayer breaks.",
      keywords: [
        "prayer on a hike",
        "Muslim prayer outdoors",
        "salah while hiking",
        "wudu on a hike",
        "dhuhr on a mountain",
      ],
      ogType: "article",
      publishedTime: "2026-06-30T08:00:00Z",
      modifiedTime: "2026-06-30T08:00:00Z",
    },
    jsonLd: [
      articleJsonLd({
        headline: "Prayer on the Trail: A Practical Guide for Muslim Hikers",
        description:
          "How to pray salah on a UK hike — wudu with limited water, finding a clean spot, combining prayers, dhuhr at the summit, and what every guide should know about Muslim prayer breaks.",
        author: "Saif Mahmood",
        publisher: "Badr Adventures UK Ltd",
        datePublished: "2026-06-30",
        dateModified: "2026-06-30",
        image: "/og-default.png",
        mainEntityOfPage: "/blog/prayer-on-the-trail-muslim-hikers",
      }),
      authorJsonLd(),
    ],
  },
  {
    path: "/blog/muslim-hiking-uk-complete-guide",
    Page: BlogPostPage,
    seo: {
      title: "Muslim Hiking in the UK: The Complete Beginner's Guide (2026)",
      description:
        "Everything you need to know about Muslim hiking in the UK - what to wear, prayer on the trail, halal food, women's groups, and the best beginner hikes in the Lake District, Peak District and Snowdonia.",
      keywords: [
        "Muslim hiking UK",
        "Muslim hiking for beginners",
        "halal hiking",
        "prayer on a hike",
      ],
      ogType: "article",
      publishedTime: "2026-06-28T08:00:00Z",
      modifiedTime: "2026-06-28T08:00:00Z",
    },
    jsonLd: [
      articleJsonLd({
        headline: "Muslim Hiking in the UK: The Complete Beginner's Guide (2026)",
        description:
          "Everything you need to know about Muslim hiking in the UK - what to wear, prayer on the trail, halal food, women's groups, and the best beginner hikes in the Lake District, Peak District and Snowdonia.",
        author: "Saif Mahmood",
        publisher: "Badr Adventures UK Ltd",
        datePublished: "2026-06-28",
        dateModified: "2026-06-28",
        image: "/og-default.png",
        mainEntityOfPage: "/blog/muslim-hiking-uk-complete-guide",
      }),
      authorJsonLd(),
    ],
  },
  {
    path: "/blog/muslim-womens-hiking-groups-uk",
    Page: BlogPostPage,
    seo: {
      title: "Muslim Women's Hiking Groups in the UK: A 2026 List",
      description:
        "A directory of Muslim women's hiking groups across the UK — sisters-only hikes, mixed groups with separate turn-outs, and beginner-friendly weekend walks in the Lake District, Peak District, Snowdonia and the South East.",
      keywords: [
        "Muslim women hiking UK",
        "sisters hiking group",
        "women only hiking",
        "Muslim women's outdoor group",
      ],
      ogType: "article",
      publishedTime: "2026-06-30T08:00:00Z",
      modifiedTime: "2026-06-30T08:00:00Z",
    },
    jsonLd: [
      articleJsonLd({
        headline: "Muslim Women's Hiking Groups in the UK: A 2026 List",
        description:
          "A directory of Muslim women's hiking groups across the UK — sisters-only hikes, mixed groups with separate turn-outs, and beginner-friendly weekend walks in the Lake District, Peak District, Snowdonia and the South East.",
        author: "Saif Mahmood",
        publisher: "Badr Adventures UK Ltd",
        datePublished: "2026-06-30",
        dateModified: "2026-06-30",
        image: "/og-default.png",
        mainEntityOfPage: "/blog/muslim-womens-hiking-groups-uk",
      }),
      authorJsonLd(),
    ],
  },
  {
    path: "/blog/halal-friendly-hiking-pack-eat-stop",
    Page: BlogPostPage,
    seo: {
      title: "Halal-Friendly Hiking: What to Pack, What to Eat, Where to Stop",
      description:
        "A practical field guide to keeping halal on a UK day hike — from the food you pack in your bag, to the pub lunch you can still order, to finding halal food near popular national parks.",
      keywords: [
        "halal hiking",
        "halal food on a hike",
        "Muslim hiking food",
        "halal pub lunch",
      ],
      ogType: "article",
      publishedTime: "2026-06-30T08:00:00Z",
      modifiedTime: "2026-06-30T08:00:00Z",
    },
    jsonLd: [
      articleJsonLd({
        headline: "Halal-Friendly Hiking: What to Pack, What to Eat, Where to Stop",
        description:
          "A practical field guide to keeping halal on a UK day hike — from the food you pack in your bag, to the pub lunch you can still order, to finding halal food near popular national parks.",
        author: "Saif Mahmood",
        publisher: "Badr Adventures UK Ltd",
        datePublished: "2026-06-30",
        dateModified: "2026-06-30",
        image: "/og-default.png",
        mainEntityOfPage: "/blog/halal-friendly-hiking-pack-eat-stop",
      }),
      authorJsonLd(),
    ],
  },
  {
    path: "/blog/family-friendly-hikes-muslim-families-uk",
    Page: BlogPostPage,
    seo: {
      title: "Family Friendly Hiking UK: Best Walks for Muslim Families & Kids",
      description:
        "A complete guide to family friendly hiking for Muslim families in the UK. Six pushchair-friendly, prayer-friendly walks in the Lake District, Peak District, Snowdonia and the South Downs — with halal food stops, short distances, and routes sized for kids aged 4 to 12.",
      keywords: [
        "family friendly hiking",
        "family hiking UK",
        "family friendly hiking UK",
        "hikes with kids UK",
        "pushchair friendly walks",
        "Muslim family days out",
        "Muslim family hiking",
      ],
      ogType: "article",
      publishedTime: "2026-06-30T08:00:00Z",
      modifiedTime: "2026-06-30T08:00:00Z",
    },
    jsonLd: [
      articleJsonLd({
        headline: "Family Friendly Hiking UK: Best Walks for Muslim Families & Kids",
        description:
          "A complete guide to family friendly hiking for Muslim families in the UK. Six pushchair-friendly, prayer-friendly walks in the Lake District, Peak District, Snowdonia and the South Downs — with halal food stops, short distances, and routes sized for kids aged 4 to 12.",
        author: "Saif Mahmood",
        publisher: "Badr Adventures UK Ltd",
        datePublished: "2026-06-30",
        dateModified: "2026-06-30",
        image: "/og-default.png",
        mainEntityOfPage: "/blog/family-friendly-hikes-muslim-families-uk",
      }),
      authorJsonLd(),
    ],
  },
  {
    path: "/blog/islamic-perspective-hiking-outdoors",
    Page: BlogPostPage,
    seo: {
      title: "The Islamic Perspective on Hiking and the Outdoors: Why It Matters",
      description:
        "From the Prophet's ﷺ love of travel to the Quranic call to reflect on the mountains, the Islamic case for getting outside is older than the UK national parks. A short, sourced read.",
      keywords: [
        "Islamic perspective on hiking",
        "Muslim outdoor adventure",
        "Islam and nature",
        "reflection on mountains Islam",
      ],
      ogType: "article",
      publishedTime: "2026-06-30T08:00:00Z",
      modifiedTime: "2026-06-30T08:00:00Z",
    },
    jsonLd: [
      articleJsonLd({
        headline: "The Islamic Perspective on Hiking and the Outdoors: Why It Matters",
        description:
          "From the Prophet's ﷺ love of travel to the Quranic call to reflect on the mountains, the Islamic case for getting outside is older than the UK national parks. A short, sourced read.",
        author: "Saif Mahmood",
        publisher: "Badr Adventures UK Ltd",
        datePublished: "2026-06-30",
        dateModified: "2026-06-30",
        image: "/og-default.png",
        mainEntityOfPage: "/blog/islamic-perspective-hiking-outdoors",
      }),
      authorJsonLd(),
    ],
  },
  {
    path: "/muslim-camping/uk",
    Page: MuslimCampingUkPage,
    seo: {
      title: "Muslim Camping UK | Guided Wild Camping & Halal Camping Weekends | Badr Adventures",
      description:
        "Muslim camping across the UK with Badr Adventures. Guided wild camping weekends, family camping trips, sisters-only camps, and halal camping in the Lake District, Peak District, Snowdonia and the Scottish Highlands. Prayer breaks, halal food, all gear provided.",
      keywords: [
        "Muslim camping UK",
        "halal camping UK",
        "Muslim wild camping",
        "Muslim camping trips UK",
        "sisters only camping UK",
        "family camping UK Muslim",
        "guided camping weekend UK",
        "Muslim camping Lake District",
        "halal camping weekend",
        "Muslim camping group UK",
      ],
      ogType: "website",
    },
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Muslim Camping UK", path: "/muslim-camping/uk" },
      ]),
      speakableJsonLd(),
    ],
  },
  {
    path: "/family-hiking",
    Page: FamilyHikingPage,
    seo: {
      title: "Family Hiking UK | Muslim Family-Friendly Hikes & Adventures | Badr Adventures",
      description:
        "Family-friendly Muslim hiking across the UK. Short, pushchair-friendly walks, kid-safe mountain hikes, family camping weekends, and prayer-friendly routes designed for families with children of all ages. Lake District, Peak District, Snowdonia.",
      keywords: [
        "family hiking UK",
        "family friendly hiking",
        "Muslim family hiking",
        "family hiking Lake District",
        "family hiking Peak District",
        "hiking with kids UK",
        "Muslim family days out",
        "pushchair friendly walks UK",
        "family wild camping UK",
        "kids hiking UK Muslim",
      ],
      ogType: "website",
    },
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Family Hiking UK", path: "/family-hiking" },
      ]),
      speakableJsonLd(),
    ],
  },
  {
    path: "/muslim-hiking/guide",
    Page: MuslimHikingGuidePage,
    seo: {
      title: "The Complete Muslim Hiking Guide: Kit, Prayer, Safety & UK Routes | Badr Adventures",
      description: "Your complete guide to Muslim hiking in the UK. What kit you need, how to pray on the trail, halal food on the hill, navigation tips, and how to book a guided hike with Badr Adventures.",
      keywords: ["muslim hiking guide", "complete muslim hiking guide", "muslim hiking how to", "halal hiking tips", "prayer on a hike guide", "muslim hiking gear"],
      ogType: "website",
    },
    jsonLd: [
      breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Muslim Hiking", path: "/muslim-hiking" }, { name: "Guide", path: "/muslim-hiking/guide" }]),
      firstMuslimHikeHowToJsonLd(),
      speakableJsonLd(),
    ],
  },
  {
    path: "/muslim-hiking/equipment",
    Page: MuslimHikingEquipmentPage,
    seo: {
      title: "Muslim Hiking Equipment: Kit List, Prayer Gear & Halal Trail Food | Badr Adventures",
      description: "Complete Muslim hiking kit guide. Boots, waterproofs, prayer mats, qibla compass, wudu supplies, halal trail food, modest hiking clothes — every item you need for a Muslim hike in the UK.",
      keywords: ["muslim hiking equipment", "muslim hiking kit", "halal hiking gear", "modest hiking clothes", "hiking prayer mat", "wudu on a hike", "qibla compass hiking"],
      ogType: "website",
    },
    jsonLd: [
      breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Muslim Hiking", path: "/muslim-hiking" }, { name: "Equipment", path: "/muslim-hiking/equipment" }]),
      muslimHikingKitHowToJsonLd(),
      speakableJsonLd(),
    ],
  },
  {
    path: "/muslim-hiking/ramadan",
    Page: MuslimHikingRamadanPage,
    seo: {
      title: "Ramadan Hiking UK: Fasting, Iftar Hikes & Night Walks | Badr Adventures",
      description: "Ramadan hiking in the UK — fasting on the trail, iftar at the summit, night hikes under the stars, and how Muslim hikers adapt their outdoor adventures for the blessed month.",
      keywords: ["ramadan hiking", "iftar hike", "fasting hiking", "muslim hiking ramadan", "night hike ramadan", "suhoor hike", "muslim hiking iftar"],
      ogType: "website",
    },
    jsonLd: [
      breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Muslim Hiking", path: "/muslim-hiking" }, { name: "Ramadan", path: "/muslim-hiking/ramadan" }]),
      ramadanHikingHowToJsonLd(),
      speakableJsonLd(),
    ],
  },
  // Catch-all 404 — included so we can index it with noindex via the page itself.
  {
    path: "/404",
    Page: NotFoundPage,
    seo: {
      title: "Page not found | Badr Adventures",
      description: "The page you're looking for has moved or doesn't exist.",
      ogType: "website",
    },
  },
];

export const HIDDEN_ROUTES = new Set<string>([
  "/sign-in",
  "/sign-up",
  "/admin",
  "/account",
  "/bookings",
  "/cart",
  "/bookings/success",
  "/booking-success",
]);

export const SITE_BASE = SITE;
