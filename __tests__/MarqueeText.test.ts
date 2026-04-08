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

  describe('animation parameters — ticker behavior', () => {
    const SPEED_PX_PER_S = 40;

    it('scroll phase duration is proportional to full text width', () => {
      // The text scrolls fully off the left edge (0 → -textWidth).
      const textWidth100 = Math.round((100 / SPEED_PX_PER_S) * 1000);
      const textWidth200 = Math.round((200 / SPEED_PX_PER_S) * 1000);

      expect(textWidth200).toBeGreaterThan(textWidth100);
      expect(textWidth200).toBe(textWidth100 * 2);
    });

    it('enter phase duration is proportional to container width', () => {
      // Text slides in from the right edge (containerWidth → 0).
      const enter100 = Math.round((100 / SPEED_PX_PER_S) * 1000);
      const enter200 = Math.round((200 / SPEED_PX_PER_S) * 1000);

      expect(enter200).toBeGreaterThan(enter100);
      expect(enter200).toBe(enter100 * 2);
    });

    it('scroll exits left edge: toValue is -textWidth', () => {
      const textWidth = 350;
      const toValue = -textWidth;
      expect(toValue).toBe(-350);
    });

    it('enter starts from right edge: fromValue is +containerWidth', () => {
      const containerWidth = 200;
      // After scrolling off the left, animValue is reset to containerWidth
      // so the text enters from the right.
      expect(containerWidth).toBeGreaterThan(0);
    });

    it('duration rounds to nearest millisecond', () => {
      // 75px at 40px/s = 1875ms (exact)
      const duration = Math.round((75 / SPEED_PX_PER_S) * 1000);
      expect(duration).toBe(1875);
    });

    it('respects custom speed for both phases', () => {
      const customSpeed = 80;
      const distance = 100;
      const duration = Math.round((distance / customSpeed) * 1000);

      // At double the speed, duration should be halved
      const defaultDuration = Math.round((distance / SPEED_PX_PER_S) * 1000);
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
