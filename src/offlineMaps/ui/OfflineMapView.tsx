/**
 * Offline Map View component
 * Renders the map using local MBTiles and manages overlay state
 * @format
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/ScaledText';
import { COLORS } from '../../theme';
import { createMapAdapter } from './mapAdapters/stubMapAdapter';
import OverlayToggles from './OverlayToggles';
import type { OfflineRegion } from '../types';
import type { MapAdapter, OverlayState } from './mapAdapters/mapAdapter';

interface OfflineMapViewProps {
  region: OfflineRegion;
  onTap?: (lat: number, lng: number) => void;
}

/**
 * OfflineMapView - Renders the offline map with overlay controls
 * Owns overlay toggle state and integrates with map adapter
 */
export default function OfflineMapView({ region, onTap }: OfflineMapViewProps) {
  const [overlays, setOverlays] = useState<OverlayState>({
    water: true,
    cities: true,
    terrain: false,
  });

  const mapAdapterRef = useRef<MapAdapter | null>(null);
  const containerRef = useRef<View>(null) as React.RefObject<View>;

  // Initialize map adapter
  useEffect(() => {
    if (!region.tilesPath) {
      return;
    }

    const adapter = createMapAdapter();
    mapAdapterRef.current = adapter;

    // Render map with current state
    // Note: onTap is captured at mount time; if it needs to change dynamically,
    // parent should memoize it with useCallback
    adapter.render({
      containerRef: containerRef,
      mbtilesPath: region.tilesPath,
      onTap,
      overlays,
    });

    return () => {
      adapter.destroy();
      mapAdapterRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region.tilesPath]); // Only re-init if tilesPath changes

  // Update overlays when they change
  useEffect(() => {
    if (mapAdapterRef.current) {
      mapAdapterRef.current.setOverlays(overlays);
    }
  }, [overlays]);

  const handleToggle = (key: keyof OverlayState, value: boolean) => {
    setOverlays((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer} ref={containerRef}>
        {/* Placeholder for actual map - will be rendered by adapter */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>Offline Map View</Text>
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
        </View>
      </View>

      <OverlayToggles overlays={overlays} onToggle={handleToggle} />
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
});
