import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../hooks/useTheme';
import { SolarEventType } from '../../../stores/SolarCycleNotificationStore';
import {
  useCoreStore,
  usePantryStore,
  useSolarCycleNotificationStore,
  useWeatherOutlookStore,
} from '../../../stores/StoreContext';
import { Text } from '../../ScaledText';

/**
 * SolarCycleNotification component displays the next upcoming
 * sunrise or sunset notification with time remaining.
 *
 * @remarks
 * - Shows an icon indicating sunrise (sun) or sunset (moon)
 * - Displays a dynamic message with time remaining until the event
 * - Falls back to lunar cycle when all solar events are complete
 * - After solar and lunar info, rotates to weather outlook summary when available
 * - Falls back to "NO NOTIFICATIONS" when no upcoming events or data
 * - Automatically updates notifications when device location changes
 * - Refreshes display every minute to update time remaining
 *
 * @returns A React element rendering the solar cycle notification
 */
const SolarCycleNotification = () => {
  const core = useCoreStore();
  const solarNotifications = useSolarCycleNotificationStore();
  const weatherOutlook = useWeatherOutlookStore();
  const pantry = usePantryStore();
  const COLORS = useTheme();

  /**
   * Rotation index cycles through available notification types once all
   * solar events are complete:
   *   0 = lunar
   *   1 = weather (when available)
   *   2+ = pantry expiration alerts (one per alerting item, when available)
   */
  const [rotationIndex, setRotationIndex] = useState(0);

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

  // Rotate through post-solar notification types every 8 seconds
  useEffect(() => {
    const weatherSummary = weatherOutlook.getCurrentMonthSummary();
    const pantryAlerts = pantry.getExpirationAlerts();
    // slots: 0 = lunar, 1 = weather (if available), 2..N = pantry alerts
    const maxIndex = (weatherSummary ? 1 : 0) + pantryAlerts.length;
    if (maxIndex === 0) return; // Nothing to rotate through

    const interval = setInterval(() => {
      setRotationIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 8000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherOutlook.outlook, weatherOutlook, pantry.items]);

  const nextNotification = solarNotifications.getNextNotification();

  // Check if all solar events are complete — show rotation of lunar / weather / pantry
  if (!nextNotification && solarNotifications.allSolarEventsComplete()) {
    const weatherSummary = weatherOutlook.getCurrentMonthSummary();
    const pantryAlerts = pantry.getExpirationAlerts();

    // Slot 1 = weather summary (only if available)
    if (rotationIndex === 1 && weatherSummary) {
      return (
        <View style={styles.notificationContent}>
          <Ionicons
            name="partly-sunny-outline"
            size={20}
            color={COLORS.ACCENT}
            style={styles.notificationIcon}
          />
          <Text
            style={[styles.notificationText, { color: COLORS.PRIMARY_DARK }]}
            numberOfLines={2}
          >
            {weatherSummary}
          </Text>
        </View>
      );
    }

    // Slots 2..N = pantry expiration alerts (offset by weather slot when present)
    const pantryOffset = weatherSummary ? 2 : 1;
    const pantryAlertIndex = rotationIndex - pantryOffset;
    if (pantryAlertIndex >= 0 && pantryAlertIndex < pantryAlerts.length) {
      const alert = pantryAlerts[pantryAlertIndex];
      const alertMessages: Record<string, string> = {
        expired: `Must use today: ${alert.item.name} has expired`,
        '3day': `Action needed: ${alert.item.name} expires in 3 days`,
        '30day': `Heads up: ${alert.item.name} expires in 30 days`,
      };
      return (
        <View style={styles.notificationContent}>
          <Ionicons
            name="nutrition-outline"
            size={20}
            color={
              alert.alertType === 'expired' || alert.alertType === '3day'
                ? '#d32f2f'
                : '#f9a825'
            }
            style={styles.notificationIcon}
          />
          <Text
            style={[styles.notificationText, { color: COLORS.PRIMARY_DARK }]}
            numberOfLines={2}
          >
            {alertMessages[alert.alertType]}
          </Text>
        </View>
      );
    }

    // Slot 0 = lunar cycle (default)
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
          numberOfLines={2}
        >
          {`${lunarCycle.phaseName} (${lunarCycle.illumination}%)`}
        </Text>
      </View>
    );
  }

  if (!nextNotification) {
    // No upcoming solar events — still show pantry alerts when present
    const pantryAlerts = pantry.getExpirationAlerts();
    if (pantryAlerts.length > 0) {
      const alertIndex =
        rotationIndex < pantryAlerts.length ? rotationIndex : 0;
      const alert = pantryAlerts[alertIndex];
      const alertMessages: Record<string, string> = {
        expired: `Must use today: ${alert.item.name} has expired`,
        '3day': `Action needed: ${alert.item.name} expires in 3 days`,
        '30day': `Heads up: ${alert.item.name} expires in 30 days`,
      };
      return (
        <View style={styles.notificationContent}>
          <Ionicons
            name="nutrition-outline"
            size={20}
            color={
              alert.alertType === 'expired' || alert.alertType === '3day'
                ? '#d32f2f'
                : '#f9a825'
            }
            style={styles.notificationIcon}
          />
          <Text
            style={[styles.notificationText, { color: COLORS.PRIMARY_DARK }]}
            numberOfLines={2}
          >
            {alertMessages[alert.alertType]}
          </Text>
        </View>
      );
    }

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
        numberOfLines={2}
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
