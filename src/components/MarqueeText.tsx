import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSettingsStore } from '../stores';

type Props = {
  children?: React.ReactNode;
  /** Text styles applied to the inner animated text node. */
  style?: StyleProp<TextStyle>;
  /** View styles applied to the outer clipping container. */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Scroll speed in pixels per second.
   * @default 40
   */
  speed?: number;
  /**
   * Called when the overflow/scroll state changes so that parents can adjust
   * layout (e.g. remove left padding when the text is scrolling).
   */
  onOverflowChange?: (isOverflowing: boolean) => void;
};

const PAUSE_START_MS = 1500;
const DEFAULT_SPEED_PX_PER_S = 40;
/**
 * Pixel gap between the trailing edge of the exiting copy and the leading edge
 * of the entering copy. At this gap the second copy starts appearing from the
 * right before the first has fully left the left edge — giving a continuous,
 * overlap-free ticker effect.
 */
const TICKER_GAP_PX = 100;

/**
 * Renders text that scrolls horizontally like a stock ticker when the content
 * is wider than the available container.
 *
 * When the text fits within the container it renders statically, centred.
 * When it overflows it loops continuously using two copies of the text:
 *   1. Pause 1.5 s at position 0 (copy A visible, copy B off the right edge).
 *   2. Both copies scroll left at the same speed.  When copy A's trailing
 *      edge is TICKER_GAP_PX (100 px) from the right edge of the container,
 *      copy B's leading edge starts entering from the right.
 *   3. Copy A exits the left edge; copy B reaches position 0.
 *   4. Loop resets seamlessly — copy B is now at 0, which is exactly where
 *      copy A was at step 1, so no visual jump occurs.
 *
 * ### Row animation
 * Both copies live in a single `Animated.View` row:
 *   [copy A][TICKER_GAP_PX spacer][copy B]
 * The row is translated by `animValue` which cycles from 0 to
 * -(textWidth + TICKER_GAP_PX). At the end of the cycle copy B is at 0;
 * the loop reset to 0 puts copy A back at 0 — seamless.
 *
 * ### Measurement
 * A hidden, absolutely-positioned RNText with `alignSelf: 'flex-start'` is used
 * to measure the text's natural single-line width. Without `alignSelf:
 * 'flex-start'` the Text node would stretch to fill the 9999 px measurement
 * container (Yoga's default `alignItems: stretch`), making every title appear
 * to overflow.
 *
 * ### Cascade prevention
 * When scrolling starts, `onOverflowChange(true)` is called and the parent
 * typically removes left padding, widening the container. To prevent the
 * resulting `containerWidth` change from flipping `isOverflowing` back to
 * `false` (and oscillating), the "should scroll" decision is latched once
 * overflow is first detected, and only resets when the text content changes.
 */
const MarqueeText = observer(function MarqueeText({
  children,
  style,
  containerStyle,
  speed = DEFAULT_SPEED_PX_PER_S,
  onOverflowChange,
}: Props) {
  const settingsStore = useSettingsStore();
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const animValue = useRef(new Animated.Value(0)).current;

  // Once overflow is confirmed for the current text content, latch the "scroll"
  // decision so that a subsequent padding-driven container resize cannot flip it
  // back to false and cause an oscillation.
  const [isScrollingLatched, setIsScrollingLatched] = useState(false);

  // Reset the latch whenever the text content itself changes.
  useEffect(() => {
    setIsScrollingLatched(false);
  }, [children]);

  const isOverflowing = containerWidth > 0 && textWidth > containerWidth;

  // Latch: once overflow is detected, commit to scrolling.
  useEffect(() => {
    if (isOverflowing && !isScrollingLatched) {
      setIsScrollingLatched(true);
    }
  }, [isOverflowing, isScrollingLatched]);

  const shouldScroll = isScrollingLatched || isOverflowing;

  // Apply font scaling the same way ScaledText does.
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const scaledStyle: TextStyle = {
    ...flatStyle,
    ...(typeof flatStyle.fontSize === 'number'
      ? { fontSize: flatStyle.fontSize * settingsStore.fontScale }
      : {}),
  };

  // Notify parent when the scroll state changes.
  const prevScrollRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevScrollRef.current !== shouldScroll) {
      prevScrollRef.current = shouldScroll;
      onOverflowChange?.(shouldScroll);
    }
  }, [shouldScroll, onOverflowChange]);

  useEffect(() => {
    animRef.current?.stop();
    animValue.setValue(0);

    if (!shouldScroll || textWidth === 0) {
      return;
    }

    // One full cycle moves the row by (textWidth + gap).  At the end of the
    // cycle, copy B is at position 0 — identical to copy A's start position —
    // so the Animated.loop reset is seamless with no visible jump.
    const cycleLength = textWidth + TICKER_GAP_PX;
    const cycleDuration = Math.round((cycleLength / speed) * 1000);

    animRef.current = Animated.loop(
      Animated.sequence([
        // Pause so the user can read the beginning of the title.
        Animated.delay(PAUSE_START_MS),
        // Scroll both copies left by one full cycle length.
        Animated.timing(animValue, {
          toValue: -cycleLength,
          duration: cycleDuration,
          useNativeDriver: true,
        }),
      ]),
    );
    animRef.current.start();

    return () => {
      animRef.current?.stop();
    };
  }, [shouldScroll, textWidth, speed, animValue]);

  const onContainerLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      setContainerWidth(e.nativeEvent.layout.width);
    },
    [],
  );

  const onTextLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      setTextWidth(e.nativeEvent.layout.width);
    },
    [],
  );

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={onContainerLayout}
    >
      {/* Hidden measurement node.
          `alignItems: 'flex-start'` on the wrapper (and `alignSelf: 'flex-start'`
          on the Text) prevents Yoga's default stretch behaviour from expanding the
          Text to the wrapper's 9999 px width. Without this the measured width is
          always ≈ 9999, causing every title to be treated as overflowing. */}
      <View style={styles.measureContainer}>
        <RNText
          style={[scaledStyle, styles.measureText]}
          numberOfLines={1}
          onLayout={onTextLayout}
        >
          {children}
        </RNText>
      </View>

      {shouldScroll ? (
        /* Ticker: an Animated.View row containing two copies of the text
           separated by TICKER_GAP_PX.  Both copies translate together so the
           second copy enters from the right as the first exits to the left,
           giving continuous seamless overlap-free scrolling. */
        <Animated.View
          style={[styles.tickerRow, { transform: [{ translateX: animValue }] }]}
        >
          <RNText style={[scaledStyle, { width: textWidth }]}>
            {children}
          </RNText>
          <View style={styles.tickerGap} accessible={false} />
          <RNText style={[scaledStyle, { width: textWidth }]}>
            {children}
          </RNText>
        </Animated.View>
      ) : (
        /* Static: centred, single line. */
        <RNText style={[scaledStyle, styles.centeredText]} numberOfLines={1}>
          {children}
        </RNText>
      )}
    </View>
  );
});

export default MarqueeText;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  measureContainer: {
    position: 'absolute',
    opacity: 0,
    width: 9999,
    top: 0,
    left: 0,
    // Prevent Yoga's default alignItems: 'stretch' from expanding the Text
    // child to the full 9999 px width of this container.
    alignItems: 'flex-start',
  },
  measureText: {
    // Belt-and-suspenders: also override alignSelf so the text always
    // reports its natural single-line content width.
    alignSelf: 'flex-start',
  },
  centeredText: {
    textAlign: 'center',
    width: '100%',
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerGap: {
    width: TICKER_GAP_PX,
  },
});
