import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { SOS_SEQUENCE } from './data';
import { createStyles } from './styles';

export { SOS_SEQUENCE };

/**
 * ScreenFlashSOSScreen component
 *
 * Activates a full-screen strobe in the internationally recognised SOS pattern
 * (· · · — — — · · ·) using the device screen as the light source.  This is
 * complementary to the flashlight-based SOS mode and is useful when the torch
 * is unavailable or not visible at distance.
 *
 * Note: production builds should activate a keep-awake mechanism (e.g.
 * react-native-keep-awake) while SOS is running to prevent auto-lock.
 *
 * @returns A React element rendering the Screen Flash SOS screen.
 */
export default function ScreenFlashSOSScreen() {
  const COLORS = useTheme();
  const styles = createStyles(COLORS);
  const [isActive, setIsActive] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(0);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Use a ref so the recursive scheduler always calls the latest version
  // of itself, avoiding stale-closure issues with useCallback.
  const scheduleNextStepRef = useRef<() => void>(() => {});
  scheduleNextStepRef.current = () => {
    const [on, duration] = SOS_SEQUENCE[stepRef.current];
    setFlashOn(on);
    timeoutRef.current = setTimeout(() => {
      stepRef.current = (stepRef.current + 1) % SOS_SEQUENCE.length;
      scheduleNextStepRef.current();
    }, duration);
  };

  useEffect(() => {
    if (isActive) {
      stepRef.current = 0;
      scheduleNextStepRef.current();
    } else {
      clearPendingTimeout();
      setFlashOn(false);
    }
    return clearPendingTimeout;
  }, [isActive, clearPendingTimeout]);

  const toggleSOS = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const flashBgColor = flashOn ? '#FFFFFF' : COLORS.PRIMARY_LIGHT;

  return (
    <ScreenBody>
      <SectionHeader>Screen Flash SOS</SectionHeader>

      {/* Full-screen flash overlay */}
      {isActive && (
        <View
          style={[styles.flashScreen, { backgroundColor: flashBgColor }]}
          pointerEvents="none"
        />
      )}

      <View style={styles.flashContainer}>
        <Text style={styles.sosDescription}>
          Flashes the screen in the international SOS pattern (· · · — — — · ·
          ·). Use in low-light conditions when the torch is unavailable. Point
          the screen toward the sky or rescuers.
        </Text>

        <Text style={styles.patternLabel}>· · · — — — · · ·</Text>

        <TouchableOpacity
          style={[
            styles.activationButton,
            isActive && styles.activationButtonStop,
          ]}
          onPress={toggleSOS}
          accessibilityRole="button"
          accessibilityLabel={isActive ? 'Stop SOS' : 'Start SOS'}
        >
          <Icon
            name={isActive ? 'stop-circle-outline' : 'flash-outline'}
            size={24}
            color={COLORS.PRIMARY_DARK}
          />
          <Text style={styles.activationButtonText}>
            {isActive ? 'Stop SOS' : 'Start SOS'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.warningText}>
          Keep the screen brightness at maximum for best visibility. Screen will
          flash rapidly — avoid looking directly at it.
        </Text>
      </View>
    </ScreenBody>
  );
}
