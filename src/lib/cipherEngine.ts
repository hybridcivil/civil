/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NumVocalis Cipher Engine
 * Bi-directional text-to-number cipher with distinct vowel and consonant mathematical variation.
 * Accurately models single-letter, 2-letter, 3-letter, 4-letter, and multi-letter words.
 */

export type LetterType = 'vowel' | 'consonant' | 'separator' | 'punctuation' | 'digit';

export type SpaceMode = 'word-length' | 'rotating-prime' | 'checksum' | 'classic';

export interface LetterDefinition {
  char: string;
  code: string;
  type: LetterType;
  index: number;
  frequencyHz: number;
  description: string;
  banglaDescription: string;
}

export interface EncodedToken {
  originalChar: string;
  code: string;
  type: LetterType;
  indexInSentence: number;
  frequencyHz: number;
  isVowel: boolean;
  isConsonant: boolean;
}

export interface WordAnalysis {
  word: string;
  cleanWord: string;
  length: number;
  lengthCategory: '1-letter' | '2-letter' | '3-letter' | '4-letter' | '5+-letter';
  tokens: EncodedToken[];
  numericCode: string;
  vowelCount: number;
  consonantCount: number;
  vowelRatio: number;
}

export interface DecodeStep {
  tokenCode: string;
  decodedChar: string;
  type: LetterType;
  isValid: boolean;
  reason?: string;
}

export interface DecodeResult {
  sentence: string;
  tokens: DecodeStep[];
  success: boolean;
  totalTokens: number;
  validTokens: number;
  invalidCount: number;
  detectedWordCount: number;
}

export type CipherFormat = 'continuous' | 'spaced' | 'word-bracketed' | 'hyphenated';

// --- Cipher Definition ---
// Vowels: 10s band (Tier 1 - Harmonic Resonators)
// Consonants: 21 - 41 band (Tier 2 - Structural Frames)
// Spaces (Word Boundaries): 00
// Punctuation: 91 - 98
// Digits: 80 - 89

export const VOWEL_MAP: Record<string, { code: string; hz: number; order: number }> = {
  A: { code: '11', hz: 523.25, order: 1 }, // C5
  E: { code: '12', hz: 659.25, order: 2 }, // E5
  I: { code: '13', hz: 783.99, order: 3 }, // G5
  O: { code: '14', hz: 880.00, order: 4 }, // A5
  U: { code: '15', hz: 1046.50, order: 5 }, // C6
};

export const CONSONANT_MAP: Record<string, { code: string; hz: number; order: number }> = {
  B: { code: '21', hz: 164.81, order: 1 },
  C: { code: '22', hz: 174.61, order: 2 },
  D: { code: '23', hz: 196.00, order: 3 },
  F: { code: '24', hz: 220.00, order: 4 },
  G: { code: '25', hz: 246.94, order: 5 },
  H: { code: '26', hz: 261.63, order: 6 },
  J: { code: '27', hz: 293.66, order: 7 },
  K: { code: '28', hz: 329.63, order: 8 },
  L: { code: '29', hz: 349.23, order: 9 },
  M: { code: '30', hz: 369.99, order: 10 },
  N: { code: '31', hz: 392.00, order: 11 },
  P: { code: '32', hz: 415.30, order: 12 },
  Q: { code: '33', hz: 440.00, order: 13 },
  R: { code: '34', hz: 466.16, order: 14 },
  S: { code: '35', hz: 493.88, order: 15 },
  T: { code: '36', hz: 523.25, order: 16 },
  V: { code: '37', hz: 587.33, order: 17 },
  W: { code: '38', hz: 622.25, order: 18 },
  X: { code: '39', hz: 659.25, order: 19 },
  Y: { code: '40', hz: 698.46, order: 20 },
  Z: { code: '41', hz: 739.99, order: 21 },
};

