/**
 * MapScreen - Native map with GPS location tracking and compass
 * Uses react-native-maps (MapKit on iOS, Google Maps on Android)
 * for zero-config tile rendering with automatic OS-level tile caching.
 * @format
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import CompassHeading from 'react-native-compass-heading';
import Geolocation from 'react-native-geolocation-service';
import MapView from 'react-native-maps';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { useGestureNavigation } from '../../navigation/NavigationHistoryContext';
import { FOOTER_HEIGHT } from '../../theme';
import CompassDataPanel from './components/CompassDataPanel';
import CompassRing from './components/CompassRing';
import MapPanel, {
  DELTA,
  LocationPermissionStatus,
} from './components/MapPanel';

// US state name → 2-letter abbreviation
const US_STATE_ABBR: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
  'District of Columbia': 'DC',
};

/**
 * Reverse geocodes a lat/lng via Nominatim and calls setName with the result.
 * Falls back to county/country, then '--' on any error.
 */
async function fetchLocationName(
  lat: number,
  lng: number,
  setName: (name: string) => void,
): Promise<void> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'TOAST-App/0.1.0 (github.com/jason-shprintz/TOAST)',
        },
      },
    );
    const data = await resp.json();
    const addr = data?.address;
    if (!addr) {
      setName('--');
      return;
    }
    const city = addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? null;
    const state: string | undefined = addr.state;
    const county: string | undefined = addr.county;
    const country: string | undefined = addr.country;
    if (city && state) {
      const abbr = US_STATE_ABBR[state] ?? state;
      setName(`${city}, ${abbr}`);
    } else if (county && country) {
      setName(`${county}, ${country}`);
    } else if (country) {
      setName(country);
    } else {
      setName('--');
    }
  } catch {
    setName('--');
  }
}

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
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    altitude: number | null;
  } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

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

  // Watch GPS position for live coordinates and elevation
  useEffect(() => {
    if (permissionStatus !== 'granted') {
      return;
    }
    // Track last geocoded position to avoid excessive Nominatim requests
    let lastGeocodedLat: number | null = null;
    let lastGeocodedLng: number | null = null;
    const GEOCODE_THRESHOLD = 0.001; // ~100 m in degrees

    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, altitude } = position.coords;
        setCoords({ latitude, longitude, altitude });
        // Only reverse-geocode when position has moved meaningfully
        if (
          lastGeocodedLat === null ||
          lastGeocodedLng === null ||
          Math.abs(latitude - lastGeocodedLat) > GEOCODE_THRESHOLD ||
          Math.abs(longitude - lastGeocodedLng) > GEOCODE_THRESHOLD
        ) {
          lastGeocodedLat = latitude;
          lastGeocodedLng = longitude;
          fetchLocationName(latitude, longitude, setLocationName);
        }
      },
      (err) => {
        console.warn('MapScreen watchPosition error:', err.message);
      },
      { enableHighAccuracy: true, distanceFilter: 5 },
    );
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [permissionStatus]);

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

  return (
    <ScreenBody>
      <SectionHeader>Map</SectionHeader>
      <View style={styles.wrapper}>
        {/* Map */}
        <MapPanel
          permissionStatus={permissionStatus}
          locationReady={locationReady}
          mapRef={mapRef}
          onLocateMe={handleLocateMe}
        />

        {/* Compass */}
        <View style={styles.compassContainer}>
          <CompassRing ringSpin={ringSpin} labelSpin={labelSpin} />
          <CompassDataPanel
            heading={heading}
            coords={coords}
            locationName={locationName}
          />
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
      gap: 5,
    },
    compassContainer: {
      width: '90%',
      height: 140,
      marginBottom: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.SECONDARY_ACCENT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
    },
  });
}
