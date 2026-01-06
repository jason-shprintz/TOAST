import { observer } from 'mobx-react-lite';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { Text } from '../../components/ScaledText';
import { useDeviceStatus } from '../../hooks/useDeviceStatus';
import { COLORS } from '../../theme';

/**
 * DeviceStatusScreen
 *
 * Displays a summary of the device’s current health/status metrics in a simple
 * card-based UI.
 *
 * The screen renders:
 * - Battery status text
 * - Time/description of the last GPS fix
 * - Storage usage/availability
 * - Connectivity/offline status
 *
 * Data is sourced from {@link useDeviceStatus}, which provides pre-formatted
 * strings for display. Each metric is presented in a styled card with a shared
 * gradient background and consistent label/value typography.
 *
 * @returns A React element containing the Device Status screen UI.
 */
function DeviceStatusScreen() {
  const { storageText, batteryText, lastFixText, offlineText } =
    useDeviceStatus();

  return (
    <ScreenBody>
      <SectionHeader>Device Status</SectionHeader>
      <View style={styles.card}>
        <LinearGradient
          colors={COLORS.TOAST_BROWN_GRADIENT}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardBackground}
        />
        <Text style={styles.label}>Battery</Text>
        <Text style={styles.value}>{batteryText}</Text>
      </View>

      <View style={styles.card}>
        <LinearGradient
          colors={COLORS.TOAST_BROWN_GRADIENT}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardBackground}
        />
        <Text style={styles.label}>Last GPS Fix</Text>
        <Text style={styles.value}>{lastFixText}</Text>
      </View>

      <View style={styles.card}>
        <LinearGradient
          colors={COLORS.TOAST_BROWN_GRADIENT}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardBackground}
        />
        <Text style={styles.label}>Storage</Text>
        <Text style={styles.value}>{storageText}</Text>
      </View>

      <View style={styles.card}>
        <LinearGradient
          colors={COLORS.TOAST_BROWN_GRADIENT}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardBackground}
        />
        <Text style={styles.label}>Connectivity</Text>
        <Text style={styles.value}>{offlineText}</Text>
      </View>
    </ScreenBody>
  );
}

export default observer(DeviceStatusScreen);

const styles = StyleSheet.create({
  card: {
    width: '90%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
  },
  cardBackground: {
    ...StyleSheet.absoluteFill,
  },
  label: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.9,
    marginBottom: 6,
    fontWeight: '700',
  },
  value: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
  },
});
