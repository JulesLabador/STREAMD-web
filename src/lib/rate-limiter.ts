/**
 * Rate Limiter Utility
 *
 * A queue-based rate limiter for controlling outgoing API requests.
 * Ensures a minimum delay between consecutive requests to respect external API limits.
 *
 * Usage:
 * ```typescript
 * // Create a rate limiter for 1 request per 2 seconds
 * const limiter = new RateLimiter(2000);
 *
 * // Wait for a slot before making a request
 * await limiter.waitForSlot();
 * const response = await fetch(url);
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration options for the rate limiter
 */
export interface RateLimiterOptions {
    /**
     * Minimum delay between requests in milliseconds
     * @default 1000
     */
    minDelayMs?: number;

    /**
     * Maximum number of requests to queue before rejecting
     * Set to 0 for unlimited queue size
     * @default 0
     */
    maxQueueSize?: number;

    /**
     * Optional name for logging purposes
     */
    name?: string;
}

/**
 * Statistics about the rate limiter's current state
 */
export interface RateLimiterStats {
    /** Number of requests currently in queue */
    queueLength: number;
    /** Time since last request in milliseconds */
    timeSinceLastRequest: number;
    /** Whether the queue is currently being processed */
    isProcessing: boolean;
    /** Total requests processed since creation */
    totalProcessed: number;
}

// ============================================================================
// Rate Limiter Class
// ============================================================================

/**
 * Queue-based rate limiter for controlling outgoing API request frequency.
 * Requests are queued and processed sequentially with a minimum delay between each.
 */
export class RateLimiter {
    private lastRequestTime = 0;
    private queue: Array<{
        resolve: () => void;
        reject: (error: Error) => void;
    }> = [];
    private processing = false;
    private totalProcessed = 0;

    private readonly minDelayMs: number;
    private readonly maxQueueSize: number;
    private readonly name: string;

    /**
     * Creates a new rate limiter instance
     *
     * @param options - Configuration options or minimum delay in milliseconds
     */
    constructor(options: RateLimiterOptions | number = {}) {
        if (typeof options === "number") {
            this.minDelayMs = options;
            this.maxQueueSize = 0;
            this.name = "RateLimiter";
        } else {
            this.minDelayMs = options.minDelayMs ?? 1000;
            this.maxQueueSize = options.maxQueueSize ?? 0;
            this.name = options.name ?? "RateLimiter";
        }
    }

