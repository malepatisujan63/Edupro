// src/utils/authHasher.ts
// ─── Cryptographic SHA-256 Password Hashing & Verification Engine ───

/**
 * Hash a plaintext password securely using browser native Web Crypto API (SHA-256).
 * Never stores passwords as plain text in the database.
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) return '';
  const salt = '_koinexa_secure_salt_2026_';
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText + salt);

  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexString = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `$koinexa$sha256$${hexString}`;
  } catch (err) {
    // Fallback if crypto.subtle is restricted in non-secure context
    let hash = 5381;
    for (let i = 0; i < (plainText + salt).length; i++) {
      hash = ((hash << 5) + hash) + (plainText + salt).charCodeAt(i);
    }
    return `$koinexa$fallback$${Math.abs(hash).toString(16)}`;
  }
}

/**
 * Verify if an entered plaintext password matches the stored hashed password.
 * Also supports legacy plaintext check for backward compatibility with existing users.
 */
export async function verifyPassword(plainText: string, storedPassword?: string): Promise<boolean> {
  if (!storedPassword || !plainText) return false;

  // Check if stored password is a hash
  if (storedPassword.startsWith('$koinexa$')) {
    const computedHash = await hashPassword(plainText);
    return computedHash === storedPassword;
  }

  // Backward compatibility check for any legacy test accounts
  return storedPassword === plainText;
}
