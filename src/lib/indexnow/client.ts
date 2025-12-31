/**
 * IndexNow API Client
 *
 * Provides functionality to submit URLs to search engines using the IndexNow protocol.
 * Supports Bing, Yandex, Seznam, and Naver search engines.
 *
 * @see https://www.indexnow.org/documentation
 */

// ============================================================
// Type Definitions
// ============================================================

/**
 * Supported IndexNow search engine endpoints
 */
export type IndexNowSearchEngine = "bing" | "yandex" | "seznam" | "naver";

/**
 * IndexNow API request payload for batch URL submission
 */
export interface IndexNowRequest {
    /** The host of the website (e.g., "www.streamdanime.io") */
    host: string;
    /** The IndexNow API key */
    key: string;
    /** Optional path to the key file location */
    keyLocation?: string;
    /** Array of URLs to submit (max 10,000 per request) */
    urlList: string[];
}

/**
 * Result of an IndexNow submission attempt
 */
export interface IndexNowResult {
    /** The search engine that was notified */
    engine: IndexNowSearchEngine;
    /** Whether the submission was successful */
    success: boolean;
    /** HTTP status code returned by the API */
    statusCode: number;
    /** Number of URLs submitted */
    urlCount: number;
    /** Error message if submission failed */
    error?: string;
}

/**
 * Summary of all IndexNow submissions
 */
export interface IndexNowSummary {
    /** Total number of URLs submitted */
    totalUrls: number;
    /** Results from each search engine */
    results: IndexNowResult[];
    /** Overall success status (true if at least one engine succeeded) */
    success: boolean;
    /** Timestamp of the submission */
    timestamp: string;
}

// ============================================================
// Constants
// ============================================================

/**
 * IndexNow API endpoints for each supported search engine
 * All engines use the same protocol, just different base URLs
 */
const INDEXNOW_ENDPOINTS: Record<IndexNowSearchEngine, string> = {
    bing: "https://www.bing.com/indexnow",
    yandex: "https://yandex.com/indexnow",
    seznam: "https://search.seznam.cz/indexnow",
    naver: "https://searchadvisor.naver.com/indexnow",
};

/**
 * Maximum number of URLs allowed per IndexNow request
 */
const MAX_URLS_PER_REQUEST = 10000;

// ============================================================
// Core Functions
// ============================================================

/**
 * Submits URLs to a single IndexNow search engine endpoint
 *
 * @param engine - The search engine to notify
 * @param request - The IndexNow request payload
 * @returns Result of the submission attempt
 */
async function submitToEngine(
    engine: IndexNowSearchEngine,
    request: IndexNowRequest
): Promise<IndexNowResult> {
    const endpoint = INDEXNOW_ENDPOINTS[engine];

    try {
        // Make POST request to the IndexNow endpoint
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(request),
        });

        // IndexNow returns various status codes:
        // 200 - OK, URL submitted successfully
        // 202 - Accepted, URL received, will be processed later
        // 400 - Bad request, invalid format
        // 403 - Forbidden, key not valid
        // 422 - Unprocessable Entity, URLs don't belong to the host
        // 429 - Too Many Requests, rate limited
        const success = response.status === 200 || response.status === 202;

        return {
            engine,
            success,
            statusCode: response.status,
            urlCount: request.urlList.length,
            error: success ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        };
    } catch (error) {
        // Handle network errors or other exceptions
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
            engine,
            success: false,
            statusCode: 0,
            urlCount: request.urlList.length,
            error: errorMessage,
        };
    }
}

/**
 * Submits URLs to all supported IndexNow search engines
 *
 * @param urls - Array of full URLs to submit
 * @param host - The host of the website (e.g., "www.streamdanime.io")
 * @param key - The IndexNow API key
 * @param keyLocation - Optional custom key file location
 * @returns Summary of all submission results
 */
export async function submitToIndexNow(
    urls: string[],
    host: string,
    key: string,
    keyLocation?: string
): Promise<IndexNowSummary> {
    // Validate inputs
    if (!urls.length) {
        return {
            totalUrls: 0,
            results: [],
            success: false,
            timestamp: new Date().toISOString(),
        };
    }

    if (!key) {
        throw new Error("IndexNow API key is required");
    }

    // Split URLs into batches if exceeding max limit
    const batches: string[][] = [];
    for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
        batches.push(urls.slice(i, i + MAX_URLS_PER_REQUEST));
    }

    const allResults: IndexNowResult[] = [];
    const engines = Object.keys(INDEXNOW_ENDPOINTS) as IndexNowSearchEngine[];

    // Process each batch
    for (const batch of batches) {
        const request: IndexNowRequest = {
            host,
            key,
            keyLocation,
            urlList: batch,
        };

        // Submit to all engines in parallel for each batch
        const batchResults = await Promise.all(
            engines.map((engine) => submitToEngine(engine, request))
        );

        allResults.push(...batchResults);
    }

    // Determine overall success (at least one engine succeeded)
    const success = allResults.some((result) => result.success);

    return {
        totalUrls: urls.length,
        results: allResults,
        success,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Extracts the host from a URL
 *
 * @param url - Full URL to extract host from
 * @returns The host portion of the URL (e.g., "www.streamdanime.io")
 */
export function extractHost(url: string): string {
    try {
        const parsed = new URL(url);
        return parsed.host;
    } catch {
        throw new Error(`Invalid URL: ${url}`);
    }
}

/**
 * Validates that all URLs belong to the same host
 *
 * @param urls - Array of URLs to validate
 * @param expectedHost - The expected host for all URLs
 * @returns True if all URLs belong to the expected host
 */
export function validateUrls(urls: string[], expectedHost: string): boolean {
    return urls.every((url) => {
        try {
            const host = extractHost(url);
            return host === expectedHost;
        } catch {
            return false;
        }
    });
}

/**
 * Formats IndexNow results for console output
 *
 * @param summary - The IndexNow submission summary
 * @returns Formatted string for logging
 */
export function formatResults(summary: IndexNowSummary): string {
    const lines: string[] = [
        `\n========================================`,
        `IndexNow Submission Results`,
        `========================================`,
        `Timestamp: ${summary.timestamp}`,
        `Total URLs: ${summary.totalUrls}`,
        `Overall Status: ${summary.success ? "SUCCESS" : "FAILED"}`,
        `----------------------------------------`,
    ];

    for (const result of summary.results) {
        const status = result.success ? "✓" : "✗";
        const details = result.error || `${result.urlCount} URLs submitted`;
        lines.push(`${status} ${result.engine.toUpperCase()}: ${details} (HTTP ${result.statusCode})`);
    }

    lines.push(`========================================\n`);

    return lines.join("\n");
}

