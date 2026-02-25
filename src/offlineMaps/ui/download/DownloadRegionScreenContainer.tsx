/**
 * DownloadRegionScreenContainer
 * Wrapper for DownloadRegionScreen that provides all real dependencies
 * @format
 */

import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '../../../components/ScaledText';
import { COLORS } from '../../../theme';
import { createRegionRepository } from '../../db/regionRepository';
import { createDemPhaseHandler } from '../../dem/demPhaseHandler';
import { OpenElevationDemProvider } from '../../dem/openElevationDemProvider';
import { createDownloadManager } from '../../download/downloadManager';
import { createDownloadStateStore } from '../../download/downloadStateStore';
import { createEstimatingPhaseHandler } from '../../download/estimatingPhaseHandler';
import { createFinalisePhaseHandler } from '../../download/finalisePhaseHandler';
import { computeTileCoverage } from '../../geo/coverage';
import { createIndexPhaseHandler } from '../../geoIndex/indexPhaseHandler';
import { getCurrentLocation } from '../../location/geolocationService';
import { createOverlayPhaseHandler } from '../../overlays/overlayPhaseHandler';
import { OverpassOverlayProvider } from '../../overlays/overpassOverlayProvider';
import {
  parseCityCollection,
  parseRoadCollection,
  parseWaterCollection,
} from '../../schemas';
import { createFileOps } from '../../storage/fileOps';
import { createRegionPaths } from '../../storage/paths';
import { createRegionStorage } from '../../storage/regionStorage';
import { HttpTileFetcher } from '../../tiles/httpTileFetcher';
import { createMbtilesWriter } from '../../tiles/mbtilesWriter';
import { createTilesPhaseHandler } from '../../tiles/tilesPhaseHandler';
import DownloadRegionScreen from './DownloadRegionScreen';
import type { PhaseHandlers } from '../../download/downloadTypes';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/** Tile zoom range for offline downloads */
const TILE_MIN_ZOOM = 0;
const TILE_MAX_ZOOM = 14;

/**
 * Container component that wires all real dependencies into DownloadRegionScreen
 */
export default function DownloadRegionScreenContainer() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | undefined>();

  // Core infrastructure (stable references throughout component lifetime)
  const regionRepo = useMemo(() => createRegionRepository(), []);
  const fileOps = useMemo(() => createFileOps(), []);
  const paths = useMemo(() => createRegionPaths(), []);
  const regionStorage = useMemo(
    () => createRegionStorage(paths, fileOps),
    [fileOps, paths],
  );
  const stateStore = useMemo(
    () => createDownloadStateStore(fileOps, paths.tmpDir),
    [fileOps, paths],
  );

  // Data providers (one instance each for the component lifetime)
  const tileFetcher = useMemo(() => new HttpTileFetcher(), []);
  const demProvider = useMemo(() => new OpenElevationDemProvider(), []);
  const overlayProvider = useMemo(() => new OverpassOverlayProvider(), []);

  // Wire up all real phase handlers
  const handlers = useMemo((): PhaseHandlers => {
    const getRegion = (id: string) => regionRepo.getRegion(id);

    const getTilesToDownload = async (regionId: string) => {
      const region = await regionRepo.getRegion(regionId);
      if (!region) return [];
      const center = { lat: region.centerLat, lng: region.centerLng };
      const coverage = computeTileCoverage(center, region.radiusMiles, {
        minZoom: TILE_MIN_ZOOM,
        maxZoom: TILE_MAX_ZOOM,
      });
      return coverage.tiles;
    };

    return {
      estimating: createEstimatingPhaseHandler({
        paths,
        fileOps,
        getRegion,
        minZoom: TILE_MIN_ZOOM,
        maxZoom: TILE_MAX_ZOOM,
      }),

      tiles: createTilesPhaseHandler({
        paths,
        fileOps,
        fetcher: tileFetcher,
        writerFactory: createMbtilesWriter,
        getRegion,
        getTilesToDownload,
      }),

      dem: createDemPhaseHandler({
        paths,
        fileOps,
        provider: demProvider,
        encoding: 'int16',
        targetResolutionMeters: 1000,
      }),

      overlays: createOverlayPhaseHandler({
        paths,
        fileOps,
        provider: overlayProvider,
        validate: {
          water: parseWaterCollection,
          cities: parseCityCollection,
          roads: parseRoadCollection,
        },
      }),

      index: createIndexPhaseHandler({
        paths,
        fileOps,
      }),

      finalise: createFinalisePhaseHandler({
        paths,
        regionStorage,
        regionRepo,
      }),
    };
  }, [
    regionRepo,
    fileOps,
    paths,
    tileFetcher,
    demProvider,
    overlayProvider,
    regionStorage,
  ]);

  const downloadManager = useMemo(
    () => createDownloadManager({ store: stateStore, handlers }),
    [stateStore, handlers],
  );

  // Initialize the database on mount
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

  if (isInitializing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.SECONDARY_ACCENT} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

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