export const PUNCTUATION_MAP: Record<string, { code: string; hz: number; label: string }> = {
  ' ': { code: '00', hz: 120.00, label: 'Space / Word Break' },
  '.': { code: '91', hz: 130.81, label: 'Period' },
  ',': { code: '92', hz: 146.83, label: 'Comma' },
  '!': { code: '93', hz: 164.81, label: 'Exclamation' },
  '?': { code: '94', hz: 174.61, label: 'Question Mark' },
  '-': { code: '95', hz: 196.00, label: 'Hyphen' },
  "'": { code: '96', hz: 220.00, label: 'Apostrophe' },
  ':': { code: '97', hz: 246.94, label: 'Colon' },
  ';': { code: '98', hz: 261.63, label: 'Semicolon' },
};

// Build reverse lookup table
export const CODE_TO_CHAR: Record<string, { char: string; type: LetterType; hz: number; label: string }> = {};

// Populate Vowels
Object.entries(VOWEL_MAP).forEach(([char, meta]) => {
  CODE_TO_CHAR[meta.code] = {
    char,
    type: 'vowel',
    hz: meta.hz,
    label: `Vowel (${char})`,
  };
});

// Populate Consonants
Object.entries(CONSONANT_MAP).forEach(([char, meta]) => {
  CODE_TO_CHAR[meta.code] = {
    char,
    type: 'consonant',
    hz: meta.hz,
    label: `Consonant (${char})`,
  };
});

// Populate Punctuation & Space
Object.entries(PUNCTUATION_MAP).forEach(([char, meta]) => {
  CODE_TO_CHAR[meta.code] = {
    char,
    type: char === ' ' ? 'separator' : 'punctuation',
    hz: meta.hz,
    label: meta.label,
  };
});

// Populate Digits (80 to 89)
for (let i = 0; i <= 9; i++) {
  const code = (80 + i).toString();
  CODE_TO_CHAR[code] = {
    char: i.toString(),
    type: 'digit',
    hz: 200 + i * 20,
    label: `Digit (${i})`,
  };
}

// Populate Dynamic Word Delimiters / Sophisticated Space Codes:
// 50 - 59: Length-Variant Space Codes (51 = after 1L word, 52 = after 2L word, 53 = after 3L word, 54 = after 4L word...)
for (let i = 0; i <= 9; i++) {
  const code = (50 + i).toString();
  CODE_TO_CHAR[code] = {
    char: ' ',
    type: 'separator',
    hz: 125 + i * 8,
    label: i === 0 ? 'Space (Boundary)' : `Space (after ${i}-letter word)`,
  };
}

// 60 - 69: Rotating Cryptic Prime Delimiters (61, 63, 67, 69...)
for (let i = 0; i <= 9; i++) {
  const code = (60 + i).toString();
  CODE_TO_CHAR[code] = {
    char: ' ',
    type: 'separator',
    hz: 135 + i * 6,
    label: `Cryptic Rotating Space (${code})`,
  };
}

// 70 - 79: Checksum Harmonic Hash Delimiters
for (let i = 0; i <= 9; i++) {
  const code = (70 + i).toString();
  CODE_TO_CHAR[code] = {
    char: ' ',
    type: 'separator',
    hz: 145 + i * 5,
    label: `Checksum Hash Space (${code})`,
  };
}

/**
 * Encode a single character
 */
export function encodeCharacter(char: string): EncodedToken | null {
  const upper = char.toUpperCase();

  if (VOWEL_MAP[upper]) {
    const meta = VOWEL_MAP[upper];
    return {
      originalChar: char,
      code: meta.code,
      type: 'vowel',
      indexInSentence: 0,
      frequencyHz: meta.hz,
      isVowel: true,
      isConsonant: false,
    };
  }

  if (CONSONANT_MAP[upper]) {
    const meta = CONSONANT_MAP[upper];
    return {
      originalChar: char,
      code: meta.code,
      type: 'consonant',
      indexInSentence: 0,
      frequencyHz: meta.hz,
      isVowel: false,
      isConsonant: true,
    };
  }

  if (PUNCTUATION_MAP[char]) {
    const meta = PUNCTUATION_MAP[char];
    return {
      originalChar: char,
      code: meta.code,
      type: char === ' ' ? 'separator' : 'punctuation',
      indexInSentence: 0,
      frequencyHz: meta.hz,
      isVowel: false,
      isConsonant: false,
    };
  }

  // Digits 0-9
  if (/^[0-9]$/.test(char)) {
    const digitNum = parseInt(char, 10);
    const code = (80 + digitNum).toString();
    return {
      originalChar: char,
      code,
      type: 'digit',
      indexInSentence: 0,
      frequencyHz: 200 + digitNum * 20,
      isVowel: false,
      isConsonant: false,
    };
  }

  return null;
}

