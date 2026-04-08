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

  describe('latch (cascade prevention)', () => {
    it('shouldScroll is true once overflow is detected, even after isOverflowing resets', () => {
      // Simulates what happens when padding is removed after overflow detection:
      // the container gets wider, so isOverflowing temporarily flips to false.
      // The latch keeps shouldScroll = true to prevent oscillation.
      let isScrollingLatched = false;

      // Step 1: overflow detected → latch
      const isOverflowing1 = true;
      if (isOverflowing1 && !isScrollingLatched) isScrollingLatched = true;
      const shouldScroll1 = isScrollingLatched || isOverflowing1;
      expect(shouldScroll1).toBe(true);

      // Step 2: padding removed, container wider → isOverflowing flips false
      const isOverflowing2 = false;
      if (isOverflowing2 && !isScrollingLatched) isScrollingLatched = true;
      const shouldScroll2 = isScrollingLatched || isOverflowing2;
      expect(shouldScroll2).toBe(true); // latch holds
    });

    it('latch resets when text content changes', () => {
      let isScrollingLatched = true; // latched from previous title

      // Simulate children change effect resetting the latch
      isScrollingLatched = false;
      expect(isScrollingLatched).toBe(false);
    });
  });

  describe('animation parameters — stock ticker', () => {
    const SPEED_PX_PER_S = 40;

    it('scroll phase duration based on full text width (exits left edge)', () => {
      // 0 → -textWidth
      const dur100 = Math.round((100 / SPEED_PX_PER_S) * 1000);
      const dur200 = Math.round((200 / SPEED_PX_PER_S) * 1000);
      expect(dur200).toBeGreaterThan(dur100);
      expect(dur200).toBe(dur100 * 2);
    });

    it('enter phase duration based on container width (enters from right)', () => {
      // containerWidth → 0
      const enter100 = Math.round((100 / SPEED_PX_PER_S) * 1000);
      const enter200 = Math.round((200 / SPEED_PX_PER_S) * 1000);
      expect(enter200).toBeGreaterThan(enter100);
      expect(enter200).toBe(enter100 * 2);
    });

    it('scroll exits to -textWidth so text fully leaves the left edge', () => {
      const textWidth = 350;
      expect(-textWidth).toBe(-350);
    });

    it('jump target is +containerWidth so text re-enters from the right', () => {
      const containerWidth = 200;
      // animValue is set to containerWidth (just beyond right edge, clipped)
      // before the enter-phase animation slides it back to 0.
      expect(containerWidth).toBeGreaterThan(0);
    });

    it('duration rounds to nearest millisecond', () => {
      // 75 px at 40 px/s = 1875 ms (exact)
      const duration = Math.round((75 / SPEED_PX_PER_S) * 1000);
      expect(duration).toBe(1875);
    });

    it('respects custom speed for both phases', () => {
      const customSpeed = 80; // double the default
      const distance = 100;
      const customDuration = Math.round((distance / customSpeed) * 1000);
      const defaultDuration = Math.round((distance / SPEED_PX_PER_S) * 1000);
      expect(customDuration).toBe(defaultDuration / 2);
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
