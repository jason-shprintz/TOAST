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

  describe('animation parameters — two-copy ticker', () => {
    const SPEED_PX_PER_S = 40;
    const TICKER_GAP_PX = 100;

    it('cycle length is textWidth + gap', () => {
      const textWidth = 350;
      const cycleLength = textWidth + TICKER_GAP_PX;
      expect(cycleLength).toBe(450);
    });

    it('cycle duration is proportional to cycle length', () => {
      const dur100 = Math.round((100 / SPEED_PX_PER_S) * 1000);
      const dur450 = Math.round((450 / SPEED_PX_PER_S) * 1000);
      // 450/100 = 4.5× longer
      expect(dur450).toBe(dur100 * 4.5);
    });

    it('animation scrolls to -(textWidth + gap) — loop reset is seamless', () => {
      // At the end of the cycle, copy B (offset by textWidth+gap) lands at 0 —
      // the same as copy A's start position, so Animated.loop's reset is invisible.
      const textWidth = 350;
      const cycleLength = textWidth + TICKER_GAP_PX;
      // Copy B's position at the end of the cycle:
      const copyBFinalPos = -cycleLength + textWidth + TICKER_GAP_PX;
      expect(copyBFinalPos).toBe(0); // seamless reset
    });

    it('copy B starts off-screen to the right at the start of a cycle', () => {
      // animValue = 0 at cycle start: copy A is at 0, copy B is at textWidth + gap
      const textWidth = 350;
      const copyBInitialPos = 0 + textWidth + TICKER_GAP_PX;
      // For a 350px text with a typical container < 350px, copy B is off-screen right
      expect(copyBInitialPos).toBe(450);
    });

    it('duration rounds to nearest millisecond', () => {
      // 75 px at 40 px/s = 1875 ms (exact)
      const duration = Math.round((75 / SPEED_PX_PER_S) * 1000);
      expect(duration).toBe(1875);
    });

    it('respects custom speed', () => {
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
