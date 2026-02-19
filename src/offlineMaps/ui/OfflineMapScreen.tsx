/**
 * Offline Map Screen
 * Entry point for viewing offline maps
 * @format
 */

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import { useTheme } from '../../hooks/useTheme';
import { FOOTER_HEIGHT } from '../../theme';
import { useRegionUpdatePrompt } from '../location/useRegionUpdatePrompt';
import OfflineMapView from './OfflineMapView';
import RegionUpdatePrompt from './RegionUpdatePrompt';
import { useOfflineRegion } from './useOfflineRegion';

/**
 * Mock location provider - replace with actual implementation
 * TODO: Replace with actual geolocation service using react-native-geolocation-service
 * This mock always returns San Francisco, so the region update prompt will not
 * trigger in production until this is replaced with real location access.
 */
const getCurrentLocation = async (): Promise<{
  lat: number;
  lng: number;
} | null> => {
  // TODO: Replace with actual geolocation service
  // For now, return a default location (San Francisco)
  return { lat: 37.7749, lng: -122.4194 };
};

export interface OfflineMapScreenProps {
  /**
   * Optional tap handler for map interactions (e.g., tap inspector).
   * If not provided, taps are logged but not acted upon.
   */
  onTap?: (lat: number, lng: number) => void;
  /**
   * Optional navigation function to download screen
   */
  onNavigateToDownload?: () => void;
}

/**
 * OfflineMapScreen - Main screen for offline map viewing
 * Handles loading states and delegates to OfflineMapView when ready
 */
export default function OfflineMapScreen({
  onTap,
  onNavigateToDownload,
}: OfflineMapScreenProps) {
  const COLORS = useTheme();
  const { region, status, error, reload } = useOfflineRegion();

  // Create dynamic styles using theme colors
  const dynamicStyles = StyleSheet.create({
    loadingText: {
      ...styles.loadingText,
      color: COLORS.PRIMARY_DARK,
    },
    errorTitle: {
      ...styles.errorTitle,
      color: COLORS.ERROR,
    },
    errorMessage: {
      ...styles.errorMessage,
      color: COLORS.PRIMARY_DARK,
    },
    emptyTitle: {
      ...styles.emptyTitle,
      color: COLORS.PRIMARY_DARK,
    },
    emptyMessage: {
      ...styles.emptyMessage,
      color: COLORS.PRIMARY_DARK,
    },
    button: {
      ...styles.button,
      backgroundColor: COLORS.SECONDARY_ACCENT,
    },
    buttonText: {
      ...styles.buttonText,
      color: COLORS.PRIMARY_LIGHT,
    },
  });

  const handleMapTap = useCallback(
    (lat: number, lng: number) => {
      if (onTap) {
        onTap(lat, lng);
      }
    },
    [onTap],
  );

  const handleRetry = () => {
    reload();
  };

  const handleDownload = () => {
    if (onNavigateToDownload) {
      onNavigateToDownload();
    } else {
      console.log('Download region requested - no navigation handler');
    }
  };

  // Hook for region update prompt
  const updatePrompt = useRegionUpdatePrompt(
    {
      region: region ?? null,
      getCurrentLocation,
      thresholdMiles: 50,
      cooldownHours: 24,
    },
    handleDownload,
  );

  if (status === 'loading') {
    return (
      <ScreenBody>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.SECONDARY_ACCENT} />
          <Text style={dynamicStyles.loadingText}>Loading offline region...</Text>
        </View>
      </ScreenBody>
    );
  }

  if (status === 'error') {
    return (
      <ScreenBody>
        <View style={styles.centerContainer}>
          <Text style={dynamicStyles.errorTitle}>Error Loading Region</Text>
          <Text style={dynamicStyles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={dynamicStyles.button}
            onPress={handleRetry}
            activeOpacity={0.7}
          >
            <Text style={dynamicStyles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenBody>
    );
  }

  if (status === 'missing' || !region) {
    return (
      <ScreenBody>
        <View style={styles.centerContainer}>
          <Text style={dynamicStyles.emptyTitle}>No Offline Region</Text>
          <Text style={dynamicStyles.emptyMessage}>
            Download an offline region to view maps without internet connection.
          </Text>
          <TouchableOpacity
            style={dynamicStyles.button}
            onPress={handleDownload}
            activeOpacity={0.7}
          >
            <Text style={dynamicStyles.buttonText}>Download Offline Region</Text>
          </TouchableOpacity>
        </View>
      </ScreenBody>
    );
  }

  // status === 'ready' and region exists
  return (
    <ScreenBody>
      <View style={styles.container}>
        <OfflineMapView region={region} onTap={handleMapTap} />
      </View>
      <RegionUpdatePrompt
        visible={updatePrompt.shouldShow}
        onAccept={updatePrompt.accept}
        onDismiss={updatePrompt.dismiss}
      />
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    paddingBottom: FOOTER_HEIGHT,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
