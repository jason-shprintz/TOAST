/**
 * @format
 */

import { textToMorse, MORSE_CODE_MAP } from '../src/utils/morseCodeMapping';

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
});
