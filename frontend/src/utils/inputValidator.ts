/**
 * KOINEXA Client-Side Character Whitelist & Multilingual Profanity Validator
 * 
 * Permitted Characters:
 * - 0-9
 * - a-z, A-Z
 * - Whitespace (space, tab, newline)
 * - Symbols: , . ? ! & | / \ ( ) { } [ ]
 * - Delimiters: - _ : ; ' " @ # + = * % $ ~ `
 */

const ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9\s,.?!&|/\\(){}\[\]\-_:;'"@#+=*%$~`]*$/;

// Multilingual profanity words for immediate client-side warning
const PROFANITY_WORDS = new Set([
  // English
  'fuck', 'fucking', 'fucker', 'fucked', 'motherfucker', 'shit', 'shitting', 'bullshit',
  'bitch', 'bitches', 'bitching', 'asshole', 'bastard', 'cunt', 'dick', 'dickhead',
  'cock', 'pussy', 'slut', 'whore', 'fag', 'faggot', 'nigger', 'nigga', 'retard',
  'jackass', 'prick', 'twat', 'wanker', 'porn', 'porno', 'xxx', 'nude', 'nudes',

  // Hindi / Hinglish
  'chutiya', 'chootiya', 'chutiye', 'madarchod', 'bhenchod', 'behenchod',
  'mc', 'bc', 'bhosdike', 'bsdk', 'gaand', 'gand', 'gandu', 'harami',
  'kamina', 'randi', 'lauda', 'loda', 'lund', 'lodu', 'chut', 'tatte',

  // Telugu
  'lanja', 'lanjakodaka', 'lanjakoduku', 'dengu', 'dengutha', 'modda', 'madda',
  'puku', 'pooku', 'guddha', 'gudha',

  // Tamil
  'thevidiya', 'thevidya', 'otha', 'omala', 'sunni', 'koothi', 'thayoli', 'punda',

  // Spanish & French
  'puta', 'puto', 'mierda', 'cabron', 'pendejo', 'chingar',
  'merde', 'putain', 'salope', 'connard', 'encule'
]);

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  disallowedChars?: string[];
  flaggedWord?: string;
}

export function validateInputCharacters(text: string): { isValid: boolean; disallowedChars: string[] } {
  if (!text) return { isValid: true, disallowedChars: [] };

  const disallowed: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (!ALLOWED_CHARS_REGEX.test(char)) {
      if (!seen.has(char)) {
        disallowed.push(char);
        seen.add(char);
      }
    }
  }

  return {
    isValid: disallowed.length === 0,
    disallowedChars: disallowed,
  };
}

export function checkContentModeration(text: string): { isClean: boolean; flaggedWord?: string } {
  if (!text) return { isClean: true };

  // Normalize: lower case and tokenize
  const words = text.toLowerCase().split(/[^a-z0-9]+/);
  for (const word of words) {
    if (PROFANITY_WORDS.has(word)) {
      return { isClean: false, flaggedWord: word };
    }
  }

  return { isClean: true };
}

export function validateTextInput(text: string): ValidationResult {
  if (!text) return { isValid: true, error: null };

  const charCheck = validateInputCharacters(text);
  if (!charCheck.isValid) {
    const charsSample = charCheck.disallowedChars.map(c => `"${c}"`).join(', ');
    return {
      isValid: false,
      error: `Disallowed characters detected: ${charsSample}. Only standard alphanumeric characters and safe symbols are permitted.`,
      disallowedChars: charCheck.disallowedChars,
    };
  }

  const modCheck = checkContentModeration(text);
  if (!modCheck.isClean) {
    return {
      isValid: false,
      error: `Inappropriate language detected ("${modCheck.flaggedWord}"). KOINEXA maintains an academic and respectful learning environment.`,
      flaggedWord: modCheck.flaggedWord,
    };
  }

  return { isValid: true, error: null };
}
