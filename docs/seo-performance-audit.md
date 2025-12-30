# SEO & Performance Audit Report

**Date:** December 26, 2025
**Environment:** Production build (Next.js 16.1.1)

---

## Executive Summary

Overall, STREAMD has a solid foundation for SEO and performance, but there are several areas that need improvement to achieve optimal search engine visibility and user experience.

### Key Findings

| Category | Status | Priority |
|----------|--------|----------|
| Core Web Vitals | Good | - |
| Homepage SEO | Needs Work | High |
| Anime Detail SEO | Good | Low |
| Browse Pages SEO | Needs Work | Medium |
| Image Optimization | Good | Low |
| Bundle Size | Acceptable | Medium |

---

## Performance Metrics

### Homepage (`/`)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Time to First Byte (TTFB) | 373ms | < 800ms | ✅ Good |
| First Contentful Paint (FCP) | 512ms | < 1.8s | ✅ Good |
| DOM Content Loaded | 453ms | < 2.5s | ✅ Good |
| Load Complete | 483ms | < 3s | ✅ Good |
| Total Transfer Size | 543 KB | < 1 MB | ✅ Good |
| Total Resources | 95 | - | ⚠️ High |
| Images Loaded | 24 | - | Consider lazy loading |

### Anime Detail Page (`/anime/kimi-no-na-wa`)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Time to First Byte (TTFB) | 235ms | < 800ms | ✅ Excellent |
| First Contentful Paint (FCP) | 328ms | < 1.8s | ✅ Excellent |
| DOM Content Loaded | 283ms | < 2.5s | ✅ Excellent |
| Load Complete | 368ms | < 3s | ✅ Excellent |
| Total Transfer Size | 44 KB | < 500 KB | ✅ Excellent |

### Genre Browse Page (`/genre`)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Time to First Byte (TTFB) | 303ms | < 800ms | ✅ Good |
| First Contentful Paint (FCP) | 376ms | < 1.8s | ✅ Good |
| DOM Content Loaded | 350ms | < 2.5s | ✅ Good |
| Total Transfer Size | 62 KB | < 500 KB | ✅ Excellent |

---

## SEO Audit Results

### Homepage (`/`)

| Element | Status | Issue |
|---------|--------|-------|
| Title | ✅ Present | "STREAMD - Track Your Anime Journey" |
| Meta Description | ✅ Present | "Track, rate, and share your anime journey with STREAMD" |
| H1 Tag | ✅ Present | "Browse Anime" |
| HTML Lang | ✅ Present | "en" |
| Viewport | ✅ Present | Properly configured |
| Open Graph Title | ❌ Missing | Not set |
| Open Graph Description | ❌ Missing | Not set |
| Open Graph Image | ❌ Missing | Not set |
| Open Graph Type | ❌ Missing | Not set |
| Twitter Card | ❌ Missing | Not set |
| Canonical URL | ❌ Missing | Not set |
| JSON-LD Structured Data | ❌ Missing | No structured data |
| Images with Alt | ✅ All 24 images have alt text |

### Anime Detail Page (`/anime/[slug]`)

| Element | Status | Notes |
|---------|--------|-------|
| Title | ✅ Present | Dynamic: "Your Name. \| STREAMD" |
| Meta Description | ✅ Present | Synopsis excerpt (160 chars) |
| Open Graph Title | ✅ Present | Dynamic |
| Open Graph Description | ✅ Present | Dynamic |
| Open Graph Image | ✅ Present | Cover image URL |
| Open Graph Type | ✅ Present | "website" |
| Canonical URL | ❌ Missing | Should be set |
| JSON-LD | ✅ Present | Movie/TVSeries schema with rating |
| H1 Tag | ✅ Present | Anime title |
| Priority Images | ❌ None | Cover image should have `priority` |

### Genre Browse Page (`/genre`)

| Element | Status | Issue |
|---------|--------|-------|
| Title | ⚠️ Bug | "Anime Genres \| STREAMD \| STREAMD" (duplicated) |
| Meta Description | ✅ Present | Good description |
| Open Graph Title | ✅ Present | "Anime Genres \| STREAMD" |
| Canonical URL | ❌ Missing | Not set |
| JSON-LD | ❌ Missing | Consider ItemList schema |
| H1 Tag | ✅ Present | "Anime Genres" |

---

## Technical SEO Infrastructure

### Sitemap Configuration ✅

- `robots.txt` properly configured
- Sitemap index at `/sitemap.xml`
- Server-side sitemap at `/server-sitemap.xml`
- Proper disallow rules for `/login`, `/auth/`, `/api/`

### Bundle Analysis

**Total JS Chunks:** ~1.7 MB (uncompressed)

