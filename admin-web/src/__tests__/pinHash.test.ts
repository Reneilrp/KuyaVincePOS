import { normalizePin, generatePinSalt, hashPin, verifyPinHash } from '../utils/pinHash';

describe('PIN Security & Salted Hashing', () => {
  test('normalizePin handles leading zeros consistently', () => {
    expect(normalizePin('42')).toBe('0042');
    expect(normalizePin(42)).toBe('0042');
    expect(normalizePin('1234')).toBe('1234');
    expect(normalizePin('0')).toBe('0000');
    expect(normalizePin('0007')).toBe('0007');
  });

  test('generatePinSalt creates unique 32-character hex salt', () => {
    const salt1 = generatePinSalt();
    const salt2 = generatePinSalt();
    expect(salt1.length).toBe(32);
    expect(salt2.length).toBe(32);
    expect(salt1).not.toBe(salt2);
  });

  test('hashPin creates deterministic SHA-256 digest with salt', async () => {
    const salt = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
    const hash1 = await hashPin('1234', salt);
    const hash2 = await hashPin('1234', salt);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex length
  });

  test('different salts produce different hashes for identical PINs', async () => {
    const salt1 = generatePinSalt();
    const salt2 = generatePinSalt();
    const hash1 = await hashPin('1234', salt1);
    const hash2 = await hashPin('1234', salt2);
    expect(hash1).not.toBe(hash2);
  });

  test('verifyPinHash returns true for valid PIN and false for wrong PIN', async () => {
    const salt = generatePinSalt();
    const hash = await hashPin('5678', salt);

    const isValid = await verifyPinHash('5678', salt, hash);
    const isInvalid = await verifyPinHash('1234', salt, hash);

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });
});
