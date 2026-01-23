import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Vibration,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FlashlightModes } from '../../constants';
import { useTheme } from '../hooks/useTheme';
import { useCoreStore } from '../stores/StoreContext';
import { FOOTER_HEIGHT } from '../theme';
import { Text } from './ScaledText';

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
  const navigation = useNavigation();
  const COLORS = useTheme();
  const [isSOSPressing, setIsSOSPressing] = useState(false);
  const sosTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sosProgressAnim = useRef(new Animated.Value(0)).current;
  const sosAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Determine the active item based on flashlight mode or decibel meter
  const getActiveItem = () => {
    // Decibel meter takes priority if active
    if (core.decibelMeterActive) {
      return {
        icon: 'volume-high-outline',
        label: 'Decibel Meter',
        type: 'decibel',
      };
    }

    const mode = core.flashlightMode;
    if (mode === FlashlightModes.ON) {
      return { icon: 'flashlight-outline', label: 'Flashlight', mode };
    }
    if (mode === FlashlightModes.STROBE) {
      return { icon: 'flash-outline', label: 'Strobe', mode };
    }
    if (mode === FlashlightModes.SOS) {
      return { icon: 'alert-outline', label: 'SOS', mode };
    }
    if (mode === FlashlightModes.NIGHTVISION) {
      return { icon: 'moon-outline', label: 'Nightvision', mode };
    }
    // No active item, show Nightvision as fallback
    return null;
  };

  const activeItem = getActiveItem();

  // Handle active item press (turn off or navigate to nightvision)
  const handleActiveItemPress = () => {
    if (activeItem) {
      // Check if it's the decibel meter (has 'type' property)
      if ('type' in activeItem && activeItem.type === 'decibel') {
        // Turn off the decibel meter
        core.setDecibelMeterActive(false);
      } else {
        // Turn off the active flashlight mode
        core.setFlashlightMode(FlashlightModes.OFF);
      }
    } else {
      // Navigate to Nightvision
      // @ts-ignore - navigation types
      navigation.navigate('Nightvision');
    }
  };

  // Handle SOS long press (1 second)
  const handleSOSPressIn = () => {
    setIsSOSPressing(true);

    // Haptic feedback on press
    Vibration.vibrate(50);

    // Start progress animation
    sosAnimationRef.current = Animated.timing(sosProgressAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    });
    sosAnimationRef.current.start();

    sosTimerRef.current = setTimeout(() => {
      // Trigger SOS with tone enabled
      core.setSosWithTone(true);
      core.setFlashlightMode(FlashlightModes.SOS);
      setIsSOSPressing(false);
      sosProgressAnim.setValue(0);

      // Haptic feedback on activation
      Vibration.vibrate(200);
    }, 1000); // 1 second
  };

  const handleSOSPressOut = () => {
    setIsSOSPressing(false);

    // Stop animation if it's running
    if (sosAnimationRef.current) {
      sosAnimationRef.current.stop();
      sosAnimationRef.current = null;
    }

    sosProgressAnim.setValue(0);
    if (sosTimerRef.current) {
      clearTimeout(sosTimerRef.current);
      sosTimerRef.current = null;
    }
  };

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Stop animation if it's running
      if (sosAnimationRef.current) {
        sosAnimationRef.current.stop();
        sosAnimationRef.current = null;
      }

      sosProgressAnim.setValue(0);
      if (sosTimerRef.current) {
        clearTimeout(sosTimerRef.current);
        sosTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.footer}>
      {/* Left section: Notifications (0%-50%) with fuse timer */}
      <View style={styles.notificationContainer}>
        {/* Fuse timer background (left to right) */}
        {isSOSPressing && (
          <Animated.View
            style={[
              styles.notificationTimerBackground,
              {
                backgroundColor: COLORS.ACCENT,
                borderColor: COLORS.SECONDARY_ACCENT,
              },
              {
                width: sosProgressAnim.interpolate({
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
            <View style={styles.decibelMeterContainer}>
              <View style={styles.decibelMeterBars}>
                {[...Array(10)].map((_, i) => {
                  const barLevel = (i + 1) * 10; // Each bar represents 10 dB
                  const isBarActive = core.currentDecibelLevel >= barLevel;
                  const barColor =
                    barLevel < 40
                      ? COLORS.SUCCESS
                      : barLevel < 70
                        ? COLORS.ACCENT
                        : COLORS.ERROR;
                  const barHeight = ((i + 1) / 10) * 40; // Height scales from 4px to 40px

                  return (
                    <View
                      key={i}
                      style={[
                        styles.decibelBar,
                        {
                          height: barHeight,
                          backgroundColor: isBarActive
                            ? barColor
                            : COLORS.BACKGROUND,
                          borderColor: COLORS.SECONDARY_ACCENT,
                          opacity: isBarActive ? 1 : 0.3,
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <Text
                style={[styles.decibelText, { color: COLORS.PRIMARY_DARK }]}
              >
                {Math.round(core.currentDecibelLevel)} dB
              </Text>
            </View>
          ) : (
            <Text
              style={[styles.notificationText, { color: COLORS.PRIMARY_DARK }]}
            >
              NOTIFICATION
            </Text>
          )}
        </View>
      </View>

      {/* Right middle section: Active item or Nightvision (50%-75%) */}
      <TouchableOpacity
        style={[
          styles.activeItemSection,
          {
            borderColor: COLORS.SECONDARY_ACCENT,
            boxShadow: '0 0 10px ' + COLORS.SECONDARY_ACCENT,
          },
          activeItem && [
            styles.activeItemSectionActive,
            {
              backgroundColor: COLORS.ACCENT,
              borderColor: COLORS.SECONDARY_ACCENT,
              boxShadow: '0 0 10px ' + COLORS.SECONDARY_ACCENT,
            },
          ],
        ]}
        onPress={handleActiveItemPress}
        accessibilityLabel={
          activeItem ? `Turn off ${activeItem.label}` : 'Nightvision'
        }
        accessibilityRole="button"
      >
        <Ionicons
          name={activeItem ? activeItem.icon : 'moon-outline'}
          size={32}
          color={COLORS.PRIMARY_DARK}
        />
      </TouchableOpacity>

      {/* Right section: SOS shortcut (75%-100%) */}
      <TouchableWithoutFeedback
        onPressIn={handleSOSPressIn}
        onPressOut={handleSOSPressOut}
        accessibilityLabel="Emergency SOS - Hold for 3 Seconds to Activate"
        accessibilityRole="button"
      >
        <View
          style={[
            styles.sosSection,
            {
              borderColor: COLORS.SECONDARY_ACCENT,
              boxShadow: '0 0 10px ' + COLORS.SECONDARY_ACCENT,
            },
            isSOSPressing && { backgroundColor: COLORS.ACCENT },
          ]}
        >
          <Ionicons
            name="warning-outline"
            size={32}
            color={isSOSPressing ? COLORS.PRIMARY_LIGHT : COLORS.PRIMARY_DARK}
          />
          <Text
            style={[
              styles.sosText,
              { color: COLORS.PRIMARY_DARK },
              isSOSPressing && { color: COLORS.PRIMARY_LIGHT },
            ]}
          >
            SOS
          </Text>
        </View>
      </TouchableWithoutFeedback>
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
  notificationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeItemSection: {
    width: '25%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 50,
    marginHorizontal: 2,
  },
  activeItemSectionActive: {
    borderRadius: 50,
    borderWidth: 2,
  },
  sosSection: {
    width: '25%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 50,
  },
  sosText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  decibelMeterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  decibelMeterBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 2,
  },
  decibelBar: {
    width: 6,
    borderRadius: 2,
    borderWidth: 1,
    // Height is set dynamically based on bar level
  },
  decibelText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
