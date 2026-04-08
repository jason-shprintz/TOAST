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
   * Called when the overflow state changes so that parents can adjust layout
   * (e.g. remove left padding when the text is scrolling).
   */
  onOverflowChange?: (isOverflowing: boolean) => void;
};

const PAUSE_START_MS = 1500;
const DEFAULT_SPEED_PX_PER_S = 40;

/**
 * Renders text that scrolls horizontally like a ticker when the content is
 * wider than the available container.
 *
 * When the text fits within the container it renders statically, centred.
 * When it overflows it behaves like a stock ticker:
 *   1. Pause at the start so the user can read the beginning of the text.
 *   2. Scroll smoothly to the left until the text exits the left edge.
 *   3. Jump invisibly to the right edge.
 *   4. Slide in from the right back to the start position.
 *   5. Repeat from step 1.
 *
 * Font scaling from SettingsStore is applied automatically (mirrors ScaledText).
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
  const animValue = useRef(new Animated.Value(0)).current;

  // Tracks whether the current loop iteration should continue running.
  const activeRef = useRef(false);
  // The currently running animation, kept so we can stop it on cleanup.
  const runningAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const isOverflowing = containerWidth > 0 && textWidth > containerWidth;

  // Apply font scaling the same way ScaledText does.
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const scaledStyle: TextStyle = {
    ...flatStyle,
    ...(typeof flatStyle.fontSize === 'number'
      ? { fontSize: flatStyle.fontSize * settingsStore.fontScale }
      : {}),
  };

  // Notify parent whenever the overflow state changes.
  const prevOverflowRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevOverflowRef.current !== isOverflowing) {
      prevOverflowRef.current = isOverflowing;
      onOverflowChange?.(isOverflowing);
    }
  }, [isOverflowing, onOverflowChange]);

  useEffect(() => {
    if (!isOverflowing || containerWidth === 0 || textWidth === 0) {
      activeRef.current = false;
      runningAnimRef.current?.stop();
      animValue.setValue(0);
      return;
    }

    activeRef.current = true;
    animValue.setValue(0);

    // Duration to scroll the full text width off the left edge.
    const scrollDuration = Math.round((textWidth / speed) * 1000);
    // Duration to slide in from the right edge to position 0.
    const enterDuration = Math.round((containerWidth / speed) * 1000);

    const runLoop = () => {
      if (!activeRef.current) return;

      // Phase 1 — pause at start, then scroll text fully off the left edge.
      const scrollAnim = Animated.sequence([
        Animated.delay(PAUSE_START_MS),
        Animated.timing(animValue, {
          toValue: -textWidth,
          duration: scrollDuration,
          useNativeDriver: true,
        }),
      ]);
      runningAnimRef.current = scrollAnim;

      scrollAnim.start(({ finished }) => {
        if (!finished || !activeRef.current) return;

        // Instant: place text just off the right edge (not visible to user
        // because the container clips overflow).
        animValue.setValue(containerWidth);

        // Phase 2 — slide in from the right edge back to position 0.
        const enterAnim = Animated.timing(animValue, {
          toValue: 0,
          duration: enterDuration,
          useNativeDriver: true,
        });
        runningAnimRef.current = enterAnim;

        enterAnim.start(({ finished: enterFinished }) => {
          if (!enterFinished || !activeRef.current) return;
          runLoop();
        });
      });
    };

    runLoop();

    return () => {
      activeRef.current = false;
      runningAnimRef.current?.stop();
    };
  }, [isOverflowing, textWidth, containerWidth, speed, animValue]);

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
      {/* Hidden measurement node — absolutely positioned so it is unconstrained
          and always reports the text's natural (unwrapped) width. */}
      <View style={styles.measureContainer}>
        <RNText style={scaledStyle} numberOfLines={1} onLayout={onTextLayout}>
          {children}
        </RNText>
      </View>

      {/* Visible animated text.
          When overflowing, width is set to the measured natural width so the
          full text renders on a single line at its native size (no wrapping,
          no ellipsis). The parent's overflow:hidden provides the visual clip.
          numberOfLines is intentionally omitted when overflowing: setting it to
          1 would cause React Native to truncate with an ellipsis, defeating the
          purpose of the marquee. */}
      <Animated.Text
        style={[
          scaledStyle,
          isOverflowing ? { width: textWidth } : styles.centeredText,
          { transform: [{ translateX: animValue }] },
        ]}
        numberOfLines={isOverflowing ? undefined : 1}
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
  },
  centeredText: {
    textAlign: 'center',
    width: '100%',
  },
});
