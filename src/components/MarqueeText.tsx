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
};

const PAUSE_START_MS = 1500;
const PAUSE_END_MS = 800;
const DEFAULT_SPEED_PX_PER_S = 40;

/**
 * Renders text that scrolls horizontally like a ticker when the content is
 * wider than the available container.
 *
 * When the text fits within the container it renders statically, centred.
 * When it overflows it animates continuously to the left, pauses at the end,
 * snaps back to the start, and loops.
 *
 * Font scaling from SettingsStore is applied automatically (mirrors ScaledText).
 */
const MarqueeText = observer(function MarqueeText({
  children,
  style,
  containerStyle,
  speed = DEFAULT_SPEED_PX_PER_S,
}: Props) {
  const settingsStore = useSettingsStore();
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const animValue = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const isOverflowing = containerWidth > 0 && textWidth > containerWidth;
  const overflow = isOverflowing ? textWidth - containerWidth : 0;

  // Apply font scaling the same way ScaledText does.
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const scaledStyle: TextStyle = {
    ...flatStyle,
    ...(typeof flatStyle.fontSize === 'number'
      ? { fontSize: flatStyle.fontSize * settingsStore.fontScale }
      : {}),
  };

  useEffect(() => {
    if (!isOverflowing) {
      animRef.current?.stop();
      animValue.setValue(0);
      return;
    }

    const duration = Math.round((overflow / speed) * 1000);
    animValue.setValue(0);
    animRef.current?.stop();
    animRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(PAUSE_START_MS),
        Animated.timing(animValue, {
          toValue: -overflow,
          duration,
          useNativeDriver: true,
        }),
        Animated.delay(PAUSE_END_MS),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animRef.current.start();

    return () => {
      animRef.current?.stop();
    };
  }, [isOverflowing, overflow, speed, animValue]);

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
          numberOfLines is intentionally omitted in this case: setting it to 1
          would cause React Native to truncate the text with an ellipsis, which
          defeats the purpose of the marquee. */}
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