/**
 * Encode an entire sentence into tokens and formatted strings with dynamic space variation
 */
export function encodeSentence(
  sentence: string,
  format: CipherFormat = 'continuous',
  spaceMode: SpaceMode = 'word-length'
): {
  tokens: EncodedToken[];
  encodedString: string;
  words: WordAnalysis[];
  vowelTotal: number;
  consonantTotal: number;
  separatorTotal: number;
  punctuationTotal: number;
  spaceMode: SpaceMode;
} {
  const tokens: EncodedToken[] = [];
  let vowelTotal = 0;
  let consonantTotal = 0;
  let separatorTotal = 0;
  let punctuationTotal = 0;

  // Track the current word before space to compute dynamic word-length or checksum space codes
  let currentWordChars: string[] = [];
  let currentWordLetterCodes: number[] = [];

  const ROTATING_PRIMES = ['61', '63', '67', '69'];

  for (let i = 0; i < sentence.length; i++) {
    const char = sentence[i];

    if (char === ' ') {
      // Calculate dynamic space code based on selected spaceMode
      let spaceCode = '00';
      let spaceHz = 120;
      const cleanLen = currentWordChars.join('').replace(/[^a-zA-Z]/g, '').length;

      if (spaceMode === 'word-length') {
        // Dynamic based on preceding word length (1L -> 51, 2L -> 52, 3L -> 53, 4L -> 54, etc.)
        if (cleanLen >= 1 && cleanLen <= 8) {
          spaceCode = (50 + cleanLen).toString();
          spaceHz = 125 + cleanLen * 8;
        } else if (cleanLen >= 9) {
          spaceCode = '59';
          spaceHz = 195;
        } else {
          spaceCode = '50';
          spaceHz = 125;
        }
      } else if (spaceMode === 'rotating-prime') {
        // Rotating cryptic prime sequence
        spaceCode = ROTATING_PRIMES[separatorTotal % ROTATING_PRIMES.length];
        spaceHz = 135 + (separatorTotal % 4) * 15;
      } else if (spaceMode === 'checksum') {
        // Checksum hash from preceding letters
        const sum = currentWordLetterCodes.reduce((acc, val) => acc + val, 0);
        const rem = sum % 10;
        spaceCode = (70 + rem).toString();
        spaceHz = 145 + rem * 8;
      } else {
        // Classic 00
        spaceCode = '00';
        spaceHz = 120;
      }

      tokens.push({
        originalChar: ' ',
        code: spaceCode,
        type: 'separator',
        indexInSentence: i,
        frequencyHz: spaceHz,
        isVowel: false,
        isConsonant: false,
      });

      separatorTotal++;
      // Reset current word trackers
      currentWordChars = [];
      currentWordLetterCodes = [];
      continue;
    }

    const encoded = encodeCharacter(char);
    if (encoded) {
      encoded.indexInSentence = i;
      tokens.push(encoded);

      if (encoded.type === 'vowel') vowelTotal++;
      else if (encoded.type === 'consonant') consonantTotal++;
      else if (encoded.type === 'punctuation') punctuationTotal++;

      currentWordChars.push(char);
      if (/^[a-zA-Z]$/.test(char)) {
        currentWordLetterCodes.push(parseInt(encoded.code, 10));
      }
    }
  }

  // Word-by-word structural breakdown (detecting 1-letter, 2-letter, 3-letter, 4-letter words)
  const rawWords = sentence.split(/\s+/).filter(Boolean);
  const words: WordAnalysis[] = rawWords.map((raw) => {
    const clean = raw.replace(/[^a-zA-Z]/g, '');
    const cleanLen = clean.length;
    let lengthCategory: WordAnalysis['lengthCategory'] = '5+-letter';
    if (cleanLen === 1) lengthCategory = '1-letter';
    else if (cleanLen === 2) lengthCategory = '2-letter';
    else if (cleanLen === 3) lengthCategory = '3-letter';
    else if (cleanLen === 4) lengthCategory = '4-letter';

    const wordTokens: EncodedToken[] = [];
    let wordVowels = 0;
    let wordConsonants = 0;

    for (const ch of raw) {
      const tok = encodeCharacter(ch);
      if (tok) {
        wordTokens.push(tok);
        if (tok.type === 'vowel') wordVowels++;
        if (tok.type === 'consonant') wordConsonants++;
      }
    }

    const numericCode = wordTokens.map((t) => t.code).join('');
    const vowelRatio = cleanLen > 0 ? (wordVowels / cleanLen) : 0;

    return {
      word: raw,
      cleanWord: clean,
      length: cleanLen,
      lengthCategory,
      tokens: wordTokens,
      numericCode,
      vowelCount: wordVowels,
      consonantCount: wordConsonants,
      vowelRatio,
    };
  });

  // Build output according to requested format
  let encodedString = '';
  if (format === 'continuous') {
    encodedString = tokens.map((t) => t.code).join('');
  } else if (format === 'spaced') {
    encodedString = tokens.map((t) => t.code).join(' ');
  } else if (format === 'hyphenated') {
    encodedString = tokens.map((t) => t.code).join('-');
  } else if (format === 'word-bracketed') {
    // Reconstruct with dynamic space codes between brackets
    const bracketParts: string[] = [];
    let wordIdx = 0;

    for (const tok of tokens) {
      if (tok.type === 'separator') {
        bracketParts.push(` ${tok.code} `);
      } else if (tok.indexInSentence === 0 || tokens[tokens.indexOf(tok) - 1]?.type === 'separator') {
        const w = words[wordIdx];
        if (w) {
          bracketParts.push(`[${w.length}L: ${w.tokens.map((t) => t.code).join('-')}]`);
          wordIdx++;
        }
      }
    }

    encodedString = bracketParts.length > 0 ? bracketParts.join('') : words.map((w) => `[${w.length}L: ${w.tokens.map((t) => t.code).join('-')}]`).join(' 50 ');
  }

  return {
    tokens,
    encodedString,
    words,
    vowelTotal,
    consonantTotal,
    separatorTotal,
    punctuationTotal,
    spaceMode,
  };
}

