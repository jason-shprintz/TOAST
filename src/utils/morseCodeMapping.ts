/**
 * Morse code mapping for alphanumeric characters.
 * Based on International Morse Code standard.
 */

export type MorseItem = {
  char: string;
  morse: string;
  spellOut: string;
};

export const morseCodeData: MorseItem[] = [
  // Alphabet
  { char: 'A', morse: '.-', spellOut: 'dot dash' },
  { char: 'B', morse: '-...', spellOut: 'dash dot dot dot' },
  { char: 'C', morse: '-.-.', spellOut: 'dash dot dash dot' },
  { char: 'D', morse: '-..', spellOut: 'dash dot dot' },
  { char: 'E', morse: '.', spellOut: 'dot' },
  { char: 'F', morse: '..-.', spellOut: 'dot dot dash dot' },
  { char: 'G', morse: '--.', spellOut: 'dash dash dot' },
  { char: 'H', morse: '....', spellOut: 'dot dot dot dot' },
  { char: 'I', morse: '..', spellOut: 'dot dot' },
  { char: 'J', morse: '.---', spellOut: 'dot dash dash dash' },
  { char: 'K', morse: '-.-', spellOut: 'dash dot dash' },
  { char: 'L', morse: '.-..', spellOut: 'dot dash dot dot' },
  { char: 'M', morse: '--', spellOut: 'dash dash' },
  { char: 'N', morse: '-.', spellOut: 'dash dot' },
  { char: 'O', morse: '---', spellOut: 'dash dash dash' },
  { char: 'P', morse: '.--.', spellOut: 'dot dash dash dot' },
  { char: 'Q', morse: '--.-', spellOut: 'dash dash dot dash' },
  { char: 'R', morse: '.-.', spellOut: 'dot dash dot' },
  { char: 'S', morse: '...', spellOut: 'dot dot dot' },
  { char: 'T', morse: '-', spellOut: 'dash' },
  { char: 'U', morse: '..-', spellOut: 'dot dot dash' },
  { char: 'V', morse: '...-', spellOut: 'dot dot dot dash' },
  { char: 'W', morse: '.--', spellOut: 'dot dash dash' },
  { char: 'X', morse: '-..-', spellOut: 'dash dot dot dash' },
  { char: 'Y', morse: '-.--', spellOut: 'dash dot dash dash' },
  { char: 'Z', morse: '--..', spellOut: 'dash dash dot dot' },
  // Numbers
  { char: '0', morse: '-----', spellOut: 'dash dash dash dash dash' },
  { char: '1', morse: '.----', spellOut: 'dot dash dash dash dash' },
  { char: '2', morse: '..---', spellOut: 'dot dot dash dash dash' },
  { char: '3', morse: '...--', spellOut: 'dot dot dot dash dash' },
  { char: '4', morse: '....-', spellOut: 'dot dot dot dot dash' },
  { char: '5', morse: '.....', spellOut: 'dot dot dot dot dot' },
  { char: '6', morse: '-....', spellOut: 'dash dot dot dot dot' },
  { char: '7', morse: '--...', spellOut: 'dash dash dot dot dot' },
  { char: '8', morse: '---..', spellOut: 'dash dash dash dot dot' },
  { char: '9', morse: '----.', spellOut: 'dash dash dash dash dot' },
];

// Create lookup map from morse data
export const MORSE_CODE_MAP: Record<string, string> = morseCodeData.reduce(
  (acc, item) => {
    acc[item.char] = item.morse;
    return acc;
  },
  {} as Record<string, string>,
);

// Add space as word separator
MORSE_CODE_MAP[' '] = '/';

/**
 * Converts a text string to morse code.
 * Unsupported characters are ignored.
 * Multiple consecutive spaces are treated as a single word separator.
 *
 * @param text - The input text to convert
 * @returns The morse code representation, with spaces between letters and '/' for word breaks
 */
export function textToMorse(text: string): string {
  // Normalize multiple spaces to single space and trim
  const normalized = text.trim().replace(/\s+/g, ' ');
  
  return normalized
    .toUpperCase()
    .split('')
    .map(char => MORSE_CODE_MAP[char] || '')
    .filter(morse => morse !== '')
    .join(' ');
}
