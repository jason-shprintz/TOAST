import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import SectionHeader from '../../components/SectionHeader';
import ScreenContainer from '../../components/ScreenContainer';
import LogoHeader from '../../components/LogoHeader';
import DeviceInfo from 'react-native-device-info';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { COLORS } from '../../theme';
import dayjs from 'dayjs';

type BatteryEstimate = {
  minutesLeft: number | null;
};

function formatBytes(bytes: number) {
  if (!bytes || bytes < 0) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let b = bytes;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  return `${b.toFixed(1)} ${units[i]}`;
}

function formatPercent(used: number, total: number) {
  if (!total || total <= 0) return '-';
  return `${Math.round((used / total) * 100)}%`;
}

export default function DeviceStatusScreen() {
  // Battery
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const lastSample = useRef<{ level: number; at: number } | null>(null);
  const [estimate, setEstimate] = useState<BatteryEstimate>({
    minutesLeft: null,
  });
  const estimateRef = useRef<BatteryEstimate>({ minutesLeft: null });
  const quickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slowIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quickSamplingDeadlineRef = useRef<number | null>(null);

  // Storage
  const [totalDisk, setTotalDisk] = useState<number | null>(null);
  const [freeDisk, setFreeDisk] = useState<number | null>(null);

  // Connectivity
  const [netInfo, setNetInfo] = useState<NetInfoState | null>(null);

  // GPS
  const [lastFix, setLastFix] = useState<GeoPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Initial battery & power state + sampling cadence (quick then slow)
  useEffect(() => {
    const sampleBattery = async () => {
      try {
        const level = await DeviceInfo.getBatteryLevel();
        const power = await DeviceInfo.getPowerState();
        setBatteryLevel(level);
        const charging =
          power.batteryState === 'charging' ||
          power.batteryState === 'full' ||
          power.charging === true;
        setIsCharging(charging);

        if (lastSample.current) {
          const now = Date.now();
          const dtMin = (now - lastSample.current.at) / 60000; // minutes
          const dLevel = lastSample.current.level - level; // drop as positive
          if (dtMin > 0 && dLevel > 0) {
            const ratePerMin = dLevel / dtMin; // fraction per minute
            if (ratePerMin > 0) {
              const minutesLeft = level / ratePerMin;
              const next = { minutesLeft } as BatteryEstimate;
              estimateRef.current = next;
              setEstimate(next);
            }
          }
        }
        lastSample.current = { level, at: Date.now() };
      } catch {
        // noop
      }
    };

    // Kick off with an immediate sample
    sampleBattery();

    // Quick sampling for ~3 minutes or until we get an estimate
    quickSamplingDeadlineRef.current = Date.now() + 3 * 60 * 1000;
    quickIntervalRef.current = setInterval(async () => {
      await sampleBattery();
      const hasEstimate = estimateRef.current.minutesLeft != null;
      const expired =
        quickSamplingDeadlineRef.current != null &&
        Date.now() >= quickSamplingDeadlineRef.current;
      if (hasEstimate || expired) {
        if (!hasEstimate && batteryLevel != null) {
          // Fallback baseline: assume ~8 hours typical usage at 100%
          const baselineMinutes = Math.round(batteryLevel * 480);
          const next = { minutesLeft: baselineMinutes } as BatteryEstimate;
          estimateRef.current = next;
          setEstimate(next);
        }
        if (quickIntervalRef.current) clearInterval(quickIntervalRef.current);
        quickIntervalRef.current = null;
        if (!slowIntervalRef.current) {
          slowIntervalRef.current = setInterval(sampleBattery, 60000);
        }
      }
    }, 15000);

    return () => {
      if (quickIntervalRef.current) clearInterval(quickIntervalRef.current);
      if (slowIntervalRef.current) clearInterval(slowIntervalRef.current);
      quickIntervalRef.current = null;
      slowIntervalRef.current = null;
    };
  }, [batteryLevel]);

  // Storage
  useEffect(() => {
    (async () => {
      try {
        const [total, free] = await Promise.all([
          DeviceInfo.getTotalDiskCapacity(),
          DeviceInfo.getFreeDiskStorage(),
        ]);
        setTotalDisk(total ?? null);
        setFreeDisk(free ?? null);
      } catch {}
    })();
  }, []);

  // Network state
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => setNetInfo(state));
    return () => unsub();
  }, []);

  // Last GPS fix
  useEffect(() => {
    Geolocation.requestAuthorization('whenInUse')
      .then(result => {
        if (result === 'granted') {
          Geolocation.getCurrentPosition(
            pos => {
              setLastFix(pos);
              setLocationError(null);
            },
            err => setLocationError(err.message),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
          );
        } else {
          setLocationError('Location permission not granted');
        }
      })
      .catch(() => setLocationError('Location permission error'));
  }, []);

  // const usedDisk = useMemo(() => {
  //   if (totalDisk == null || freeDisk == null) return null;
  //   return totalDisk - freeDisk;
  // }, [totalDisk, freeDisk]);

  const storageText = useMemo(() => {
    if (totalDisk == null || freeDisk == null) return 'Unknown';
    const used = totalDisk - freeDisk;
    return `${formatBytes(used)} / ${formatBytes(totalDisk)} (${formatPercent(
      used,
      totalDisk,
    )})`;
  }, [totalDisk, freeDisk]);

  const batteryText = useMemo(() => {
    if (batteryLevel == null) return 'Unknown';
    const pct = Math.round(batteryLevel * 100);
    const minutes = estimate.minutesLeft;

    const estimateStr = (() => {
      if (minutes == null) return 'Calculating…';
      const hrs = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      const hWord = hrs === 1 ? 'hour' : 'hours';
      const mWord = mins === 1 ? 'minute' : 'minutes';
      return `${hrs} ${hWord} ${mins} ${mWord} remaining`;
    })();

    if (isCharging) return `${pct}% (Charging — ${estimateStr})`;
    return `${pct}% (${estimateStr})`;
  }, [batteryLevel, estimate, isCharging]);

  const lastFixText = useMemo(() => {
    if (lastFix?.timestamp) {
      const when = dayjs(lastFix.timestamp).format('YYYY-MM-DD HH:mm:ss');
      const { latitude, longitude } = lastFix.coords;
      return `${when}\n${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }
    return locationError ? `Error: ${locationError}` : 'No fix yet';
  }, [lastFix, locationError]);

  const offlineText = useMemo(() => {
    if (!netInfo) return 'Unknown';
    return netInfo.isConnected ? 'Online' : 'Offline';
  }, [netInfo]);

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Device Status</SectionHeader>

      <View style={styles.card}>
        <Text style={styles.label}>Battery</Text>
        <Text style={styles.value}>{batteryText}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Storage</Text>
        <Text style={styles.value}>{storageText}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Last GPS Fix</Text>
        <Text style={styles.value}>{lastFixText}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Connectivity</Text>
        <Text style={styles.value}>{offlineText}</Text>
      </View>
    </ScreenContainer>
  );
}

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
