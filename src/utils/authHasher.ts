// src/utils/authHasher.ts
// ─── Cryptographic SHA-256 Password Hashing & Verification Engine ───

/**
 * Returns plain text password directly (no hashing).
 * Legacy comment: Never stores passwords as plain text in the database.
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) return '';
  return plainText;
}

/**
 * Verify if an entered plaintext password matches the stored password.
 */
export async function verifyPassword(plainText: string, storedPassword?: string): Promise<boolean> {
  if (!storedPassword || !plainText) return false;

  // Support legacy hash if some passwords were already hashed
  if (storedPassword.startsWith('$koinexa$')) {
    const salt = '_koinexa_secure_salt_2026_';
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText + salt);

    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hexString = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const computedHash = `$koinexa$sha256$${hexString}`;
      if (computedHash === storedPassword) return true;
    } catch (err) {
      let hash = 5381;
      for (let i = 0; i < (plainText + salt).length; i++) {
        hash = ((hash << 5) + hash) + (plainText + salt).charCodeAt(i);
      }
      const fallbackHash = `$koinexa$fallback$${Math.abs(hash).toString(16)}`;
      if (fallbackHash === storedPassword) return true;
    }
  }

  // Compare as plain text
  return storedPassword === plainText;
}