    /**
     * Waits until it's safe to make a request.
     * Returns a promise that resolves when a slot is available.
     *
     * @throws Error if queue is full (when maxQueueSize is set)
     */
    async waitForSlot(): Promise<void> {
        // Check queue size limit
        if (this.maxQueueSize > 0 && this.queue.length >= this.maxQueueSize) {
            throw new Error(
                `[${this.name}] Queue is full (max: ${this.maxQueueSize})`
            );
        }

        return new Promise((resolve, reject) => {
            this.queue.push({ resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Processes the queue of waiting requests
     */
    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;

        while (this.queue.length > 0) {
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            const waitTime = Math.max(0, this.minDelayMs - timeSinceLastRequest);

            if (waitTime > 0) {
                await this.sleep(waitTime);
            }

            this.lastRequestTime = Date.now();
            this.totalProcessed++;

            const item = this.queue.shift();
            if (item) {
                item.resolve();
            }
        }

        this.processing = false;
    }

    /**
     * Sleep for a given number of milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Gets the current statistics of the rate limiter
     */
    getStats(): RateLimiterStats {
        return {
            queueLength: this.queue.length,
            timeSinceLastRequest:
                this.lastRequestTime === 0
                    ? Infinity
                    : Date.now() - this.lastRequestTime,
            isProcessing: this.processing,
            totalProcessed: this.totalProcessed,
        };
    }

    /**
     * Clears all pending requests from the queue.
     * Pending promises will be rejected with an error.
     */
    clear(): void {
        const error = new Error(`[${this.name}] Queue cleared`);
        while (this.queue.length > 0) {
            const item = this.queue.shift();
            if (item) {
                item.reject(error);
            }
        }
    }

    /**
     * Resets the rate limiter state.
     * Clears the queue and resets timing.
     */
    reset(): void {
        this.clear();
        this.lastRequestTime = 0;
        this.totalProcessed = 0;
    }
}

// ============================================================================
// Retry Utilities
// ============================================================================

/**
 * Options for retry with exponential backoff
 */
export interface RetryOptions {
    /**
     * Maximum number of retry attempts
     * @default 3
     */
    maxRetries?: number;

    /**
     * Base delay for exponential backoff in milliseconds
     * @default 1000
     */
    baseDelayMs?: number;

    /**
     * Maximum delay between retries in milliseconds
     * @default 30000
     */
    maxDelayMs?: number;

    /**
     * Jitter factor (0-1) to add randomness to delays
     * @default 0.25
     */
    jitterFactor?: number;

    /**
     * Function to determine if an error is retryable
     * @default Always returns true
     */
    isRetryable?: (error: unknown) => boolean;

    /**
     * Optional callback for retry events
     */
    onRetry?: (attempt: number, delay: number, error: unknown) => void;
}

/**
 * Calculates the backoff delay for a given retry attempt
 *
 * @param attempt - The current retry attempt (0-indexed)
 * @param options - Retry configuration options
 * @returns Delay in milliseconds with optional jitter
 */
export function calculateBackoff(
    attempt: number,
    options: Pick<
        RetryOptions,
        "baseDelayMs" | "maxDelayMs" | "jitterFactor"
    > = {}
): number {
    const { baseDelayMs = 1000, maxDelayMs = 30000, jitterFactor = 0.25 } =
        options;

    // Exponential backoff: base * 2^attempt, capped at max
    const exponentialDelay = Math.min(
        baseDelayMs * Math.pow(2, attempt),
        maxDelayMs
    );

    // Add jitter to prevent thundering herd
    const jitter = exponentialDelay * jitterFactor * (Math.random() * 2 - 1);

    return Math.round(exponentialDelay + jitter);
}

/**
 * Executes a function with retry logic and exponential backoff
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        baseDelayMs = 1000,
        maxDelayMs = 30000,
        jitterFactor = 0.25,
        isRetryable = () => true,
        onRetry,
    } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if we should retry
            if (attempt >= maxRetries || !isRetryable(error)) {
                throw error;
            }

            // Calculate delay
            const delay = calculateBackoff(attempt, {
                baseDelayMs,
                maxDelayMs,
                jitterFactor,
            });

            // Notify about retry
            if (onRetry) {
                onRetry(attempt + 1, delay, error);
            }

            // Wait before retrying
            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Sleep for a given number of milliseconds
 *
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// HTTP-Specific Utilities
// ============================================================================

/**
 * Determines if an HTTP status code is retryable
 *
 * @param status - HTTP status code
 * @returns True if the request should be retried
 */
export function isRetryableHttpStatus(status: number): boolean {
    // Retry on:
    // - 429 Too Many Requests (rate limited)
    // - 5xx Server errors
    // - 408 Request Timeout
    return status === 429 || status === 408 || (status >= 500 && status < 600);
}

/**
 * Creates a retry options object configured for HTTP requests
 *
 * @param options - Additional options to merge
 * @returns Retry options suitable for HTTP requests
 */
export function httpRetryOptions(
    options: Partial<RetryOptions> = {}
): RetryOptions {
    return {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitterFactor: 0.25,
        isRetryable: (error) => {
            // Network errors are retryable
            if (error instanceof TypeError) return true;

            // Check for HTTP status in error
            if (error && typeof error === "object" && "status" in error) {
                return isRetryableHttpStatus(
                    (error as { status: number }).status
                );
            }

            return false;
        },
        ...options,
    };
}

