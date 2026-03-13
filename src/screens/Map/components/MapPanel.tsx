import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '../../../hooks/useTheme';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied';

export const DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

type Props = {
  permissionStatus: LocationPermissionStatus;
  locationReady: boolean;
  mapRef: React.RefObject<MapView | null>;
  onLocateMe: () => void;
  onWaypointsPress: () => void;
  /** Called when the user long-presses a point on the map. */
  onLongPressMap?: (coordinate: {
    latitude: number;
    longitude: number;
  }) => void;
};

export default function MapPanel({
  permissionStatus,
  locationReady,
  mapRef,
  onLocateMe,
  onWaypointsPress,
  onLongPressMap,
}: Props) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  return (
    <View style={styles.mapContainer}>
      {!locationReady ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.SECONDARY_ACCENT} />
          <Text style={styles.loadingText}>Requesting location…</Text>
        </View>
      ) : (
        <>
          {permissionStatus === 'denied' && (
            <View style={styles.deniedBanner}>
              <Text style={styles.deniedText}>
                Location access denied — enable it in Settings to see your
                position.
              </Text>
            </View>
          )}
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            showsUserLocation={permissionStatus === 'granted'}
            showsCompass
            showsScale
            onMapReady={permissionStatus === 'granted' ? onLocateMe : undefined}
            onLongPress={(e) =>
              onLongPressMap?.(e.nativeEvent.coordinate)
            }
            initialRegion={{ latitude: 0, longitude: 0, ...DELTA }}
          />
          {permissionStatus === 'granted' && (
            <>
              <TouchableOpacity
                style={styles.waypointsButton}
                onPress={onWaypointsPress}
                activeOpacity={0.8}
                accessibilityLabel="Open waypoints"
                accessibilityRole="button"
              >
                <Text style={styles.waypointsText}>⚑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.locateMeButton}
                onPress={onLocateMe}
                activeOpacity={0.8}
                accessibilityLabel="Center map on my location"
                accessibilityRole="button"
              >
                <Text style={styles.locateMeText}>⌖</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    mapContainer: {
      width: '100%',
      flex: 1,
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
    waypointsButton: {
      position: 'absolute',
      bottom: 24,
      left: 16,
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
    waypointsText: {
      fontSize: 22,
      lineHeight: 26,
      color: colors.PRIMARY_LIGHT,
    },
  });
}
