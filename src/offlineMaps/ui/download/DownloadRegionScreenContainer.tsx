/**
 * DownloadRegionScreenContainer
 * Wrapper for DownloadRegionScreen that provides dependencies
 * @format
 */

import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { createRegionRepository } from '../../db/regionRepository';
import { createDownloadManager } from '../../download/downloadManager';
import { createDownloadStateStore } from '../../download/downloadStateStore';
import { createFileOps } from '../../storage/fileOps';
import { createRegionPaths } from '../../storage/paths';
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
  const navigation = useNavigation<any>();

  // Create dependencies
  const regionRepo = React.useMemo(() => createRegionRepository(), []);
  const fileOps = React.useMemo(() => createFileOps(), []);
  const paths = React.useMemo(() => createRegionPaths(), []);
  const stateStore = React.useMemo(
    () => createDownloadStateStore(fileOps, paths.tmpDir),
    [fileOps, paths],
  );
  const handlers = React.useMemo(() => createStubPhaseHandlers(), []);
  const downloadManager = React.useMemo(
    () => createDownloadManager({ store: stateStore, handlers }),
    [stateStore, handlers],
  );

  const handleViewOfflineMap = useCallback(() => {
    navigation.navigate('OfflineMapScreen');
  }, [navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <DownloadRegionScreen
      regionRepo={regionRepo}
      downloadManager={downloadManager}
      getCurrentLocation={getCurrentLocation}
      onViewOfflineMap={handleViewOfflineMap}
      onBack={handleBack}
    />
  );
}
