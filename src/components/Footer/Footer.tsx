import { observer } from 'mobx-react-lite';
import React, { useRef, useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import {
  useAstronomyEventStore,
  useCoreStore,
  useNotificationsStore,
  usePantryStore,
  useSolarCycleNotificationStore,
  useWeatherOutlookStore,
} from '../../stores/StoreContext';
import { FOOTER_HEIGHT } from '../../theme';
import { Text } from '../ScaledText';
import ActiveItemButton from './components/ActiveItemButton';
import DecibelMeterVisualization from './components/DecibelMeterVisualization';
import NotificationsModal from './components/NotificationsModal';
import SolarCycleNotification from './components/SolarCycleNotification';
import SOSTrigger from './components/SOSTrigger';

const FOOTER_BASE_PADDING = 5;

/**
 * Computes the count of currently visible (non-hidden) notifications across
 * all in-app alert sources.  Used to drive the badge on the footer.
 */
function useVisibleNotificationCount(): number {
  const solarStore = useSolarCycleNotificationStore();
  const weatherOutlook = useWeatherOutlookStore();
  const pantry = usePantryStore();
  const astronomyStore = useAstronomyEventStore();
  const notificationsStore = useNotificationsStore();

  let count = 0;

  // Solar events
  for (const n of solarStore.activeNotifications) {
    if (!n.dismissed && !notificationsStore.isHidden(`solar-${n.id}`)) {
      count++;
    }
  }

  // Lunar phase (shown when all solar events are done)
  if (
    solarStore.allSolarEventsComplete() &&
    !notificationsStore.isHidden('lunar-phase')
  ) {
    count++;
  }

  // Weather outlook
  if (
    weatherOutlook.getCurrentMonthSummary() &&
    !notificationsStore.isHidden('weather-monthly-outlook')
  ) {
    count++;
  }

  // Next astronomy event
  const nextAstro = astronomyStore.getNextAstronomyEvent();
  if (nextAstro && !notificationsStore.isHidden(`astro-${nextAstro.id}`)) {
    count++;
  }

  // Pantry expiration alerts
  for (const alert of pantry.getExpirationAlerts()) {
    const key = `pantry-${alert.item.id}-${alert.alertType}`;
    if (!notificationsStore.isHidden(key)) {
      count++;
    }
  }

  return count;
}

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
  const { bottom } = useSafeAreaInsets();
  const [isSOSPressing, setIsSOSPressing] = useState(false);
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] =
    useState(false);
  const sosProgressAnimRef = useRef<Animated.Value | null>(null);
  const visibleNotificationCount = useVisibleNotificationCount();

  // Callbacks for SOSTrigger component
  const handleSOSPressingChange = useCallback((isPressing: boolean) => {
    setIsSOSPressing(isPressing);
  }, []);

  const handleProgressAnimRef = useCallback((anim: Animated.Value) => {
    sosProgressAnimRef.current = anim;
  }, []);

  return (
    <>
      <View
        style={[styles.footer, { paddingBottom: bottom + FOOTER_BASE_PADDING }]}
      >
        {/* Left section: Notifications (0%-50%) with fuse timer */}
        <TouchableOpacity
          style={styles.notificationContainer}
          onPress={() => setIsNotificationsModalVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel={
            visibleNotificationCount > 0
              ? `${visibleNotificationCount} notification${visibleNotificationCount !== 1 ? 's' : ''}. Tap to view.`
              : 'No notifications. Tap to view.'
          }
          accessibilityRole="button"
        >
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

          {/* Badge showing count of active notifications */}
          {visibleNotificationCount > 0 && (
            <View style={[styles.badge, { backgroundColor: COLORS.ACCENT }]}>
              <Text style={styles.badgeText}>
                {visibleNotificationCount > 99
                  ? '99+'
                  : String(visibleNotificationCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Right middle section: Active item or Nightvision (50%-75%) */}
        <ActiveItemButton />

        {/* Right section: SOS shortcut (75%-100%) */}
        <SOSTrigger
          onPressingChange={handleSOSPressingChange}
          onProgressAnimRef={handleProgressAnimRef}
        />
      </View>

      <NotificationsModal
        visible={isNotificationsModalVisible}
        onClose={() => setIsNotificationsModalVisible(false)}
      />
    </>
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
    padding: FOOTER_BASE_PADDING,
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
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 14,
  },
});
