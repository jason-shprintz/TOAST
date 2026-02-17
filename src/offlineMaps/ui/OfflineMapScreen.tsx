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
import { COLORS } from '../../theme';
import OfflineMapView from './OfflineMapView';
import { useOfflineRegion } from './useOfflineRegion';

/**
 * OfflineMapScreen - Main screen for offline map viewing
 * Handles loading states and delegates to OfflineMapView when ready
 */
export default function OfflineMapScreen() {
  const { region, status, error } = useOfflineRegion();

  const handleMapTap = useCallback((lat: number, lng: number) => {
    // Hook for Issue 12 - tap inspector
    console.log('Map tapped at:', lat, lng);
  }, []);

  const handleRetry = () => {
    // Trigger a reload by remounting the component
    // In a real app, this might navigate away and back
    console.log('Retry requested');
  };

  const handleDownload = () => {
    // Navigate to download screen
    // This will be implemented when navigation is set up
    console.log('Download region requested');
  };

  if (status === 'loading') {
    return (
      <ScreenBody>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.SECONDARY_ACCENT} />
          <Text style={styles.loadingText}>Loading offline region...</Text>
        </View>
      </ScreenBody>
    );
  }

  if (status === 'error') {
    return (
      <ScreenBody>
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Error Loading Region</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRetry}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenBody>
    );
  }

  if (status === 'missing' || !region) {
    return (
      <ScreenBody>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No Offline Region</Text>
          <Text style={styles.emptyMessage}>
            Download an offline region to view maps without internet connection.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleDownload}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Download Offline Region</Text>
          </TouchableOpacity>
        </View>
      </ScreenBody>
    );
  }

  // status === 'ready' and region exists
  return (
    <ScreenBody>
      <OfflineMapView region={region} onTap={handleMapTap} />
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.ERROR,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  button: {
    backgroundColor: COLORS.SECONDARY_ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
});
