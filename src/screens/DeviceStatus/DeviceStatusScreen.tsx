import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import SectionHeader from '../../components/SectionHeader';
import ScreenContainer from '../../components/ScreenContainer';
import LogoHeader from '../../components/LogoHeader';
import { COLORS } from '../../theme';
import { useDeviceStatus } from '../../hooks/useDeviceStatus';
import { observer } from 'mobx-react-lite';

function DeviceStatusScreen() {
  const { storageText, batteryText, lastFixText, offlineText } =
    useDeviceStatus();

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Device Status</SectionHeader>

      <View style={styles.card}>
        <Text style={styles.label}>Battery</Text>
        <Text style={styles.value}>{batteryText}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Last GPS Fix</Text>
        <Text style={styles.value}>{lastFixText}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Storage</Text>
        <Text style={styles.value}>{storageText}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Connectivity</Text>
        <Text style={styles.value}>{offlineText}</Text>
      </View>
    </ScreenContainer>
  );
}

export default observer(DeviceStatusScreen);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: COLORS.TOAST_BROWN,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 12,
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
