/**
 * Morse code mapping for alphanumeric characters.
 * Based on International Morse Code standard.
 */
export const MORSE_CODE_MAP: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  ' ': '/', // Word separator
};

/**
 * Converts a text string to morse code.
 * Unsupported characters are ignored.
 *
 * @param text - The input text to convert
 * @returns The morse code representation, with spaces between letters and '/' for word breaks
 */
export function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map(char => MORSE_CODE_MAP[char] || '')
    .filter(morse => morse !== '')
    .join(' ');
}
