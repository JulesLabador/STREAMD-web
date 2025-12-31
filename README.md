This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Architecture

### Home Page (Season Hub)

The home page serves as a dynamic seasonal command center that answers: "What anime should I care about right now?"

**Sections:**
1. **Hero Search + Seasonal Context** - Large search input with keyboard shortcut (/) and current season stats banner
2. **This Season at a Glance** - Most Popular and Highest Rated carousels for the current anime season
3. **Upcoming Anime** - Next season preview with countdown, stats cards, and Most Anticipated carousel
4. **Discovery & Exploration** - Trending studios and browse path links (Seasons, Genres, Studios, Platforms)

**Components (in `src/components/home/`):**
- `HeroSection.tsx` - Hero with search and seasonal context
- `AnimeCarousel.tsx` - Reusable horizontal scrollable anime card row
- `SeasonSection.tsx` - Current season carousels container
- `UpcomingSection.tsx` - Next season preview with stats
- `DiscoverySection.tsx` - Discovery modules and browse paths
- `StudioSpotlight.tsx` - Featured studios grid

**Server Actions (in `src/app/actions/anime.ts`):**
- `getCurrentSeasonAnime(sortBy, limit)` - Fetches anime for current season sorted by popularity or rating
- `getSeasonalStats()` - Returns current season statistics (anime count, airing count, new series)
- `getCurrentSeasonStudios(limit)` - Fetches studios with most anime in current season

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Your Supabase project URL (found in Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase publishable key (found in Project Settings > API)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key

# Your Supabase secret key (found in Project Settings > API)
# WARNING: This key bypasses Row Level Security - keep it secret!
# Only used for admin operations like bulk imports
SUPABASE_SECRET_KEY=your-secret-key

# Site URL for sitemap generation (used by next-sitemap)
# Set this to your production domain
SITE_URL=https://www.streamdanime.io

# OpenAI API key for AI-generated SEO content (optional)
# Required only if using the generate:season-content script
OPENAI_API_KEY=your-openai-api-key

# IndexNow API key for instant search engine notifications (optional)
# Generate a 32-character hex string (e.g., using: openssl rand -hex 16)
# When set, URLs are automatically submitted to search engines on every build
INDEXNOW_KEY=your-32-character-hex-key
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Scripts

### Import Anime Data

To import anime data from `anime.json` into the database:

```bash
npm run import:anime
```

This script:

- Reads the `anime.json` file from the project root
- Transforms and maps fields to the database schema
- Creates studios on-the-fly and links them via junction tables
- Creates streaming platform links
- Processes records in batches of 100
- Uses upsert to allow re-running without duplicates

**Requirements:**

- `anime.json` file in the project root
- Valid Supabase credentials in `.env.local`
- Database tables must already exist (see `docs/technical-spec.md`)

### Generate Season SEO Content

To generate AI-powered SEO content for season pages:

```bash
# First, install the OpenAI package
npm install openai

# Generate content for a specific season
npm run generate:season-content -- --season winter --year 2026

# Generate content for all seasons in a year
npm run generate:season-content -- --year 2025

# Generate content for all seasons in the database
npm run generate:season-content -- --all

# Force regenerate all content
npm run generate:season-content -- --all --force
```

This script:

- Fetches season data (anime count, top titles, genres, format breakdown)
- Calls OpenAI GPT-4o to generate contextual SEO content
- Stores meta descriptions, intro paragraphs, and full summaries in the database
- Generates different content for past, current, and future seasons

**Requirements:**

- `OPENAI_API_KEY` environment variable set in `.env.local`
- Valid Supabase credentials in `.env.local`
- Database migration `011_season_content.sql` must be applied

## SEO & Sitemap

This project uses [next-sitemap](https://github.com/iamvishnusankar/next-sitemap) for automatic sitemap generation.

### How it works

1. **Static sitemap** (`sitemap.xml`): Generated at build time for static routes (home, browse pages)
2. **Dynamic sitemap** (`server-sitemap.xml`): Generated on-demand for dynamic routes (anime, genres, studios, seasons, platforms)
3. **robots.txt**: Auto-generated with proper crawl directives

### Configuration

The sitemap configuration is in `next-sitemap.config.js`. Key settings:

- **siteUrl**: Set via `SITE_URL` environment variable (defaults to `https://www.streamdanime.io`)
- **changefreq**: Weekly for most pages, daily for browse index pages
- **priority**: 1.0 for home, 0.9 for browse indexes, 0.8 for category pages, 0.7 for anime pages

### Generated files

After running `npm run build`, the following files are generated in `/public`:

- `sitemap.xml` - Main sitemap index
- `sitemap-0.xml` - Static routes sitemap
- `robots.txt` - Search engine directives

The dynamic sitemap is served at `/server-sitemap.xml` and fetches all anime, genres, studios, seasons, and platforms from the database.

### IndexNow Integration

This project supports [IndexNow](https://www.indexnow.org/) for instant search engine notifications. When enabled, all URLs from your sitemaps are automatically submitted to supported search engines (Bing, Yandex, Seznam, Naver) after every build.

**Setup:**

1. Generate a 32-character hex key:
   ```bash
   openssl rand -hex 16
   ```

2. Add the key to your environment variables:
   ```env
   INDEXNOW_KEY=your-generated-key
   ```

3. The build process will automatically:
   - Create a verification file at `public/[KEY].txt`
   - Parse all generated sitemaps
   - Submit URLs to all IndexNow-compatible search engines

**How it works:**

- Runs automatically after `next-sitemap` during `npm run build`
- Submits URLs in batches (up to 10,000 per request)
- Gracefully skips if `INDEXNOW_KEY` is not set
- Does not fail the build if submissions fail

**Files:**

- `src/lib/indexnow/client.ts` - IndexNow API client library
- `scripts/submit-indexnow.ts` - Build-time submission script
