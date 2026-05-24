// === DATE & TIMESTAMP TYPES ===

/**
 * ISO 8601 date-time string (e.g., "2025-11-06T10:30:00.000Z")
 *
 * Use cases:
 * - Firestore document timestamps (createdAt, updatedAt)
 * - Wiktextract extraction dates
 * - Any date that needs to be stored/serialized
 *
 * Always in UTC timezone. Use helper functions for conversion:
 * - toISODateString(new Date()) → "2025-11-06T10:30:00.000Z"
 * - fromISODateString(str) → Date object
 */
export type ISODateString = string;

function isISOFormat(date: string) {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z/.test(date);
}
/**
 * Unix timestamp in milliseconds (e.g., 1699267800000)
 *
 * Use cases:
 * - Expiration times (easy comparison: Date.now() > expiresAt)
 * - Rate limiting timestamps
 * - Any time that needs numeric comparison
 *
 * Use helper functions for conversion:
 * - toUnixTimestamp(new Date()) → 1699267800000
 * - fromUnixTimestamp(ts) → Date object
 */
export type UnixTimestamp = number;

// Helper functions for date conversion
export const toUTCDateString = (date: Date): ISODateString =>
    date.toISOString();
export const fromISODateString = (str: ISODateString): Date => new Date(str);
export const toUnixTimestamp = (date: Date): UnixTimestamp => date.getTime();
export const fromUnixTimestamp = (ts: UnixTimestamp): Date => new Date(ts);

export type ValidationResult =
    | { valid: true }
    | {
          valid: false;
          reason: string;
      };

export const SUPPORTED_LANGUAGE_CODES = ["it", "en", "es", "fr", "de"] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];
