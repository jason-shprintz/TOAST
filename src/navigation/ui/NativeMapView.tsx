/**
 * NativeMapView - Native map with GPS location tracking
 * Uses react-native-maps (MapKit on iOS, Google Maps on Android)
 * for zero-config tile rendering with automatic OS-level tile caching.
 * @format
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';

type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied';

const DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

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
    // Android
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
 * NativeMapView renders the platform's native map (MapKit on iOS,
 * Google Maps on Android) with a live GPS blue-dot indicator.
 * Previously-viewed tiles are cached automatically by the OS.
 */
export default function NativeMapView() {
  const COLORS = useTheme();
  const mapRef = useRef<MapView>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>('undetermined');
  const [locationReady, setLocationReady] = useState(false);

  useEffect(() => {
    requestLocationPermission().then((status) => {
      setPermissionStatus(status);
      setLocationReady(true);
    });
  }, []);

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
      () => {
        // If location unavailable, do nothing
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  };

  const renderDeniedBanner = () => (
    <View
      style={[
        styles.deniedBanner,
        { backgroundColor: COLORS.ERROR ?? '#c0392b' },
      ]}
    >
      <Text style={[styles.deniedText, { color: COLORS.PRIMARY_LIGHT }]}>
        Location access denied — enable it in Settings to see your position.
      </Text>
    </View>
  );

  return (
    <ScreenBody>
      <SectionHeader>Map</SectionHeader>
      <View style={styles.container}>
        {!locationReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.SECONDARY_ACCENT} />
            <Text style={[styles.loadingText, { color: COLORS.PRIMARY_DARK }]}>
              Requesting location…
            </Text>
          </View>
        ) : (
          <>
            {permissionStatus === 'denied' && renderDeniedBanner()}
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_DEFAULT}
              showsUserLocation={permissionStatus === 'granted'}
              followsUserLocation={permissionStatus === 'granted'}
              showsCompass
              showsScale
              initialRegion={{
                latitude: 37.7749,
                longitude: -122.4194,
                ...DELTA,
              }}
            />
            {permissionStatus === 'granted' && (
              <TouchableOpacity
                style={[
                  styles.locateMeButton,
                  { backgroundColor: COLORS.SECONDARY_ACCENT },
                ]}
                onPress={handleLocateMe}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.locateMeText, { color: COLORS.PRIMARY_LIGHT }]}
                >
                  ⌖
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  deniedBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  deniedText: {
    fontSize: 13,
    textAlign: 'center',
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
  },
  locateMeText: {
    fontSize: 24,
    lineHeight: 28,
  },
});
