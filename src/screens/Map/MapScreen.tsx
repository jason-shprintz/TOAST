/**
 * MapScreen - Native map with GPS location tracking and compass
 * Uses react-native-maps (MapKit on iOS, Google Maps on Android)
 * for zero-config tile rendering with automatic OS-level tile caching.
 * @format
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CompassHeading from 'react-native-compass-heading';
import Geolocation from 'react-native-geolocation-service';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { useGestureNavigation } from '../../navigation/NavigationHistoryContext';
import { FOOTER_HEIGHT } from '../../theme';

type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied';

const DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

// Cardinal labels and their degree positions around the ring
const CARDINALS = [
  { label: 'N', deg: 0 },
  { label: 'NE', deg: 45 },
  { label: 'E', deg: 90 },
  { label: 'SE', deg: 135 },
  { label: 'S', deg: 180 },
  { label: 'SW', deg: 225 },
  { label: 'W', deg: 270 },
  { label: 'NW', deg: 315 },
];

// 24 ticks every 15°; major ticks coincide with the 8 cardinals
const TICKS = Array.from({ length: 24 }, (_, i) => {
  const deg = i * 15;
  return { deg, isMajor: deg % 45 === 0 };
});

/**
 * Requests location permission on the current platform.
 * Returns 'granted' | 'denied'.
 */
