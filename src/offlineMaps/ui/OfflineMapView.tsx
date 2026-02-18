/**
 * Offline Map View component
 * Renders the map using local MBTiles and manages overlay state
 * @format
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../components/ScaledText';
import { COLORS } from '../../theme';
import QuickActionsBar from './actions/QuickActionsBar';
import { useQuickActions } from './actions/useQuickActions';
import TapInspectorSheet from './inspector/TapInspectorSheet';
import { useTapInspector } from './inspector/useTapInspector';
import { createMapAdapter } from './mapAdapters/stubMapAdapter';
import MapMarkers from './markers/MapMarkers';
import OverlayToggles from './OverlayToggles';
import type { OfflineRegion } from '../types';
import type { MapAdapter, OverlayState } from './mapAdapters/mapAdapter';
import type { GeoIndex } from '../geoIndex/geoIndexTypes';
import type { TerrainService } from '../terrain/terrainService';

interface OfflineMapViewProps {
  region: OfflineRegion;
  onTap?: (lat: number, lng: number) => void;
  geoIndex?: GeoIndex | null;
  terrain?: TerrainService | null;
}

/**
 * OfflineMapView - Renders the offline map with overlay controls
 * Owns overlay toggle state and integrates with map adapter
 */
export default function OfflineMapView({
  region,
  onTap,
  geoIndex = null,
  terrain = null,
}: OfflineMapViewProps) {
  const [overlays, setOverlays] = useState<OverlayState>({
    water: true,
    cities: true,
    terrain: false,
  });

  const mapAdapterRef = useRef<MapAdapter | null>(null);
  const containerRef = useRef<View>(null) as React.RefObject<View>;

  // Initialize tap inspector
  const inspector = useTapInspector({ geoIndex, terrain });
  const { openAt } = inspector;

  // Initialize quick actions
  const quickActions = useQuickActions({
    geoIndex,
    terrain,
    getUserLocation: async () => {
      // Return map center as fallback for now
      // In a real app, this would use react-native-geolocation-service
      return { lat: region.centerLat, lng: region.centerLng };
    },
    getMapCenter: () => {
      return { lat: region.centerLat, lng: region.centerLng };
    },
  });

  // Handle map tap - trigger inspector
  // Memoize to avoid effect re-runs
  const handleMapTap = React.useCallback(
    (lat: number, lng: number) => {
      openAt(lat, lng);
      // Also call provided onTap callback if present
      if (onTap) {
        onTap(lat, lng);
      }
    },
    [openAt, onTap],
  );

  // Initialize map adapter
  useEffect(() => {
    if (!region.tilesPath) {
      return;
    }

    const adapter = createMapAdapter();
    mapAdapterRef.current = adapter;

    // Render map with current state
    adapter.render({
      containerRef: containerRef,
      mbtilesPath: region.tilesPath,
      onTap: handleMapTap,
      overlays,
    });

    return () => {
      adapter.destroy();
      mapAdapterRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region.tilesPath]); // Only re-init if tilesPath changes

  // Update onTap callback when it changes
  useEffect(() => {
    if (mapAdapterRef.current) {
      mapAdapterRef.current.setOnTap(handleMapTap);
    }
  }, [handleMapTap]);

  // Update overlays when they change
  useEffect(() => {
    if (mapAdapterRef.current) {
      mapAdapterRef.current.setOverlays(overlays);
    }
  }, [overlays]);

  // Update markers when they change
  useEffect(() => {
    if (mapAdapterRef.current) {
      const markerData = quickActions.markers.map((m) => ({
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        title: m.title,
      }));
      mapAdapterRef.current.setMarkers(markerData, quickActions.onMarkerPress);
    }
  }, [quickActions.markers, quickActions.onMarkerPress]);

  const handleToggle = (key: keyof OverlayState, value: boolean) => {
    setOverlays((prev) => ({ ...prev, [key]: value }));
  };

  // Demo function to simulate a map tap (for testing since stub adapter doesn't have real map)
  const handleTestTap = () => {
    // Simulate tapping at the region center
    handleMapTap(region.centerLat, region.centerLng);
  };

  return (
    <View style={styles.container}>
      {/* Quick Actions Bar */}
      <QuickActionsBar
        onFindNearestWater={quickActions.findNearestWater}
        onFindHighestElevation={quickActions.findHighestElevation}
        isRunning={quickActions.isRunning}
        error={quickActions.error}
      />

      <View style={styles.mapContainer} ref={containerRef}>
        {/* Placeholder view showing region info. 
            The stub adapter doesn't render actual tiles yet.
            Replace StubMapAdapter with a real map SDK implementation 
            (MapLibre/Mapbox) to render vector tiles from MBTiles. */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>Offline Map View</Text>
          <Text style={styles.placeholderSubtext}>
            (Stub adapter - awaiting map SDK integration)
          </Text>
          <Text style={styles.infoText}>
            Region: {region.centerLat.toFixed(4)}, {region.centerLng.toFixed(4)}
          </Text>
          <Text style={styles.infoText}>
            Radius: {region.radiusMiles} miles
          </Text>
          <Text style={styles.infoText}>Tiles: {region.tilesPath}</Text>
          <Text style={styles.overlayInfo}>
            Overlays: Water={overlays.water ? 'ON' : 'OFF'}, Cities=
            {overlays.cities ? 'ON' : 'OFF'}, Terrain=
            {overlays.terrain ? 'ON' : 'OFF'}
          </Text>

          {/* Demo button to test tap inspector */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestTap}
            activeOpacity={0.7}
          >
            <Text style={styles.testButtonText}>Tap to Test Inspector</Text>
          </TouchableOpacity>
        </View>

        {/* Markers overlay */}
        <MapMarkers
          markers={quickActions.markers}
          selectedMarker={quickActions.selectedMarker}
          onMarkerPress={quickActions.onMarkerPress}
          onCloseDetails={() => quickActions.onMarkerPress('')}
        />
      </View>

      <OverlayToggles overlays={overlays} onToggle={handleToggle} />

      {/* Tap Inspector Sheet */}
      <TapInspectorSheet inspector={inspector} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  overlayInfo: {
    fontSize: 10,
    color: '#666',
    marginTop: 8,
  },
  testButton: {
    marginTop: 16,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  testButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 14,
    fontWeight: '600',
  },
});
