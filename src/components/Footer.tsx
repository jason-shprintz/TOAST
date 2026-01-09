import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FlashlightModes } from '../../constants';
import { useCoreStore } from '../stores/StoreContext';
import { COLORS, FOOTER_HEIGHT } from '../theme';
import { Text } from './ScaledText';

/**
 * Footer component that displays notifications, active item shortcuts, and SOS trigger.
 *
 * Layout:
 * - Left 50% (0%-50%): In-app notifications placeholder
 * - Right middle (50%-75%): Active item shortcut (flashlight mode) or Nightvision fallback
 * - Right side (75%-100%): SOS shortcut (triggers on 3-second hold)
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
  const [isSOSPressing, setIsSOSPressing] = useState(false);
  const sosTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sosProgressAnim = useRef(new Animated.Value(0)).current;

  // Determine the active item based on flashlight mode
  const getActiveItem = () => {
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
      // Turn off the active mode
      core.setFlashlightMode(FlashlightModes.OFF);
    } else {
      // Navigate to Nightvision
      // @ts-ignore - navigation types
      navigation.navigate('Nightvision');
    }
  };

  // Handle SOS long press (3 seconds)
  const handleSOSPressIn = () => {
    setIsSOSPressing(true);
    
    // Start progress animation
    Animated.timing(sosProgressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();
    
    sosTimerRef.current = setTimeout(() => {
      // Trigger SOS with tone enabled
      core.setSosWithTone(true);
      core.setFlashlightMode(FlashlightModes.SOS);
      setIsSOSPressing(false);
      sosProgressAnim.setValue(0);
    }, 3000); // 3 seconds
  };

  const handleSOSPressOut = () => {
    setIsSOSPressing(false);
    sosProgressAnim.setValue(0);
    if (sosTimerRef.current) {
      clearTimeout(sosTimerRef.current);
      sosTimerRef.current = null;
    }
  };

  return (
    <View style={styles.footer}>
      {/* Left section: Notifications (0%-50%) */}
      <View style={styles.notificationSection}>
        <Text style={styles.notificationText}>NOTIFICATION</Text>
      </View>

      {/* Right middle section: Active item or Nightvision (50%-75%) */}
      <TouchableOpacity
        style={[
          styles.activeItemSection,
          activeItem && styles.activeItemSectionActive,
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
        accessibilityLabel="Emergency SOS - Hold for 3 seconds"
        accessibilityRole="button"
      >
        <View style={styles.sosContainer}>
          {/* Fuse timer background */}
          {isSOSPressing && (
            <Animated.View
              style={[
                styles.sosTimerBackground,
                {
                  height: sosProgressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          )}
          
          {/* SOS content */}
          <View
            style={[
              styles.sosSection,
              isSOSPressing && styles.sosSectionPressing,
            ]}
          >
            <Ionicons
              name="warning-outline"
              size={32}
              color={isSOSPressing ? COLORS.PRIMARY_LIGHT : COLORS.PRIMARY_DARK}
            />
            <Text
              style={[styles.sosText, isSOSPressing && styles.sosTextPressing]}
            >
              SOS
            </Text>
          </View>
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
    backgroundColor: COLORS.BACKGROUND,
    borderTopWidth: 2,
    borderTopColor: COLORS.PRIMARY_DARK,
  },
  notificationSection: {
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
  },
  activeItemSection: {
    width: '25%',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.PRIMARY_DARK,
  },
  activeItemSectionActive: {
    backgroundColor: COLORS.ACCENT,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    margin: 4,
    borderLeftWidth: 2,
    borderRightWidth: 2,
  },
  sosContainer: {
    width: '25%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  sosTimerBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.SECONDARY_ACCENT,
  },
  sosSection: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosSectionPressing: {
    backgroundColor: 'transparent',
  },
  sosText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
    marginTop: 4,
  },
  sosTextPressing: {
    color: COLORS.PRIMARY_LIGHT,
  },
});
