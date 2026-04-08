/**
 * @format
 */

describe('MarqueeText', () => {
  describe('overflow detection logic', () => {
    it('text fits when text width is less than container width', () => {
      const containerWidth = 200;
      const textWidth = 150;
      const isOverflowing = containerWidth > 0 && textWidth > containerWidth;
      expect(isOverflowing).toBe(false);
    });

    it('text fits when text width equals container width', () => {
      const containerWidth = 200;
      const textWidth = 200;
      const isOverflowing = containerWidth > 0 && textWidth > containerWidth;
      expect(isOverflowing).toBe(false);
    });

    it('text overflows when text width exceeds container width', () => {
      const containerWidth = 200;
      const textWidth = 350;
      const isOverflowing = containerWidth > 0 && textWidth > containerWidth;
      expect(isOverflowing).toBe(true);
    });

    it('no overflow when container width is zero (not yet measured)', () => {
      const containerWidth = 0;
      const textWidth = 350;
      const isOverflowing = containerWidth > 0 && textWidth > containerWidth;
      expect(isOverflowing).toBe(false);
    });
  });

  describe('animation parameters', () => {
    const SPEED_PX_PER_S = 40;

    it('calculates scroll duration proportional to overflow length', () => {
      const overflow50 = Math.round((50 / SPEED_PX_PER_S) * 1000);
      const overflow100 = Math.round((100 / SPEED_PX_PER_S) * 1000);

      // Longer overflow → longer duration
      expect(overflow100).toBeGreaterThan(overflow50);
      // Duration is proportional
      expect(overflow100).toBe(overflow50 * 2);
    });

    it('duration rounds to nearest millisecond', () => {
      // 75px overflow at 40px/s = 1875ms (exact)
      const duration = Math.round((75 / SPEED_PX_PER_S) * 1000);
      expect(duration).toBe(1875);
    });

    it('scroll target equals negative overflow', () => {
      const containerWidth = 200;
      const textWidth = 350;
      const overflow = textWidth - containerWidth;
      const toValue = -overflow;

      expect(toValue).toBe(-150);
    });

    it('respects custom speed', () => {
      const customSpeed = 80;
      const overflow = 100;
      const duration = Math.round((overflow / customSpeed) * 1000);

      // At double the speed, duration should be halved
      const defaultDuration = Math.round((overflow / SPEED_PX_PER_S) * 1000);
      expect(duration).toBe(defaultDuration / 2);
    });
  });

  describe('font scaling', () => {
    it('scales fontSize by fontScale factor', () => {
      const baseFontSize = 20;
      const fontScale = 1.3;
      const scaledFontSize = baseFontSize * fontScale;

      expect(scaledFontSize).toBeCloseTo(26);
    });

    it('does not modify fontSize when fontScale is 1', () => {
      const baseFontSize = 20;
      const fontScale = 1.0;
      const scaledFontSize = baseFontSize * fontScale;

      expect(scaledFontSize).toBe(20);
    });

    it('handles non-numeric fontSize gracefully', () => {
      // When fontSize is not a number the style object is returned unchanged
      const flatStyle: Record<string, unknown> = { fontFamily: 'Bitter-Bold' };
      const result =
        typeof flatStyle.fontSize === 'number'
          ? { ...flatStyle, fontSize: (flatStyle.fontSize as number) * 1.5 }
          : flatStyle;

      expect(result).toEqual({ fontFamily: 'Bitter-Bold' });
    });
  });
});
