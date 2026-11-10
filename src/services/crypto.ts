/**
 * Web Crypto API End-to-End Encryption (AES-GCM 256-bit)
 * Zero-knowledge: sensitive financial records and private notes are
 * encrypted locally in-browser before persistence.
 */

// Generate random salt
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// SHA-256 hash for PIN verification
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Derive a 256-bit AES-GCM key from PIN + Salt using PBKDF2 (100,000 rounds)
export async function deriveKey(pin: string, saltHex: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinBytes = encoder.encode(pin);
  const saltBytes = hexToBytes(saltHex);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    pinBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt string with AES-GCM
export async function encryptText(
  plainText: string,
  key: CryptoKey
): Promise<{ cipherHex: string; ivHex: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const encoder = new TextEncoder();
  const encoded = encoder.encode(plainText);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encoded
  );

  const cipherBytes = new Uint8Array(encryptedBuffer);
  const cipherHex = Array.from(cipherBytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv, (b) => b.toString(16).padStart(2, '0')).join('');

  return { cipherHex, ivHex };
}

// Decrypt string with AES-GCM
export async function decryptText(
  cipherHex: string,
  ivHex: string,
  key: CryptoKey
): Promise<string> {
  try {
    const cipherBytes = hexToBytes(cipherHex);
    const iv = hexToBytes(ivHex);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      cipherBytes as unknown as BufferSource
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    throw new Error('Decryption failed: Invalid key or corrupted data.');
  }
}
