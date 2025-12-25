# Anime Tracking App — Product Requirements Document (PRD)

## 1. Product Overview

### Product Name

TBD (working title: AutoTrack Anime)

### Summary

A modern, data-first anime tracking platform that allows users to track, rate, review, and share anime they’ve watched, with a strong emphasis on automatic episode tracking, public SEO-driven anime pages, and personal analytics.

The product is designed to replace MyAnimeList and AniList as the primary system of record for anime fans by:

- Eliminating manual tracking friction
- Embracing streaming-first behavior
- Leveraging SEO and social sharing for growth
- Being extensible without architectural dead ends

## 2. Product Strategy & Positioning

Market:

- Consumer app

Identity Model:

- Handle-based usernames
- Real identity optional
- Usernames are the primary public identifier

Product Philosophy:

- Data-first
- Opinions are valuable, but structured data is the foundation
- Analytics, insights, and discovery are core value props

Hero Feature:
Automatic tracking via streaming integrations

- Free for all users
- Rate-limited for non-premium users
- Primary user acquisition strategy
- Designed defensively so the core app works without it

## 3. Goals & Success Metrics

Primary Goals:

- Minimize manual tracking effort
- Encourage habitual usage
- Drive organic acquisition via SEO and sharing

Success Metrics:

- % of users with at least one tracked anime
- % of users using auto-tracking
- Weekly Active Users
- Profile share rate
- 30 / 90 day retention

## 4. Technical Stack

Primary Database:

- Postgres (system of record)

Search:

- Meilisearch (titles, fuzzy matching, facets)

Cache & Queues:

- Redis (caching, rate limiting, background jobs)

Object Storage:

- S3 or Cloudflare R2 (share images, banners)

## 5. Canonical Data Rules

Internal anime.id is the only canonical identifier.
External IDs (MAL, AniList, Kitsu) are reference-only metadata.
User data must never depend on external IDs.

## 6. Core Data Models

Anime:

- id (UUID)
- titles (english, romaji, japanese)
- format
- episode_count
- episode_duration
- season
- start_date / end_date
- synopsis
- ratings & popularity
- status
- external_ids (JSONB)
- edition (JSONB)

User:

- id
- username
- display_name
- email
- avatar_url
- created_at

UserAnime:

- user_id
- anime_id
- status
- current_episode
- rating
- review
- rewatch_count
- last_rewatch_at
- started_at
- completed_at
- updated_at

Follow:

- follower_id
- following_id
- created_at

## 7. Episode-Level Tracking (Planned)

The system will support episode-level tracking without breaking existing data.

Future table:

- user_episode (user_id, anime_id, episode_number, watched, watched_at, rewatch_count)

Constraints:

- current_episode must be derivable
- no assumption of linear progression
- status must be recalculable

## 8. Rewatch Tracking

- Rewatching is a first-class concept
- Track rewatch count and last rewatch date
- Episode-level rewatches supported later

## 9. Multiple Versions / Editions

Support multiple editions:

- TV
- Movies
- Director’s cuts
- Recaps

Approach:

- Optional edition metadata
- UI defaults to primary edition

## 10. Search Architecture

Meilisearch index:

- titles
- format
- season
- studios
- streaming platforms

Ranking:

- relevance
- popularity
- average rating

## 11. Public Pages & SEO

Anime pages are public and indexable.

Page types:

- /anime/:slug
- /studio/:slug
- /season/:season-year
- /where-to-watch/:anime-slug
- /genre/:genre

SEO pages funnel users into signup and tracking.

## 12. Automatic Tracking (Defensive Design)

Constraints:

- No DRM circumvention
- No video scraping
- Passive playback detection only
- Manual override always available

Failure Tolerance:

- Core app always usable
- Manual tracking always works
- Auto-tracking degrades gracefully

## 13. Background Jobs

Redis-backed job system handles:

- Imports
- Search indexing
- Auto-tracking validation
- Analytics aggregation
- Recap generation
- Notifications

Requirements:

- Idempotent jobs
- Retries with backoff
- Dead-letter queues
- Observability

## 14. Analytics & Insights

Examples:

- Episodes watched per week
- Completion rate
- Rewatch frequency
- Studio and genre affinity

Premium expansion:

- Exports
- Long-term trends

## 15. Growth & Viral Loops

Sharing:

- Monthly and yearly recap cards
- Public profiles
- Deep links

Notifications:

- New followers
- Taste overlap alerts
- Recaps ready
- Streaming availability alerts

SEO loops:

- Anime pages to signup
- Where-to-watch pages to tracking

## 16. Content Moderation (Planned)

- Report reviews
- Hide or remove content
- Admin audit logs
- Soft deletes

## 17. Privacy & Data Deletion

Schemas must support:

- Full user deletion
- Review anonymization
- Cascading deletes
- No orphaned records

## 18. Non-Goals

- Forums
- News aggregation
- Merch store
- Episode discussion threads

## 19. Monetization (Later)

- Premium analytics
- Higher auto-tracking limits
- Private lists
- Advanced filters
- API access

## 20. Milestones

Phase 1:

- Core schema
- Auth
- Tracking
- Search
- Public anime pages
- Public profiles

Phase 2:

- Imports
- Analytics
- Sharing

Phase 3:

- Episode-level tracking
- Auto-tracking at scale
- Premium features
- Public API
