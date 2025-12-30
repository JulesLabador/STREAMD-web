/** @type {import('next-sitemap').IConfig} */
module.exports = {
    // Base URL for the sitemap - update this to your production domain
    siteUrl: process.env.SITE_URL || "https://www.streamdanime.io",

    // Generate robots.txt alongside sitemap
    generateRobotsTxt: true,

    // Generate index sitemap for large sites
    generateIndexSitemap: true,

    // Sitemap size limit (URLs per sitemap file)
    sitemapSize: 7000,

    // Change frequency defaults
    changefreq: "weekly",

    // Priority defaults
    priority: 0.7,

    // Exclude paths from sitemap
    exclude: [
        "/login",
        "/auth/*",
        "/api/*",
        "/server-sitemap.xml", // Exclude server-side sitemap from static generation
    ],

    // Robots.txt configuration
    robotsTxtOptions: {
        // Additional sitemap URLs (for server-side generated sitemaps)
        additionalSitemaps: [
            `${
                process.env.SITE_URL || "https://www.streamdanime.io"
            }/server-sitemap.xml`,
        ],
        policies: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/login", "/auth/", "/api/"],
            },
        ],
    },

    // Transform function to customize sitemap entries
    transform: async (config, path) => {
        // Set higher priority for important pages
        let priority = config.priority;
        let changefreq = config.changefreq;

        // Home page gets highest priority
        if (path === "/") {
            priority = 1.0;
            changefreq = "daily";
        }

        // Browse pages (genre, season, studio, platforms) get high priority
        if (
            path === "/genre" ||
            path === "/season" ||
            path === "/studio" ||
            path === "/platforms"
        ) {
            priority = 0.9;
            changefreq = "daily";
        }

        // Individual browse category pages
        if (
            path.startsWith("/genre/") ||
            path.startsWith("/season/") ||
            path.startsWith("/studio/") ||
            path.startsWith("/platforms/")
        ) {
            priority = 0.8;
            changefreq = "weekly";
        }

        // Individual anime pages
        if (path.startsWith("/anime/")) {
            priority = 0.7;
            changefreq = "weekly";
        }

        return {
            loc: path,
            changefreq,
            priority,
            lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
        };
    },
};
