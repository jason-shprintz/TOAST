import { observer } from 'mobx-react-lite';
import React, { useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useCoreStore } from '../../stores/StoreContext';
import { FOOTER_HEIGHT } from '../../theme';
import ActiveItemButton from './components/ActiveItemButton';
import DecibelMeterVisualization from './components/DecibelMeterVisualization';
import SolarCycleNotification from './components/SolarCycleNotification';
import SOSTrigger from './components/SOSTrigger';

/**
 * Footer component that displays notifications, active item shortcuts, and SOS trigger.
 *
 * Layout:
 * - Left 50% (0%-50%): In-app notifications placeholder
 * - Right middle (50%-75%): Active item shortcut (flashlight mode) or Nightvision fallback
 * - Right side (75%-100%): SOS shortcut (triggers on 1-second hold)
 *
 * @remarks
 * The footer provides quick access to:
 * - Currently active flashlight modes (strobe, SOS, etc.)
 * - Emergency SOS activation with sound
 * - Nightvision toggle when no active item
 *
 * @returns A React element rendering the footer with three sections.
 */
const FooterImpl = () => {
  const core = useCoreStore();
  const COLORS = useTheme();
  const [isSOSPressing, setIsSOSPressing] = useState(false);
  const sosProgressAnimRef = useRef<Animated.Value | null>(null);

  // Callbacks for SOSTrigger component
  const handleSOSPressingChange = useCallback((isPressing: boolean) => {
    setIsSOSPressing(isPressing);
  }, []);

  const handleProgressAnimRef = useCallback((anim: Animated.Value) => {
    sosProgressAnimRef.current = anim;
  }, []);

  return (
    <View style={styles.footer}>
      {/* Left section: Notifications (0%-50%) with fuse timer */}
      <View style={styles.notificationContainer}>
        {/* Fuse timer background (left to right) */}
        {isSOSPressing && sosProgressAnimRef.current && (
          <Animated.View
            style={[
              styles.notificationTimerBackground,
              {
                backgroundColor: COLORS.ACCENT,
                borderColor: COLORS.SECONDARY_ACCENT,
              },
              {
                width: sosProgressAnimRef.current.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        )}

        {/* Notification content */}
        <View style={styles.notificationSection}>
          {core.decibelMeterActive ? (
            // Decibel meter visualization
            <DecibelMeterVisualization />
          ) : (
            // Solar cycle notification (handles empty state internally)
            <SolarCycleNotification />
          )}
        </View>
      </View>

      {/* Right middle section: Active item or Nightvision (50%-75%) */}
      <ActiveItemButton />

      {/* Right section: SOS shortcut (75%-100%) */}
      <SOSTrigger
        onPressingChange={handleSOSPressingChange}
        onProgressAnimRef={handleProgressAnimRef}
      />
    </View>
  );
};

export default observer(FooterImpl);

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: FOOTER_HEIGHT,
    flexDirection: 'row',
    padding: 5,
  },
  notificationContainer: {
    width: '50%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  notificationTimerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 4,
  },
  notificationSection: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginHorizontal: 2,
  },
});
