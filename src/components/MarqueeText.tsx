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
 * Renders text that scrolls horizontally like a stock ticker when the content
 * is wider than the available container.
 *
 * When the text fits within the container it renders statically, centred.
 * When it overflows it loops continuously:
 *   1. Pause 1.5 s at position 0 so the user can read the start.
 *   2. Scroll left until the text fully exits the left edge (x = -textWidth).
 *   3. Jump instantly to x = containerWidth (just off the right edge — hidden
 *      because the container uses overflow: 'hidden').
 *   4. Slide in from the right to position 0.
 *   5. Repeat.
 *
 * Font scaling from SettingsStore is applied automatically (mirrors ScaledText).
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

    if (!shouldScroll || containerWidth === 0 || textWidth === 0) {
      return;
    }

    // Duration to scroll the full text width off the left edge (0 → -textWidth).
    const scrollDuration = Math.round((textWidth / speed) * 1000);
    // Duration to slide in from the right edge (containerWidth → 0).
    const enterDuration = Math.round((containerWidth / speed) * 1000);

    // The entire loop runs on the native thread via Animated.loop.
    // The duration: 0 timing performs an instant (invisible) jump from the
    // exited-left position to just beyond the right edge; the container's
    // overflow: 'hidden' ensures the text is never seen at that position.
    animRef.current = Animated.loop(
      Animated.sequence([
        // Pause so the user can read the beginning of the title.
        Animated.delay(PAUSE_START_MS),
        // Scroll text fully off the left edge.
        Animated.timing(animValue, {
          toValue: -textWidth,
          duration: scrollDuration,
          useNativeDriver: true,
        }),
        // Jump invisibly to just beyond the right edge.
        Animated.timing(animValue, {
          toValue: containerWidth,
          duration: 0,
          useNativeDriver: true,
        }),
        // Slide in from the right edge back to position 0.
        Animated.timing(animValue, {
          toValue: 0,
          duration: enterDuration,
          useNativeDriver: true,
        }),
      ]),
    );
    animRef.current.start();

    return () => {
      animRef.current?.stop();
    };
  }, [shouldScroll, textWidth, containerWidth, speed, animValue]);

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

      {/* Visible animated text.
          When scrolling, width is pinned to the measured natural width so the
          full text renders on a single line. The container's overflow: 'hidden'
          clips it. numberOfLines is omitted when scrolling to avoid ellipsis. */}
      <Animated.Text
        style={[
          scaledStyle,
          shouldScroll ? { width: textWidth } : styles.centeredText,
          { transform: [{ translateX: animValue }] },
        ]}
        numberOfLines={shouldScroll ? undefined : 1}
      >
        {children}
      </Animated.Text>
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
});
