/**
 * IndexNow Build-Time Submission Script
 *
 * Parses generated sitemaps and submits all URLs to IndexNow-compatible
 * search engines (Bing, Yandex, Seznam, Naver).
 *
 * This script is designed to run after sitemap generation in the build process.
 *
 * Usage: tsx scripts/submit-indexnow.ts
 *
 * Required environment variables:
 * - INDEXNOW_KEY: Your IndexNow API key (32-character hex string)
 * - SITE_URL: Your site URL (defaults to https://www.streamdanime.io)
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

// Load environment variables
config();

// Import IndexNow client functions
import {
    submitToIndexNow,
    extractHost,
    validateUrls,
    formatResults,
} from "../src/lib/indexnow/client";

// ============================================================
// Configuration
// ============================================================

const SITE_URL = process.env.SITE_URL || "https://www.streamdanime.io";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

// Sitemap files to parse (relative to project root)
const SITEMAP_FILES = [
    "public/sitemap.xml",
    "public/sitemap-0.xml", // next-sitemap generates numbered files for large sites
];

// Server-side sitemaps are generated at runtime, so we fetch them if available
const SERVER_SITEMAP_URLS = [
    `${SITE_URL}/server-sitemap.xml`,
    `${SITE_URL}/browse-sitemap.xml`,
];

// ============================================================
// Sitemap Parsing Functions
// ============================================================

/**
 * Extracts URLs from a sitemap XML string
 *
 * @param xml - The sitemap XML content
 * @returns Array of URLs found in the sitemap
 */
function extractUrlsFromSitemap(xml: string): string[] {
    const urls: string[] = [];

    // Match <loc> tags in the sitemap
    // Using a simple regex since we don't need full XML parsing
    const locRegex = /<loc>([^<]+)<\/loc>/g;
    let match;

    while ((match = locRegex.exec(xml)) !== null) {
        const url = match[1].trim();
        // Skip sitemap index references (they contain other sitemaps, not pages)
        if (!url.endsWith(".xml")) {
            urls.push(url);
        }
    }

    return urls;
}

/**
 * Reads and parses a local sitemap file
 *
 * @param filePath - Path to the sitemap file
 * @returns Array of URLs found in the sitemap
 */
function parseLocalSitemap(filePath: string): string[] {
    const absolutePath = path.resolve(process.cwd(), filePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
        console.log(`  Skipping ${filePath} (file not found)`);
        return [];
    }

    try {
        const content = fs.readFileSync(absolutePath, "utf-8");
        const urls = extractUrlsFromSitemap(content);
        console.log(`  Found ${urls.length} URLs in ${filePath}`);
        return urls;
    } catch (error) {
        console.error(`  Error reading ${filePath}:`, error);
        return [];
    }
}

/**
 * Fetches and parses a remote sitemap URL
 *
 * @param url - URL of the sitemap to fetch
 * @returns Array of URLs found in the sitemap
 */
async function fetchRemoteSitemap(url: string): Promise<string[]> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.log(`  Skipping ${url} (HTTP ${response.status})`);
            return [];
        }

        const content = await response.text();
        const urls = extractUrlsFromSitemap(content);
        console.log(`  Found ${urls.length} URLs in ${url}`);
        return urls;
    } catch (error) {
        console.log(`  Skipping ${url} (not available during build)`);
        return [];
    }
}

/**
 * Collects all URLs from local and remote sitemaps
 *
 * @returns Deduplicated array of all URLs
 */
async function collectAllUrls(): Promise<string[]> {
    console.log("\nCollecting URLs from sitemaps...\n");

    const allUrls: Set<string> = new Set();

    // Parse local sitemap files
    console.log("Local sitemaps:");
    for (const file of SITEMAP_FILES) {
        const urls = parseLocalSitemap(file);
        urls.forEach((url) => allUrls.add(url));
    }

    // Note: Server-side sitemaps won't be available during build
    // They are generated at runtime, so we skip them here
    // If you need to include them, run this script after deployment
    console.log(
        "\nServer-side sitemaps (skipped during build - generated at runtime):"
    );
    for (const url of SERVER_SITEMAP_URLS) {
        console.log(`  ${url}`);
    }

    return Array.from(allUrls);
}

// ============================================================
// Key File Generation
// ============================================================

/**
 * Ensures the IndexNow key verification file exists in the public directory
 *
 * @param key - The IndexNow API key
 */
function ensureKeyFile(key: string): void {
    const keyFilePath = path.resolve(process.cwd(), `public/${key}.txt`);

    // Check if key file already exists
    if (fs.existsSync(keyFilePath)) {
        console.log(`\nKey file already exists: public/${key}.txt`);
        return;
    }

    // Create the key file containing the key itself
    try {
        fs.writeFileSync(keyFilePath, key, "utf-8");
        console.log(`\nCreated key file: public/${key}.txt`);
    } catch (error) {
        console.error(`\nFailed to create key file:`, error);
        throw error;
    }
}

// ============================================================
// Main Execution
// ============================================================

async function main(): Promise<void> {
    console.log("========================================");
    console.log("IndexNow URL Submission");
    console.log("========================================");
    console.log(`Site URL: ${SITE_URL}`);

    // Validate environment variables
    if (!INDEXNOW_KEY) {
        console.log("\n⚠️  INDEXNOW_KEY environment variable not set.");
        console.log("   Skipping IndexNow submission.");
        console.log(
            "   To enable, set INDEXNOW_KEY to a 32-character hex string.\n"
        );
        process.exit(0);
    }

    console.log(`IndexNow Key: ${INDEXNOW_KEY.substring(0, 8)}...`);

    // Ensure the key verification file exists
    ensureKeyFile(INDEXNOW_KEY);

    // Collect all URLs from sitemaps
    const urls = await collectAllUrls();

    if (urls.length === 0) {
        console.log("\n⚠️  No URLs found in sitemaps. Nothing to submit.\n");
        process.exit(0);
    }

    console.log(`\nTotal unique URLs collected: ${urls.length}`);

    // Extract host from site URL
    const host = extractHost(SITE_URL);
    console.log(`Host: ${host}`);

    // Validate that all URLs belong to the expected host
    if (!validateUrls(urls, host)) {
        console.error("\n❌ Some URLs do not belong to the expected host.");
        console.error("   This may cause IndexNow to reject the submission.\n");
    }

    // Submit to IndexNow
    console.log("\nSubmitting to IndexNow search engines...");

    const summary = await submitToIndexNow(
        urls,
        host,
        INDEXNOW_KEY,
        `${SITE_URL}/${INDEXNOW_KEY}.txt`
    );

    // Output results
    console.log(formatResults(summary));

    // Exit with appropriate code
    if (!summary.success) {
        console.log(
            "⚠️  Some or all submissions failed. Check the results above.\n"
        );
        // Don't fail the build for IndexNow errors - it's not critical
        process.exit(0);
    }

    console.log("✓ IndexNow submission completed successfully!\n");
}

// Run the script
main().catch((error) => {
    console.error("\n❌ IndexNow submission failed:", error);
    // Don't fail the build for IndexNow errors
    process.exit(0);
});
