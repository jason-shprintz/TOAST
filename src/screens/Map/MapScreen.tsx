/**
 * MapScreen - Native map with GPS location tracking and compass
 * Uses react-native-maps (MapKit on iOS, Google Maps on Android)
 * for zero-config tile rendering with automatic OS-level tile caching.
 * @format
 */

import { observer } from 'mobx-react-lite';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { useTrackStore, useWaypointStore } from '../../stores/StoreContext';
import { TrackPoint } from '../../stores/TrackStore';
import { FOOTER_HEIGHT } from '../../theme';
import CompassDataPanel from './components/CompassDataPanel';
import CompassRing from './components/CompassRing';
import MapPanel, {
  DELTA,
  LocationPermissionStatus,
  RecordingState,
} from './components/MapPanel';
import WaypointBottomSheet from './components/WaypointBottomSheet';
import { haversineMeters } from './components/WaypointBottomSheet/waypointGeometry';
import { Track } from '../../stores/TrackStore';

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

const NOMINATIM_USER_AGENT =
  'TOAST Survival App (toastbyte.studio, support@toastbyte.studio)';

/**
 * Reverse geocodes a lat/lng via Nominatim and calls setName with the result.
 * Falls back to county/country, then '--' on any error.
 * Pass an AbortSignal to cancel an in-flight request (e.g. on unmount or new position).
 */
async function fetchLocationName(
  lat: number,
  lng: number,
  setName: (name: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        signal,
        headers: {
          'Accept-Language': 'en',
          'User-Agent': NOMINATIM_USER_AGENT,
        },
      },
    );
    if (!resp.ok) {
      setName('--');
      return;
    }
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
  } catch (err: unknown) {
    // Ignore AbortError — request was intentionally cancelled
    if (err instanceof Error && err.name === 'AbortError') {
      return;
    }
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

/** Computes total haversine distance (metres) across an array of TrackPoints. */
function computeTrackDistance(points: TrackPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude,
    );
  }
  return total;
}

/**
 * MapScreen renders the platform's native map (MapKit on iOS,
 * Google Maps on Android) with a live GPS blue-dot and a
 * CLLocationManager-driven compass below the map.
 */

/** Duration in ms for map region animation. */
const MAP_ANIMATE_DURATION_MS = 400;
/** Number of GPS points between polyline state updates during recording (performance optimisation). */
const POLYLINE_UPDATE_INTERVAL = 3;

