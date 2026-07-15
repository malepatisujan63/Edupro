// src/utils/safetyFilter.ts
// ─── Content Moderation & Safe File Validation for EduNetwork ───

// Common offensive, abusive, or spam keywords to moderate posts
const BANNED_WORDS = [
  'spam', 'scam', 'abuse', 'hack', 'exploit', 'offensive',
  'vulgar', 'inappropriate', 'cheat', 'leak', 'malware',
  'bypass', 'crack', 'phishing', 'spoof', 'ddos'
];

/**
 * Sanitizes and moderates user-generated content.
 * Returns true if clean, false if flagged for sensitive keywords.
 */
export function validateContentSafety(text: string): { isSafe: boolean; flaggedWord?: string } {
  const normalized = text.toLowerCase();
  for (const word of BANNED_WORDS) {
    // Exact word matching or partial matches
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalized)) {
      return { isSafe: false, flaggedWord: word };
    }
  }
  return { isSafe: true };
}

/**
 * Validates links/URLs to prevent javascript: or data: XSS injections.
 */
export function sanitizeUrl(urlStr: string): string {
  if (!urlStr) return '';
  const trimmed = urlStr.trim().toLowerCase();
  
  // Block scripting URLs
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
    return 'about:blank';
  }
  
  return urlStr;
}

/**
 * Inspects a file's binary signature (Magic Bytes) to verify
 * it is genuinely an image, PDF, or video, and not just a renamed malware executable.
 */
export async function verifyFileMagicBytes(file: File): Promise<{ isValid: boolean; expectedMime?: string }> {
  // Read first 12 bytes of the file
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read file buffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    // Only slice first 12 bytes to avoid memory overhead
    reader.readAsArrayBuffer(file.slice(0, 12));
  });

  const arr = new Uint8Array(buffer);
  
  // Convert bytes to hex string for easy comparison
  const getHeaderHex = (len: number) => {
    return Array.from(arr.slice(0, len))
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  };

  // 1. PDF Magic Bytes: %PDF (25 50 44 46)
  if (arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46) {
    return { isValid: true, expectedMime: 'application/pdf' };
  }

  // 2. JPEG Magic Bytes: FF D8 FF
  if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
    return { isValid: true, expectedMime: 'image/jpeg' };
  }

  // 3. PNG Magic Bytes: 89 50 4E 47 0D 0A 1A 0A
  const pngHeader = getHeaderHex(8);
  if (pngHeader === '89 50 4E 47 0D 0A 1A 0A') {
    return { isValid: true, expectedMime: 'image/png' };
  }

  // 4. GIF Magic Bytes: GIF87a or GIF89a (47 49 46 38 37 61 / 47 49 46 38 39 61)
  const gifHeader = getHeaderHex(4);
  if (gifHeader === '47 49 46 38') {
    return { isValid: true, expectedMime: 'image/gif' };
  }

  // 5. MP4/QuickTime/WebM Video containers
  const mp4Header = getHeaderHex(12);
  // MP4 standard starts with ftyp container signature usually at byte 4
  const isMp4 = mp4Header.includes('66 74 79 70'); // 'ftyp' in hex
  const isWebm = arr[0] === 0x1A && arr[1] === 0x45 && arr[2] === 0xDF && arr[3] === 0xA3; // EBML header
  
  if (isMp4 || isWebm) {
    return { isValid: true, expectedMime: isMp4 ? 'video/mp4' : 'video/webm' };
  }

  // Fallback check: if type is text/plain or similar but has non-printable control chars, mark invalid
  return { isValid: false };
}
