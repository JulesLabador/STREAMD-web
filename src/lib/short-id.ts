import { customAlphabet } from "nanoid";

/**
 * Short ID Configuration
 *
 * Uses full uppercase alphanumeric alphabet (A-Z, 0-9) for maximum entropy.
 * 8 characters with 36-char alphabet = 36^8 = 2.8 trillion combinations.
 */

/** Full uppercase alphanumeric alphabet */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Length of generated short IDs */
const ID_LENGTH = 8;

/** Regex pattern for validating short IDs */
const SHORT_ID_PATTERN = /^[A-Z0-9]{8}$/;

/**
 * Generates a short, URL-friendly ID
 *
 * Creates an 8-character uppercase alphanumeric string suitable for use
 * in URLs. Uses nanoid's customAlphabet for cryptographically secure
 * random generation.
 *
 * @returns 8-character uppercase alphanumeric string (e.g., "A1B2C3D4")
 *
 * @example
 * const id = generateShortId(); // "X7K9M2NP"
 */
export const generateShortId = customAlphabet(ALPHABET, ID_LENGTH);

/**
 * Validates a short ID format
 *
 * Checks if the provided string matches the expected short ID format:
 * exactly 8 uppercase alphanumeric characters.
 *
 * @param id - String to validate
 * @returns true if valid short ID format, false otherwise
 *
 * @example
 * isValidShortId("A1B2C3D4"); // true
 * isValidShortId("a1b2c3d4"); // false (lowercase)
 * isValidShortId("A1B2C3D");  // false (7 chars)
 * isValidShortId("A1B2C3D4E"); // false (9 chars)
 */
export function isValidShortId(id: string): boolean {
    return SHORT_ID_PATTERN.test(id);
}

/**
 * Normalizes a short ID to uppercase
 *
 * Converts a potentially lowercase short ID to uppercase format.
 * Useful for handling case-insensitive URL inputs.
 *
 * @param id - Short ID string (may be lowercase)
 * @returns Uppercase short ID string
 *
 * @example
 * normalizeShortId("a1b2c3d4"); // "A1B2C3D4"
 */
export function normalizeShortId(id: string): string {
    return id.toUpperCase();
}

