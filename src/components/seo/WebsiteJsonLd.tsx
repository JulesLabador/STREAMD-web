/**
 * Site URL for structured data
 */
const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.streamdanime.io";

/**
 * WebsiteJsonLd - Structured data component for the homepage
 *
 * Generates JSON-LD WebSite schema with SearchAction for Google sitelinks.
 * This helps search engines understand the site structure and may enable
 * the search box feature in search results.
 *
 * @see https://schema.org/WebSite
 * @see https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox
 */
export function WebsiteJsonLd() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "STREAMD",
        url: SITE_URL,
        description: "Track, rate, and share your anime journey with STREAMD",
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${SITE_URL}/?q={search_term_string}`,
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
