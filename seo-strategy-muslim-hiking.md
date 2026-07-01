# Badr Adventures — SEO + GEO Strategy for "#1 Muslim Hiking"

**Target:** Rank #1 in Google Search + AI Search (ChatGPT, Perplexity, Google AI Overviews) for "Muslim Hiking" and all keyword variations.

**Date:** 1 July 2026 | **Author:** Zo (on behalf of Badr Adventures UK Ltd)

---

## Current State: What We've Already Built

| Metric | Status |
|---|---|
| SSR Prerender (all pages crawlable) | ✅ 22 routes |
| `llms.txt` for AI crawlers | ✅ 40+ links |
| robots.txt (AI bots allowed) | ✅ GPTBot, Perplexity, Claude, CCBot, Google-Extended |
| Sitemap (static + blog) | ✅ 4 sitemaps in index |
| JSON-LD: LocalBusiness | ✅ Registered office, geo, area served, opening hours |
| JSON-LD: FAQPage | ✅ On all 4 hub pages + homepage |
| JSON-LD: Article / BlogPosting | ✅ On all 6 blog posts |
| JSON-LD: Website (search action) | ✅ |
| JSON-LD: WebSite | ✅ |
| JSON-LD: BreadcrumbList | ✅ On every page |
| JSON-LD: Person (Author) | ✅ Saif Mahmood + qualifications |
| JSON-LD: SpeakableSpecification | ✅ Setup ready |
| JSON-LD: TouristTrip + Event (per hike) | ✅ For DB-driven hike detail pages |
| OG / Twitter cards | ✅ On every page |
| Canonical URLs | ✅ Every page |
| Keyword meta tags | ✅ Every content page |
| Google Search Console verified | ✅ |
| Content: Pillar pages | 5 pages (main, UK, beginners, women, near-me) |
| Content: Blog posts | 6 posts (prayer, beginners guide, women's groups, halal food, family, Islamic perspective) |

---

## Phase 1: Finish Content Scaffolding (Done This Session)

### ✅ What was just built
- `/muslim-hiking/near-me` — new pillar page targeting 12 city-level "near me" keywords
- All 5 Muslim Hiking pillar pages now prerendered in sitemap
- `llms.txt` updated with all new pages
- SEO checker passing 22/22 routes

### 🔜 Next pages to create
| Page | Target Keywords | Priority |
|---|---|---|
| `/muslim-hiking/guide` | "muslim hiking guide", "complete guide to muslim hiking" | High |
| `/muslim-hiking/equipment` | "muslim hiking gear", "hiking kit for muslims", "modest hiking clothes" | Medium |
| `/muslim-hiking/ramadan` | "ramadan hiking", "iftar hike", "muslim hiking ramadan" | Medium |
| `/blog/hiking-near-[city]` | "muslim hiking near Manchester", "muslim hiking near Birmingham", etc. | Medium |

---

## Phase 2: Technical SEO Improvements

### 📍 Google Business Profile (Critical — Do This This Week)
The single highest-ROI SEO action for local pack + map pack rankings:
1. Go to https://business.google.com/create
2. Create profile for "Badr Adventures" — category: "Outdoor Activity Organiser" or "Tour Operator"
3. Use exact NAP from JSON-LD: `106 Castlesteads Drive, Carlisle, CA2 7XD`
4. Add photos (hike summits, group shots, gear)
5. Get 5+ Google reviews from real hikers

### 🔗 Internal Linking Audit
| Action | Impact |
|---|---|
| Link from homepage hero → `/muslim-hiking` with keyword anchor | ✅ Done |
| Link from `/muslim-hiking` → all 4 sub-pages with keyword anchors | ✅ Done |
| Blog posts link to each other | ⚠️ Add cross-links |
| Blog posts link to `/hikes` with keyword anchor | ✅ Done |
| Add "Related reading" section to blog posts | ⚠️ Not implemented |

### 🏗️ Structured Data Gaps
| Schema Type | Existing | Needed |
|---|---|---|
| LocalBusiness | ✅ | Tighten geo coordinates |
| HowTo | ❌ | Add to "Prayer on Trail" blog post |
| VideoObject | ❌ | For future YouTube content |
| ItemList | ❌ | For `/hikes` page |
| LocalBusiness → hasOfferCatalog | ❌ | For rental gear |

### ⚡ Core Web Vitals
- Site is Vite + React SPA with Tailwind — should be fast
- Run PageSpeed Insights at https://pagespeed.web.dev
- Target: 90+ on mobile for LCP, FID, CLS

---

## Phase 3: AI Search / Generative Engine Optimization (GEO)

### What AI search engines need
| Signal | How We Meet It |
|---|---|
| Crawlable HTML | ✅ Prerender — no JS gating |
| `llms.txt` | ✅ Live at `/llms.txt` |
| Clear answers at page top | ⚠️ Adding `data-speakable` tags |
| FAQ schema | ✅ On 4 pages — actively expand |
| Author E-E-A-T | ✅ Person schema for Saif |
| External citations | ❌ **Critical gap** — backlinks needed |
| Concise, extractable paragraphs | ⚠️ Some sections are too salesy |
| Cited stats/evidence | ⚠️ Add more concrete numbers |

### 3-Minute Answer Blocks (GEO priority)
Every key page should have a "3-minute answer" section at the top — a concise, extractable block that answers the core question. Currently:
- ✅ /muslim-hiking/beginners has "What is Muslim hiking for beginners?" section
- ✅ /muslim-hiking/women has "What's actually involved" section
- ⚠️ /muslim-hiking needs one
- ⚠️ /muslim-hiking/uk needs one

These blocks should be wrapped in `data-speakable="true"` and formatted for AI extraction.

---

## Phase 4: Backlink & Authority Building (The #1 Gap)

### Current Backlink Profile
| Site | Backlinks to Badr Adventures |
|---|---|
| Muslim Hikers (haroonmota) | 0 |
| Muslim Hikers (activeinclusionnetwork) | 0 |
| Any .gov/.ac.uk | 0 |
| Outdoor gear brands | 0 |
| Muslim community sites | 0 |

### Backlink Strategy (Prioritised)

#### Tier 1 — Quick Wins (1-2 weeks)
1. **Muslim community directories**: Get listed on Muslimmosques.com, MuslimDirectory.co.uk, HalalBooking, and similar
2. **Eventbrite**: Create an Eventbrite page → links back (Muslim Hikers already does this)
3. **Meetup.com**: Create a "Muslim Hiking UK" group → links back
4. **Outdoor diversity directories**: Black2Nature, Melanin Base Camp, Diversify Outdoors — reach out for inclusion
5. **Google Business Profile** (mentioned above) — local SEO boost

#### Tier 2 — Press & Guest Posts (1-3 months)
1. **Local press**: Carlisle/Lake District local news — "Local Muslim hiking group launches guided Lake District trips" — pitch to News & Star, Cumbria Crack, BBC Cumbria
2. **Guest post**: Offer "A Guide to Muslim-Friendly Hiking in the Lake District" to: OutdoorLads, The Great Outdoors magazine, Country Walking, Trail magazine
3. **Podcast appearances**: Muslim podcasts (Salaam Hi Tech, Halal Travel Podcast, The Muslim Vibe)
4. **Link insertions**: Find existing "muslim hiking" articles that don't link to any specific group — contact editors to add Badr Adventures as a recommended provider

#### Tier 3 — Digital PR (3-6 months)
1. **Data-driven story**: "100% of UK Muslim hikers report X" — survey your community, publish results, pitch to BBC/hiking press
2. **Seasonal angle**: "Ramadan 2027: The surge in Muslim hiking" — data on iftar hikes growth, pitch to Ramadan-focused media
3. **Charity partnership**: Hike for charity (fundraise for Muslim charity), gets press coverage + backlinks

#### Tier 4 — Niche Edits (Ongoing)
- Find broken links on outdoor websites → suggest replacing with Badr Adventures
- Find "best hiking groups" roundups → suggest inclusion

---

## Phase 5: Social Proof & Community

### Instagram Strategy
| Action | Details |
|---|---|
| @badradventures profile | Optimise bio: "UK's #1 Muslim Hiking Group · Guided Lake District hikes · Prayer breaks · Halal food · Sisters-only weekends" |
| Content pillars | Summit photos, educational (prayer on trail), testimonials, behind-the-scenes, gear reviews |
| Reels | Short-form: "How we pray Dhuhr at 900m", "What I pack as a Muslim hiker", "5 beginner tips" |
| Hashtags | #MuslimHiking #HalalHiking #MuslimOutdoors #LakeDistrictHikes #MuslimHikers |
| Collaborations | Tag @muslim.hikers, @active.inclusion, @wanderlust_women, outdoor gear brands |

### YouTube Strategy
- "What Muslim hiking actually looks like" (vlog style)
- "How to pray on a UK mountain" (educational)
- "Lake District weekend with Badr Adventures" (cinematic)
- Embed on blog posts for rich snippets

### Google Reviews
- Every finished hike → email asking for Google review (with direct link)
- Target: 50+ reviews within 6 months

---

## Phase 6: Monitoring & Measurement

### Track These Keywords (Weekly)
| Keyword | Current Position | Target |
|---|---|---|
| muslim hiking | ❓ | #1 |
| muslim hiking UK | ❓ | #1 |
| muslim hiking near me | ❓ | #1 in local pack |
| muslim hiking beginners | ❓ | #1 |
| muslim hiking women | ❓ | #1 |
| halal hiking UK | ❓ | #1 |
| sisters only hiking UK | ❓ | #1 |
| muslim hiking Lake District | ❓ | #1 |
| muslim hiking group UK | ❓ | #1 |
| guided muslim hikes UK | ❓ | #1 |

### AI Search Tracking (Monthly)
| Engine | Criterion |
|---|---|
| Perplexity | Is badradventures.co.uk cited in answers to "what is Muslim hiking"? |
| ChatGPT Search | Is Badr Adventures recommended for "muslim hiking UK"? |
| Google AI Overviews | Does the site appear in AI summaries for "muslim hiking"? |
| Claude/Gemini | Same checks |

### Metrics to Watch
| Metric | Baseline | 3-Month Target | 6-Month Target |
|---|---|---|---|
| Organic traffic (Search Console) | ❓ | +300% | +1000% |
| Backlinks (Ahrefs/Moz) | ~0 | 15 | 50+ |
| Google reviews | 0 | 20 | 50+ |
| Prerendered pages indexed | 22/22 | 28/28 | 35/35 |
| AI search citations | 0 | 3 | 10+ |
| Keyword #1 rankings | 0 | 3 | 8+ |

---

## Immediate Next Steps (This Week)

| # | Action | Owner |
|---|---|---|
| 1 | **Create Google Business Profile** → get listed in local map pack | You |
| 2 | **Run PageSpeed Insights** → fix any Core Web Vitals issues | Zo |
| 3 | **Eventbrite page** → list hikes with link back to badradventures.co.uk | You |
| 4 | **Meetup.com group** → "Muslim Hiking UK" with link | You |
| 5 | **Instagram → @badradventures** → start posting Reels weekly | You |
| 6 | **Google reviews** → email template for post-hike review ask | Zo |
| 7 | **Submit to Muslim directories** (MuslimDirectory.co.uk, etc.) | You |
| 8 | **Pitch local press** — "Carlisle's Muslim hiking group" | You/Zo |
| 9 | **Create remaining pillar pages** (Guide, Equipment, Ramadan) | Zo |
| 10 | **Weekly rank tracking** — report back | You/Zo |

---

## Summary: The Path to #1

```
                                    WEEKS 1-2          WEEKS 3-8         MONTHS 3-6
                                    ─────────────────────────────────────────────────
Google Business Profile             ████████░░░░
Backlinks (directories)             ████████░░░░
Additional content pages            ████████████░░
GEO (speakable + answer blocks)     ████████████░░
Eventbrite / Meetup                 ████████░░░░
Instagram launch                    ████████░░░░
Press outreach (local + hiking)     ░░░░████████░░
Guest posts + link insertions       ░░░░████████░░
Google reviews                      ░░░░████████████████
Podcasts / digital PR               ░░░░░░░░████████
Charity partnership                 ░░░░░░░░████████
YouTube launch                      ░░░░░░░░████████
```

The technical foundation is already best-in-class. The #1 gap is **authority signals** — backlinks, Google reviews, social proof, and community presence. Build those, and the on-page content will do the rest.