/**
 * Decode numeric string back to sentence
 * Handles continuous digit streams (2 digits per letter) as well as space/dash/comma delimited
 */
export function decodeNumberString(input: string): DecodeResult {
  if (!input || !input.trim()) {
    return {
      sentence: '',
      tokens: [],
      success: true,
      totalTokens: 0,
      validTokens: 0,
      invalidCount: 0,
      detectedWordCount: 0,
    };
  }

  // Clean brackets and annotations like [1L: ... ]
  let cleaned = input.replace(/\[\d+L:\s*([^\]]+)\]/g, '$1');

  // Check if string contains delimiters (spaces, commas, hyphens, slashes)
  const hasDelimiters = /[\s,\-\/_|]/.test(cleaned.trim());

  let tokenCodes: string[] = [];

  if (hasDelimiters) {
    // Split by delimiters and filter out empty strings
    tokenCodes = cleaned
      .split(/[\s,\-\/_|]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } else {
    // Continuous digit stream: group by 2 digits
    const digitsOnly = cleaned.replace(/\D/g, '');
    for (let i = 0; i < digitsOnly.length; i += 2) {
      tokenCodes.push(digitsOnly.slice(i, i + 2));
    }
  }

  const decodeSteps: DecodeStep[] = [];
  let decodedSentence = '';
  let validTokens = 0;
  let invalidCount = 0;

  for (const code of tokenCodes) {
    // Lookup
    const match = CODE_TO_CHAR[code];
    if (match) {
      decodeSteps.push({
        tokenCode: code,
        decodedChar: match.char,
        type: match.type,
        isValid: true,
      });
      decodedSentence += match.char;
      validTokens++;
    } else {
      decodeSteps.push({
        tokenCode: code,
        decodedChar: '',
        type: 'punctuation',
        isValid: false,
        reason: `Unknown code "${code}" (valid codes: vowels 11-15, consonants 21-41, space 00, punct 91-98, digits 80-89)`,
      });
      decodedSentence += '?';
      invalidCount++;
    }
  }

  // Count detected words
  const detectedWordCount = decodedSentence.split(/\s+/).filter(Boolean).length;

  return {
    sentence: decodedSentence,
    tokens: decodeSteps,
    success: invalidCount === 0,
    totalTokens: tokenCodes.length,
    validTokens,
    invalidCount,
    detectedWordCount,
  };
}