**Largest Bundles:**

| File | Size | Likely Content |
|------|------|----------------|
| f53ade00aec9808e.js | 374 KB | Likely Recharts (stats page) |
| 0cf0476fc314f1a2.js | 218 KB | React core |
| 71de3ab9ccd8e060.js | 202 KB | Next.js runtime |
| 31bd364d24b86290.js | 128 KB | UI components |

**Third-Party Scripts:**
- Plausible Analytics (lightweight, loaded async) ✅

---

## Priority Recommendations

### High Priority

1. **Add Open Graph & Twitter Card tags to Homepage**
   - File: `src/app/page.tsx` or `src/app/layout.tsx`
   - Add `openGraph` and `twitter` to metadata export
   - Include a default OG image for social sharing

2. **Fix duplicate title on Genre page**
   - File: `src/app/(public)/genre/page.tsx`
   - Check metadata export for duplicate template application

3. **Add canonical URLs**
   - Add `alternates.canonical` to all page metadata
   - Example: `alternates: { canonical: 'https://www.streamdanime.io/anime/slug' }`

### Medium Priority

4. **Add Homepage JSON-LD structured data**
   - Consider `WebSite` schema with `SearchAction` for sitelinks search box
   - Or `ItemList` schema for the anime grid

5. **Add `priority` attribute to LCP images**
   - Anime detail cover image should have `priority={true}`
   - First few anime cards on homepage could benefit from priority loading

6. **Consider code splitting for Recharts**
   - 374 KB bundle is large
   - Use dynamic import: `const Chart = dynamic(() => import('recharts'), { ssr: false })`

### Low Priority

7. **Add BreadcrumbList JSON-LD to detail pages**
   - Helps Google understand site hierarchy

8. **Consider lazy loading for below-fold images**
   - Homepage loads 24 images immediately
   - Images below fold could use `loading="lazy"`

9. **Add `ratingCount` to aggregateRating in JSON-LD**
   - Current schema has `ratingValue` but missing `ratingCount`

---

## Code Examples

### Homepage Metadata Enhancement

```typescript
// src/app/page.tsx
export const metadata: Metadata = {
    title: "STREAMD - Track Your Anime Journey",
    description: "Track, rate, and share your anime journey with STREAMD. Discover new anime, build your watchlist, and connect with fans.",
    openGraph: {
        title: "STREAMD - Track Your Anime Journey",
        description: "Track, rate, and share your anime journey with STREAMD",
        url: "https://www.streamdanime.io",
        siteName: "STREAMD",
        images: [
            {
                url: "https://www.streamdanime.io/og-image.png",
                width: 1200,
                height: 630,
                alt: "STREAMD - Anime Tracking Platform",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "STREAMD - Track Your Anime Journey",
        description: "Track, rate, and share your anime journey",
        images: ["https://www.streamdanime.io/og-image.png"],
    },
    alternates: {
        canonical: "https://www.streamdanime.io",
    },
};
```

### WebSite JSON-LD for Homepage

```typescript
// src/components/seo/WebsiteJsonLd.tsx
export function WebsiteJsonLd() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "STREAMD",
        url: "https://www.streamdanime.io",
        description: "Track, rate, and share your anime journey",
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: "https://www.streamdanime.io/search?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
```

---

## Implementation Status (Updated Dec 26, 2025)

### Completed Fixes

1. ✅ **Homepage Open Graph & Twitter Card tags** - Added full metadata with OG image, description, URL, site name
2. ✅ **Fixed duplicate title bug** - Removed "| STREAMD" suffix from page titles (template handles it)
3. ✅ **Added canonical URLs** - All main pages now have canonical URLs
4. ✅ **Homepage JSON-LD** - Added WebSite schema with SearchAction for sitelinks search box
5. ✅ **Browse page metadata** - Fixed genre, season, studio, and platforms pages

### Remaining Tasks

1. **Create OG image** - Add a branded 1200x630px PNG image at `public/og-image.png`
   - Currently references `/og-image.png` which doesn't exist yet
   - Use a design tool to create a branded image with STREAMD logo and tagline

## Next Steps

1. Create and add default OG image (`/public/og-image.png`) - 1200x630px
2. Consider running Lighthouse CI in your deployment pipeline
3. Set up Google Search Console to monitor indexing
4. Test social sharing previews using Facebook/Twitter debuggers after deploying

---

## Tools for Ongoing Monitoring

- **Google Search Console** - Index coverage, Core Web Vitals
- **Google PageSpeed Insights** - Real user metrics
- **Schema.org Validator** - Structured data testing
- **Open Graph Debugger** - Facebook sharing preview
- **Twitter Card Validator** - Twitter sharing preview

