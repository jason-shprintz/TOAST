import React, { PropsWithChildren, useMemo, useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
  Easing,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useKeyboardStatus } from '../hooks/useKeyboardStatus';
import { useNavigationHistory } from '../navigation/NavigationHistoryContext';
import canGoBack, { goBack } from '../navigation/navigationRef';
import { COLORS, FOOTER_HEIGHT } from '../theme';
import { HorizontalRule } from './HorizontalRule';
import LogoHeader from './LogoHeader';
import ScreenContainer from './ScreenContainer';

type Props = PropsWithChildren;

/**
 * Root layout wrapper for the app.
 *
 * Provides:
 * - A consistent shell layout with a persistent header (settings button + logo) and a content area.
 * - Global horizontal swipe navigation using a `PanResponder` attached to the outer container:
 *   - Right swipe triggers {@link goBack} when {@link canGoBack} is true.
 *   - Left swipe triggers `goForward` when forward navigation is available.
 *
 * Gesture behavior:
 * - Attempts to avoid interfering with vertical scrolling and taps by requiring a minimum horizontal
 *   movement and favoring horizontal intent over vertical (bias check against `dy`).
 * - On release, triggers navigation only on "confident" swipes using distance (`dx`), velocity (`vx`),
 *   and vertical displacement (`dy`) thresholds.
 *
 * @remarks
 * The settings button is currently a no-op and exists as a persistent UI affordance.
 *
 * @param props - Component props.
 * @param props.children - Screen content to render inside the shell.
 * @returns The composed app shell containing the header, content, and gesture handlers.
 */
export default function AppShell({ children }: Props) {
  const navigationHistory = useNavigationHistory();
  const { isKeyboardVisible, keyboardHeight } = useKeyboardStatus();
  const translateYRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateYRef, {
      toValue: isKeyboardVisible ? -keyboardHeight : 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [isKeyboardVisible, keyboardHeight, translateYRef]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
          // Capture a clear right-swipe anywhere in the shell.
          // Avoid interfering with vertical scrolling/taps.
          const { dx, dy } = gestureState;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          const wantsBack = dx > 0;
          const wantsForward = dx < 0;

          if (wantsBack && !canGoBack()) return false;
          if (wantsForward && !navigationHistory.canGoForward()) return false;
          if (!wantsBack && !wantsForward) return false;

          // Make it easier to start the gesture, but still bias against vertical scroll.
          if (absDx < 6) return false;
          if (absDx < absDy * 0.9) return false;
          return true;
        },
        onPanResponderRelease: (_evt, gestureState) => {
          const { dx, dy, vx } = gestureState;
          const absDy = Math.abs(dy);

          // Trigger back/forward on a confident horizontal swipe.
          if (dx > 35 && absDy < 60) {
            goBack();
            return;
          }
          if (dx > 25 && vx > 0.25 && absDy < 80) {
            goBack();
            return;
          }

          if (dx < -35 && absDy < 60) {
            navigationHistory.goForward();
            return;
          }
          if (dx < -25 && vx < -0.25 && absDy < 80) {
            navigationHistory.goForward();
          }
        },
      }),
    [navigationHistory],
  );

  return (
    <ScreenContainer>
      <View style={styles.gestureContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[styles.shell, { transform: [{ translateY: translateYRef }] }]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                // Intentionally a no-op for now; this is just a persistent button.
              }}
              accessibilityLabel="Settings"
              accessibilityRole="button"
            >
              <Ionicons
                name="settings-outline"
                size={26}
                color={COLORS.PRIMARY_DARK}
              />
            </TouchableOpacity>

            <LogoHeader />
          </View>

          <View style={styles.content}>{children}</View>
        </Animated.View>

        <View style={styles.bottomRule}>
          <HorizontalRule />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  gestureContainer: {
    flex: 1,
    width: '100%',
  },
  shell: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 0,
    alignItems: 'stretch',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 30,
    zIndex: 10,
    padding: 6,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: 2,
    alignItems: 'stretch',
  },
  bottomRule: {
    position: 'absolute',
    bottom: FOOTER_HEIGHT,
    width: '90%',
    left: '5%',
  },
});
