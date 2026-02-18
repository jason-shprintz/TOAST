/**
 * DownloadRegionScreenContainer
 * Wrapper for DownloadRegionScreen that provides dependencies
 * @format
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParamListBase } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '../../../components/ScaledText';
import { COLORS } from '../../../theme';
import { createRegionRepository } from '../../db/regionRepository';
import { createDownloadManager } from '../../download/downloadManager';
import { createDownloadStateStore } from '../../download/downloadStateStore';
import { createFileOps } from '../../storage/fileOps';
import { createRegionPaths } from '../../storage/paths';
import { createRegionStorage } from '../../storage/regionStorage';
import DownloadRegionScreen from './DownloadRegionScreen';
import type { PhaseHandlers } from '../../download/downloadTypes';

/**
 * Mock location provider - replace with actual implementation
 */
const getCurrentLocation = async (): Promise<{
  lat: number;
  lng: number;
} | null> => {
  // TODO: Replace with actual geolocation service
  // For now, return a default location (San Francisco)
  return { lat: 37.7749, lng: -122.4194 };
};

/**
 * Create stub phase handlers for now
 * TODO: Wire up actual phase handlers from Issue 6/7/9/10/3
 */
const createStubPhaseHandlers = (): PhaseHandlers => {
  const stubHandler = async () => {
    // Stub implementation - will be replaced with actual handlers
    console.log('Phase handler stub called');
  };

  return {
    estimating: stubHandler,
    tiles: stubHandler,
    dem: stubHandler,
    overlays: stubHandler,
    index: stubHandler,
    finalise: stubHandler,
  };
};

/**
 * Container component that provides dependencies to DownloadRegionScreen
 */
export default function DownloadRegionScreenContainer() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | undefined>();

  // Create dependencies
  const regionRepo = React.useMemo(() => createRegionRepository(), []);
  const fileOps = React.useMemo(() => createFileOps(), []);
  const paths = React.useMemo(() => createRegionPaths(), []);
  const regionStorage = React.useMemo(
    () => createRegionStorage(fileOps, paths),
    [fileOps, paths],
  );
  const stateStore = React.useMemo(
    () => createDownloadStateStore(fileOps, paths.tmpDir),
    [fileOps, paths],
  );
  const handlers = React.useMemo(() => createStubPhaseHandlers(), []);
  const downloadManager = React.useMemo(
    () => createDownloadManager({ store: stateStore, handlers }),
    [stateStore, handlers],
  );

  // Initialize repository on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await regionRepo.init();
        await regionStorage.init();
        setIsInitializing(false);
      } catch (err) {
        setInitError(
          err instanceof Error ? err.message : 'Failed to initialize',
        );
        setIsInitializing(false);
      }
    };

    initialize();
  }, [regionRepo, regionStorage]);

  const handleViewOfflineMap = useCallback(() => {
    navigation.navigate('OfflineMapScreen');
  }, [navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.SECONDARY_ACCENT} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Initialization Error</Text>
        <Text style={styles.errorMessage}>{initError}</Text>
      </View>
    );
  }

  return (
    <DownloadRegionScreen
      regionRepo={regionRepo}
      downloadManager={downloadManager}
      getCurrentLocation={getCurrentLocation}
      onViewOfflineMap={handleViewOfflineMap}
      onBack={handleBack}
      regionStorage={regionStorage}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.ERROR,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    textAlign: 'center',
    maxWidth: 300,
  },
});
