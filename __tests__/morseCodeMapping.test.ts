/**
 * @format
 */

import { textToMorse, morseToText, MORSE_CODE_MAP, REVERSE_MORSE_CODE_MAP } from '../src/utils/morseCodeMapping';

describe('morseCodeMapping', () => {
  describe('textToMorse', () => {
    it('should convert single letters correctly', () => {
      expect(textToMorse('A')).toBe('.-');
      expect(textToMorse('E')).toBe('.');
      expect(textToMorse('T')).toBe('-');
      expect(textToMorse('S')).toBe('...');
    });

    it('should convert numbers correctly', () => {
      expect(textToMorse('0')).toBe('-----');
      expect(textToMorse('1')).toBe('.----');
      expect(textToMorse('5')).toBe('.....');
      expect(textToMorse('9')).toBe('----.');
    });

    it('should convert words with spaces between letters', () => {
      expect(textToMorse('SOS')).toBe('... --- ...');
      expect(textToMorse('HI')).toBe('.... ..');
    });

    it('should convert multiple words with "/" separator', () => {
      expect(textToMorse('HI THERE')).toBe('.... .. / - .... . .-. .');
      expect(textToMorse('SOS HELP')).toBe('... --- ... / .... . .-.. .--.');
    });

    it('should handle lowercase letters', () => {
      expect(textToMorse('hello')).toBe('.... . .-.. .-.. ---');
      expect(textToMorse('HeLLo')).toBe('.... . .-.. .-.. ---');
    });

    it('should handle mixed alphanumeric text', () => {
      expect(textToMorse('A1B2')).toBe('.- .---- -... ..---');
      expect(textToMorse('TEST 123')).toBe('- . ... - / .---- ..--- ...--');
    });

    it('should trim leading and trailing spaces', () => {
      expect(textToMorse(' HI ')).toBe('.... ..');
      expect(textToMorse('  TEST  ')).toBe('- . ... -');
    });

    it('should collapse multiple consecutive spaces to single word separator', () => {
      expect(textToMorse('HI  THERE')).toBe('.... .. / - .... . .-. .');
      expect(textToMorse('A   B')).toBe('.- / -...');
    });

    it('should ignore unsupported characters', () => {
      expect(textToMorse('HI!')).toBe('.... ..');
      expect(textToMorse('HELLO@WORLD')).toBe('.... . .-.. .-.. --- .-- --- .-. .-.. -..');
      expect(textToMorse('TEST#123')).toBe('- . ... - .---- ..--- ...--');
    });

    it('should handle empty string', () => {
      expect(textToMorse('')).toBe('');
    });

    it('should handle whitespace-only string', () => {
      expect(textToMorse('   ')).toBe('');
      expect(textToMorse('\t\n')).toBe('');
    });

    it('should handle string with only unsupported characters', () => {
      expect(textToMorse('!@#$%')).toBe('');
      expect(textToMorse('   !@#   ')).toBe('');
    });
  });

  describe('MORSE_CODE_MAP', () => {
    it('should contain all letters A-Z', () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      letters.forEach(letter => {
        expect(MORSE_CODE_MAP[letter]).toBeDefined();
        expect(MORSE_CODE_MAP[letter]).toMatch(/^[.-]+$/);
      });
    });

    it('should contain all numbers 0-9', () => {
      const numbers = '0123456789'.split('');
      numbers.forEach(number => {
        expect(MORSE_CODE_MAP[number]).toBeDefined();
        expect(MORSE_CODE_MAP[number]).toMatch(/^[.-]+$/);
      });
    });

    it('should map space to word separator', () => {
      expect(MORSE_CODE_MAP[' ']).toBe('/');
    });

    it('should have correct morse patterns for common letters', () => {
      expect(MORSE_CODE_MAP.E).toBe('.');
      expect(MORSE_CODE_MAP.T).toBe('-');
      expect(MORSE_CODE_MAP.S).toBe('...');
      expect(MORSE_CODE_MAP.O).toBe('---');
    });
  });

  describe('morseToText', () => {
    it('should convert single morse characters correctly', () => {
      expect(morseToText('.-')).toBe('A');
      expect(morseToText('.')).toBe('E');
      expect(morseToText('-')).toBe('T');
      expect(morseToText('...')).toBe('S');
    });

    it('should convert morse numbers correctly', () => {
      expect(morseToText('-----')).toBe('0');
      expect(morseToText('.----')).toBe('1');
      expect(morseToText('.....')).toBe('5');
      expect(morseToText('----.')).toBe('9');
    });

    it('should convert morse words with spaces between characters', () => {
      expect(morseToText('... --- ...')).toBe('SOS');
      expect(morseToText('.... ..')).toBe('HI');
    });

    it('should convert multiple words with "/" separator', () => {
      expect(morseToText('.... .. / - .... . .-. .')).toBe('HI THERE');
      expect(morseToText('... --- ... / .... . .-.. .--.')).toBe('SOS HELP');
    });

    it('should handle mixed alphanumeric morse', () => {
      expect(morseToText('.- .---- -... ..---')).toBe('A1B2');
      expect(morseToText('- . ... - / .---- ..--- ...--')).toBe('TEST 123');
    });

    it('should ignore unrecognized morse patterns', () => {
      expect(morseToText('.... .. ..-..')).toBe('HI');
      expect(morseToText('... --- ... ..--..')).toBe('SOS');
    });

    it('should handle empty string', () => {
      expect(morseToText('')).toBe('');
    });

    it('should handle whitespace-only string', () => {
      expect(morseToText('   ')).toBe('');
      expect(morseToText('\t\n')).toBe('');
    });

    it('should handle string with only unrecognized patterns', () => {
      expect(morseToText('..--.. ---.....')).toBe('');
    });

    it('should be reversible with textToMorse for valid text', () => {
      const testCases = ['HELLO', 'SOS', 'TEST 123', 'A1B2'];
      testCases.forEach(text => {
        const morse = textToMorse(text);
        const reversed = morseToText(morse);
        expect(reversed).toBe(text);
      });
    });
  });

  describe('REVERSE_MORSE_CODE_MAP', () => {
    it('should contain reverse mappings for all letters A-Z', () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      letters.forEach(letter => {
        const morse = MORSE_CODE_MAP[letter];
        expect(REVERSE_MORSE_CODE_MAP[morse]).toBe(letter);
      });
    });

    it('should contain reverse mappings for all numbers 0-9', () => {
      const numbers = '0123456789'.split('');
      numbers.forEach(number => {
        const morse = MORSE_CODE_MAP[number];
        expect(REVERSE_MORSE_CODE_MAP[morse]).toBe(number);
      });
    });

    it('should map word separator to space', () => {
      expect(REVERSE_MORSE_CODE_MAP['/']).toBe(' ');
    });
  });
});
