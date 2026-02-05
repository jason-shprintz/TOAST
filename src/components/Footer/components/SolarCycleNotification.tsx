import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../hooks/useTheme';
import { SolarEventType } from '../../../stores/SolarCycleNotificationStore';
import {
  useCoreStore,
  useSolarCycleNotificationStore,
} from '../../../stores/StoreContext';
import { Text } from '../../ScaledText';

/**
 * SolarCycleNotification component displays the next upcoming
 * sunrise or sunset notification with time remaining.
 *
 * @remarks
 * - Shows an icon indicating sunrise (sun) or sunset (moon)
 * - Displays a dynamic message with time remaining until the event
 * - Falls back to "NO NOTIFICATIONS" when no upcoming events
 * - Automatically updates notifications when device location changes
 * - Refreshes display every minute to update time remaining
 *
 * @returns A React element rendering the solar cycle notification
 */
const SolarCycleNotification = () => {
  const core = useCoreStore();
  const solarNotifications = useSolarCycleNotificationStore();
  const COLORS = useTheme();

  // Update solar cycle notifications when location changes
  useEffect(() => {
    if (core.lastFix) {
      const { latitude, longitude } = core.lastFix.coords;
      solarNotifications.updateNotifications(latitude, longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [core.lastFix]);

  // Refresh notification display every minute to update time remaining
  useEffect(() => {
    const interval = setInterval(() => {
      // Update the observable currentTime in the store to trigger re-renders
      solarNotifications.updateCurrentTime();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [solarNotifications]);

  const nextNotification = solarNotifications.getNextNotification();

  // Check if all solar events are complete - if so, show lunar cycle
  if (!nextNotification && solarNotifications.allSolarEventsComplete()) {
    const lunarCycle = solarNotifications.getCurrentLunarCycle();

    return (
      <View style={styles.notificationContent}>
        <Ionicons
          name="moon"
          size={20}
          color={COLORS.ACCENT}
          style={styles.notificationIcon}
        />
        <Text
          style={[styles.notificationText, { color: COLORS.PRIMARY_DARK }]}
          numberOfLines={1}
        >
          {`${lunarCycle.phaseName} (${lunarCycle.illumination}%)`}
        </Text>
      </View>
    );
  }

  if (!nextNotification) {
    return (
      <Text style={[styles.notificationText, { color: COLORS.PRIMARY_DARK }]}>
        NO NOTIFICATIONS
      </Text>
    );
  }

  // Map event types to icon names
  const iconMap: Record<SolarEventType, string> = {
    sunrise: 'sunny-outline',
    sunset: 'moon-outline',
    dawn: 'partly-sunny-outline',
    dusk: 'moon',
  };

  return (
    <View style={styles.notificationContent}>
      <Ionicons
        name={iconMap[nextNotification.eventType] || 'sunny-outline'}
        size={20}
        color={COLORS.ACCENT}
        style={styles.notificationIcon}
      />
      <Text
        style={[styles.notificationText, { color: COLORS.PRIMARY_DARK }]}
        numberOfLines={1}
      >
        {solarNotifications.getNotificationMessage(nextNotification)}
      </Text>
    </View>
  );
};

export default observer(SolarCycleNotification);

const styles = StyleSheet.create({
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  notificationIcon: {
    flexShrink: 0,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
});
