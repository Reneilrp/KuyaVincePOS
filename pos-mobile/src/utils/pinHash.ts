/**
 * PIN Hashing Utility - KuyaVince POS
 *
 * IMPORTANT: The normalization and hashing logic here MUST be byte-identical
 * to the equivalent in admin-web/src/utils/pinHash.ts.
 * Canonical contract:
 *   1. Normalize PIN to 4-char zero-padded string ("42" -> "0042", 42 -> "0042")
 *   2. Concatenate: salt + normalizedPin
 *   3. UTF-8 encode, SHA-256 digest, lowercase hex output
 *
 * Do NOT change this without updating the mobile copy and migrating all stored hashes.
 */

/** Normalize a PIN to a 4-character, zero-padded decimal string. */
export function normalizePin(pin: string | number): string {
  return String(pin).padStart(4, '0');
}

/** Generate a cryptographically random 32-character hex salt (16 bytes). */
export function generatePinSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a PIN with a per-staff salt.
 * Returns lowercase hex SHA-256 of (salt + normalizedPin).
 */
export async function hashPin(pin: string | number, salt: string): Promise<string> {
  const normalized = normalizePin(pin);
  const encoded = new TextEncoder().encode(salt + normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify a user-entered PIN against the stored salt + hash pair.
 * Returns true only if the computed hash exactly matches storedHash.
 */
export async function verifyPinHash(
  enteredPin: string | number,
  salt: string,
  storedHash: string
): Promise<boolean> {
  const computed = await hashPin(enteredPin, salt);
  return computed === storedHash;
}