async function requestLocationPermission(): Promise<'granted' | 'denied'> {
  try {
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('whenInUse');
      return status === 'granted' ? 'granted' : 'denied';
    }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message:
          'TOAST needs your location to center the map on your current position.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * MapScreen renders the platform's native map (MapKit on iOS,
 * Google Maps on Android) with a live GPS blue-dot and a
 * CLLocationManager-driven compass below the map.
 */
export default function MapScreen() {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { setDisableGestureNavigation } = useGestureNavigation();
  const mapRef = useRef<MapView>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>('undetermined');
  const [locationReady, setLocationReady] = useState(false);
  const [heading, setHeading] = useState(0);
  const needleRotation = useRef(new Animated.Value(0)).current;
  const lastHeading = useRef(0);

  // Disable swipe-back while map is active (conflicts with map panning)
  useEffect(() => {
    setDisableGestureNavigation(true);
    return () => setDisableGestureNavigation(false);
  }, [setDisableGestureNavigation]);

  // Request location permission
  useEffect(() => {
    requestLocationPermission().then((status) => {
      setPermissionStatus(status);
      setLocationReady(true);
    });
  }, []);

  // Subscribe to CLLocationManager heading (tilt-compensated, same as native compass)
  useEffect(() => {
    type HeadingData = { heading: number; accuracy: number };
    // Degree threshold before a heading update is fired (1° = smooth)
    CompassHeading.start(1, ({ heading: newHeading }: HeadingData) => {
      // Always take the shortest arc to avoid spinning past 360°
      let delta = newHeading - lastHeading.current;
      if (delta > 180) {
        delta -= 360;
      }
      if (delta < -180) {
        delta += 360;
      }
      const smoothed = lastHeading.current + delta;
      lastHeading.current = smoothed;

      setHeading(Math.round(newHeading));
      Animated.spring(needleRotation, {
        toValue: smoothed,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }).start();
    });
    return () => CompassHeading.stop();
  }, [needleRotation]);

  const handleLocateMe = () => {
    if (!mapRef.current || permissionStatus === 'denied') {
      return;
    }
    Geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.animateToRegion(
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            ...DELTA,
          },
          300,
        );
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  };

  // Ring rotates opposite to heading so the needle appears fixed pointing up
  const ringSpin = needleRotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '-360deg'],
  });
  // Counter-rotation keeps each cardinal label upright as the ring spins
  const labelSpin = needleRotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const renderDeniedBanner = () => (
    <View style={styles.deniedBanner}>
      <Text style={styles.deniedText}>
        Location access denied — enable it in Settings to see your position.
      </Text>
    </View>
  );

  return (
    <ScreenBody>
      <SectionHeader>Map</SectionHeader>
      <View style={styles.wrapper}>
        {/* Map */}
        <View style={styles.mapContainer}>
          {!locationReady ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.SECONDARY_ACCENT} />
              <Text style={styles.loadingText}>Requesting location…</Text>
            </View>
          ) : (
            <>
              {permissionStatus === 'denied' && renderDeniedBanner()}
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                showsUserLocation={permissionStatus === 'granted'}
                showsCompass
                showsScale
                onMapReady={
                  permissionStatus === 'granted' ? handleLocateMe : undefined
                }
                initialRegion={{
                  latitude: 0,
                  longitude: 0,
                  ...DELTA,
                }}
              />
              {permissionStatus === 'granted' && (
                <TouchableOpacity
                  style={styles.locateMeButton}
                  onPress={handleLocateMe}
                  activeOpacity={0.8}
                  accessibilityLabel="Center map on my location"
                  accessibilityRole="button"
                >
                  <Text style={styles.locateMeText}>⌖</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Compass */}
        <View style={styles.compassContainer}>
          {/* Compass ring with fixed cardinal labels */}
          <View style={styles.compassRing}>
            {/* Rotating ring — cardinals spin opposite to heading */}
            <Animated.View
              style={[
                styles.cardinalRing,
                { transform: [{ rotate: ringSpin }] },
              ]}
            >
              {TICKS.map(({ deg, isMajor }) => {
                const rad = (deg * Math.PI) / 180;
                const r = isMajor ? 49 : 50.5;
                const tx = Math.sin(rad) * r;
                const ty = -Math.cos(rad) * r;
                const hw = isMajor ? 1 : 0.75; // half-width
                const hh = isMajor ? 4 : 2.5; // half-height
                return (
                  <View
                    key={`tick-${deg}`}
                    style={[
                      isMajor ? styles.tickMajor : styles.tickMinor,
                      {
                        transform: [
                          { translateX: tx - hw },
                          { translateY: ty - hh },
                          { rotate: `${deg}deg` },
                        ],
                      },
                    ]}
                  />
                );
              })}
              {CARDINALS.map(({ label, deg }) => {
                const rad = (deg * Math.PI) / 180;
                const radius = 38;
                const x = Math.sin(rad) * radius;
                const y = -Math.cos(rad) * radius;
                const isNorth = label === 'N';
                return (
                  <Animated.Text
                    key={label}
                    style={[
                      isNorth
                        ? styles.cardinalLabelNorth
                        : styles.cardinalLabel,
                      {
                        transform: [
                          { translateX: x - 7 },
                          { translateY: y - 8 },
                          { rotate: labelSpin },
                        ],
                      },
                    ]}
                  >
                    {label}
                  </Animated.Text>
                );
              })}
            </Animated.View>

            {/* Fixed needle — always points up */}
            <View style={styles.needleWrapper}>
              <View style={styles.needleNorth} />
              <View style={styles.needleSouth} />
            </View>

            {/* Center pivot dot */}
            <View style={styles.pivot} />
          </View>

          {/* Numeric heading readout */}
          <Text style={styles.headingText}>{heading}°</Text>
        </View>
      </View>
    </ScreenBody>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      paddingBottom: FOOTER_HEIGHT,
      gap: 16,
    },
    // ─── Map ─────────────────────────────────────────────────────────────────
    mapContainer: {
      width: '90%',
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.SECONDARY_ACCENT,
      overflow: 'hidden',
    },
    map: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: colors.PRIMARY_DARK,
    },
    deniedBanner: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.ERROR,
    },
    deniedText: {
      fontSize: 13,
      textAlign: 'center',
      color: colors.PRIMARY_LIGHT,
    },
    locateMeButton: {
      position: 'absolute',
      bottom: 24,
      right: 16,
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      backgroundColor: colors.SECONDARY_ACCENT,
    },
    locateMeText: {
      fontSize: 24,
      lineHeight: 28,
      color: colors.PRIMARY_LIGHT,
    },
    // ─── Compass ─────────────────────────────────────────────────────────────
    compassContainer: {
      width: '90%',
      height: 140,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.SECONDARY_ACCENT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      paddingHorizontal: 24,
    },
    compassRing: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 2,
      borderColor: colors.SECONDARY_ACCENT,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    cardinalRing: {
      position: 'absolute',
      width: 110,
      height: 110,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tickMajor: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 2,
      height: 8,
      borderRadius: 1,
      backgroundColor: colors.SECONDARY_ACCENT,
    },
    tickMinor: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 1.5,
      height: 5,
      borderRadius: 1,
      backgroundColor: colors.PRIMARY_DARK,
      opacity: 0.4,
    },
    cardinalLabel: {
      position: 'absolute',
      fontSize: 11,
      top: '50%',
      left: '50%',
      color: colors.PRIMARY_DARK,
      fontWeight: '400',
    },
    cardinalLabelNorth: {
      position: 'absolute',
      fontSize: 11,
      top: '50%',
      left: '50%',
      color: colors.ERROR,
      fontWeight: '700',
    },
    needleWrapper: {
      width: 6,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    needleNorth: {
      width: 6,
      height: 24,
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
      backgroundColor: colors.ERROR,
    },
    needleSouth: {
      width: 6,
      height: 24,
      borderBottomLeftRadius: 3,
      borderBottomRightRadius: 3,
      backgroundColor: colors.PRIMARY_DARK,
      opacity: 0.35,
    },
    pivot: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.SECONDARY_ACCENT,
    },
    headingText: {
      fontSize: 28,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
      minWidth: 70,
      textAlign: 'center',
      color: colors.PRIMARY_DARK,
    },
  });
}