/**
 * Preset sentences curated specifically for 1, 2, 3, 4-letter words
 */
export interface PresetSentence {
  id: string;
  title: string;
  banglaTitle: string;
  sentence: string;
  focus: string;
  letterComposition: {
    oneLetter: string[];
    twoLetter: string[];
    threeLetter: string[];
    fourLetter: string[];
  };
}

export const PRESET_SENTENCES: PresetSentence[] = [
  {
    id: 'preset-1',
    title: 'The Room & Cups',
    banglaTitle: '১, ২, ৩, ৪ অক্ষরের শব্দ মিশ্রণ (রুম ও কাপ)',
    sentence: 'I am in a room with four blue cups.',
    focus: 'Demonstrates 1-letter ("I", "a"), 2-letter ("am", "in"), 3-letter, and 4-letter ("room", "with", "four", "blue", "cups") words.',
    letterComposition: {
      oneLetter: ['I', 'a'],
      twoLetter: ['am', 'in'],
      threeLetter: [],
      fourLetter: ['room', 'with', 'four', 'blue', 'cups'],
    },
  },
  {
    id: 'preset-2',
    title: 'Reading on the Way',
    banglaTitle: 'পড়া ও পথ (১, ২, ৩, ৪ অক্ষরের ব্যালান্স)',
    sentence: 'He is on the way to read a good book.',
    focus: 'Features 1-letter ("a"), 2-letter ("He", "is", "on", "to"), 3-letter ("the", "way"), and 4-letter ("read", "good", "book") words.',
    letterComposition: {
      oneLetter: ['a'],
      twoLetter: ['He', 'is', 'on', 'to'],
      threeLetter: ['the', 'way'],
      fourLetter: ['read', 'good', 'book'],
    },
  },
  {
    id: 'preset-3',
    title: 'The Cat and Dog',
    banglaTitle: 'বিড়াল ও কুকুর (সহজ শব্দমালা)',
    sentence: 'A cat and a dog play near the tree.',
    focus: 'Classic short-word sentence showcasing vowel/consonant alternating patterns in words from 1 to 4 letters.',
    letterComposition: {
      oneLetter: ['A', 'a'],
      twoLetter: [],
      threeLetter: ['cat', 'and', 'dog', 'the'],
      fourLetter: ['play', 'near', 'tree'],
    },
  },
  {
    id: 'preset-4',
    title: 'Dawn & Sun',
    banglaTitle: 'সকালের সূর্য (২ ও ৩ অক্ষরের ছন্দ)',
    sentence: 'Go to bed now or wake up at dawn.',
    focus: 'Heavy on 2-letter imperative words ("Go", "to", "or", "up", "at") and 3-letter words ("bed", "now").',
    letterComposition: {
      oneLetter: [],
      twoLetter: ['Go', 'to', 'or', 'up', 'at'],
      threeLetter: ['bed', 'now'],
      fourLetter: ['wake', 'dawn'],
    },
  },
  {
    id: 'preset-5',
    title: 'Vowel & Consonant Harmony',
    banglaTitle: 'স্বরবর্ণ ও ব্যঞ্জনবর্ণের ছন্দময় মিলন',
    sentence: 'We see five red birds in the sky.',
    focus: 'Balanced vowel frequency with pure vowel/consonant number contrasts.',
    letterComposition: {
      oneLetter: [],
      twoLetter: ['We', 'in'],
      threeLetter: ['see', 'red', 'the', 'sky'],
      fourLetter: ['five'],
    },
  },
];