export default observer(function MapScreen() {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { setDisableGestureNavigation } = useGestureNavigation();
  const mapRef = useRef<MapView>(null);
  const waypointStore = useWaypointStore();
  const trackStore = useTrackStore();
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
  // Holds the AbortController for the in-flight Nominatim request
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const [waypointSheetOpen, setWaypointSheetOpen] = useState(false);
  // Measured height of the map container — used to keep the sheet within map bounds.
  const [mapContainerHeight, setMapContainerHeight] = useState(0);

  // ── Recording state ────────────────────────────────────────────────────────
  /** Mutable ref so GPS callback closure always reads the latest value. */
  const recordingStateRef = useRef<RecordingState>('idle');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const recordedPointsRef = useRef<TrackPoint[]>([]);
  const [recordingPolylineCoords, setRecordingPolylineCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const recordingStartTimeRef = useRef<number | null>(null);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [recordingDistance, setRecordingDistance] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** The currently viewed saved track overlay (read-only polyline). */
  const [viewedTrack, setViewedTrack] = useState<Track | null>(null);
  // ──────────────────────────────────────────────────────────────────────────

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

  // Watch GPS position for live coordinates, elevation, geocoding, and recording
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
          // Abort any in-flight geocode request before starting a new one
          geocodeAbortRef.current?.abort();
          geocodeAbortRef.current = new AbortController();
          fetchLocationName(
            latitude,
            longitude,
            setLocationName,
            geocodeAbortRef.current.signal,
          );
        }

        // Append point to recording if active
        if (recordingStateRef.current === 'recording') {
          const point: TrackPoint = {
            latitude,
            longitude,
            altitude: altitude ?? null,
            timestamp: Date.now(),
          };
          recordedPointsRef.current.push(point);
          const pts = recordedPointsRef.current;
          // Batch polyline updates to avoid excessive re-renders
          if (pts.length % POLYLINE_UPDATE_INTERVAL === 0 || pts.length === 1) {
            setRecordingPolylineCoords(
              pts.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
            );
            setRecordingDistance(computeTrackDistance(pts));
          }
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
      // Cancel any in-flight geocode request on unmount
      geocodeAbortRef.current?.abort();
      geocodeAbortRef.current = null;
    };
  }, [permissionStatus]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
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
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  };

  const handleAddWaypointFromLocation = useCallback(
    async (name: string) => {
      if (!coords) {
        return;
      }
      await waypointStore.addWaypoint(name, coords.latitude, coords.longitude);
    },
    [coords, waypointStore],
  );

  const handleAddWaypointManual = useCallback(
    async (name: string, latitude: number, longitude: number) => {
      await waypointStore.addWaypoint(name, latitude, longitude);
    },
    [waypointStore],
  );

  const handleNavigateWaypoint = useCallback(
    (id: string) => {
      waypointStore.setActiveWaypoint(id);
      setWaypointSheetOpen(false);
      // Pan the map to centre on the selected waypoint
      const waypoint = waypointStore.waypoints.find((w) => w.id === id);
      if (waypoint && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: waypoint.latitude,
            longitude: waypoint.longitude,
            ...DELTA,
          },
          MAP_ANIMATE_DURATION_MS,
        );
      }
    },
    [waypointStore],
  );

  const handleDeleteWaypoint = useCallback(
    async (id: string) => {
      await waypointStore.deleteWaypoint(id);
    },
    [waypointStore],
  );

  const handleLongPressMap = useCallback(
    async (coordinate: { latitude: number; longitude: number }) => {
      // Find the next unused "Waypoint N" number (handles gaps from deletions)
      const existing = new Set(waypointStore.waypoints.map((w) => w.name));
      let n = waypointStore.waypoints.length + 1;
      while (existing.has(`Waypoint ${n}`)) {
        n++;
      }
      await waypointStore.addWaypoint(
        `Waypoint ${n}`,
        coordinate.latitude,
        coordinate.longitude,
      );
      setWaypointSheetOpen(true);
    },
    [waypointStore],
  );

  // ── Recording handlers ────────────────────────────────────────────────────

  const handleRecordPress = useCallback(() => {
    if (recordingStateRef.current === 'idle') {
      // Start recording
      recordedPointsRef.current = [];
      recordingStartTimeRef.current = Date.now();
      recordingStateRef.current = 'recording';
      setRecordingState('recording');
      setRecordingElapsed(0);
      setRecordingDistance(0);
      setRecordingPolylineCoords([]);
      recordingTimerRef.current = setInterval(() => {
        if (recordingStartTimeRef.current !== null) {
          setRecordingElapsed(
            Math.floor((Date.now() - recordingStartTimeRef.current) / 1000),
          );
        }
      }, 1000);
    } else if (recordingStateRef.current === 'recording') {
      // Stop recording — transition to 'stopped' to show Save/Discard UI
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      recordingStateRef.current = 'stopped';
      setRecordingState('stopped');
      // Final polyline update
      const pts = recordedPointsRef.current;
      setRecordingPolylineCoords(
        pts.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
      );
      setRecordingDistance(computeTrackDistance(pts));
    }
  }, []);

  const handleSaveTrack = useCallback(
    async (name: string) => {
      const pts = recordedPointsRef.current;
      const elapsed = recordingElapsed;
      const dist = computeTrackDistance(pts);
      const savedTrack = await trackStore.saveTrack(name, elapsed, dist, pts);
      // Reset recording state
      recordingStateRef.current = 'idle';
      setRecordingState('idle');
      setRecordingPolylineCoords([]);
      setRecordingElapsed(0);
      setRecordingDistance(0);
      recordedPointsRef.current = [];
      // Show the newly saved track on the map
      setViewedTrack(savedTrack);
    },
    [trackStore, recordingElapsed],
  );

  const handleDiscardTrack = useCallback(() => {
    recordingStateRef.current = 'idle';
    setRecordingState('idle');
    setRecordingPolylineCoords([]);
    setRecordingElapsed(0);
    setRecordingDistance(0);
    recordedPointsRef.current = [];
  }, []);

  const handleViewTrack = useCallback(
    (track: Track) => {
      setViewedTrack(track);
      setWaypointSheetOpen(false);
      // Pan map to first point of track
      if (track.points.length > 0 && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: track.points[0].latitude,
            longitude: track.points[0].longitude,
            ...DELTA,
          },
          MAP_ANIMATE_DURATION_MS,
        );
      }
    },
    [],
  );

  const handleDeleteTrack = useCallback(
    async (id: string) => {
      await trackStore.deleteTrack(id);
      if (viewedTrack?.id === id) {
        setViewedTrack(null);
      }
    },
    [trackStore, viewedTrack],
  );

  // ─────────────────────────────────────────────────────────────────────────

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

  const viewedTrackCoords = viewedTrack
    ? viewedTrack.points.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
      }))
    : [];

  return (
    <ScreenBody>
      <SectionHeader>Map</SectionHeader>
      <View style={styles.wrapper}>
        {/* Map — outer view owns sizing/sheet; inner view clips map tiles to rounded corners */}
        <View
          style={styles.mapWrapper}
          onLayout={(e) => setMapContainerHeight(e.nativeEvent.layout.height)}
        >
          <View style={styles.mapInner}>
            <MapPanel
              permissionStatus={permissionStatus}
              locationReady={locationReady}
              mapRef={mapRef}
              onLocateMe={handleLocateMe}
              onWaypointsPress={() => setWaypointSheetOpen(true)}
              onLongPressMap={handleLongPressMap}
              waypoints={waypointStore.waypoints}
              activeWaypointId={waypointStore.activeWaypointId}
              recordingState={recordingState}
              onRecordPress={handleRecordPress}
              recordingPolylineCoords={recordingPolylineCoords}
              viewedTrackCoords={viewedTrackCoords}
              recordingElapsed={recordingElapsed}
              recordingDistance={recordingDistance}
              onSaveTrack={handleSaveTrack}
              onDiscardTrack={handleDiscardTrack}
            />
          </View>
          {/* Waypoint bottom sheet — positioned absolutely within the map area */}
          <WaypointBottomSheet
            waypoints={waypointStore.waypoints}
            tracks={trackStore.tracks}
            currentCoords={coords}
            isOpen={waypointSheetOpen}
            onClose={() => setWaypointSheetOpen(false)}
            onNavigate={handleNavigateWaypoint}
            onDelete={handleDeleteWaypoint}
            onAddFromLocation={handleAddWaypointFromLocation}
            onAddManual={handleAddWaypointManual}
            containerHeight={mapContainerHeight}
            activeWaypointId={null}
            onDismissActive={() => {}}
            onViewTrack={handleViewTrack}
            onDeleteTrack={handleDeleteTrack}
          />
        </View>

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
});

function makeStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      paddingBottom: FOOTER_HEIGHT,
      gap: 5,
    },
    mapWrapper: {
      width: '90%',
      flex: 1,
      marginTop: 5,
      overflow: 'hidden',
    },
    mapInner: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.SECONDARY_ACCENT,
      overflow: 'hidden',
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
