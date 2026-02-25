/**
 * MapLibre implementation of MapAdapter
 * Renders offline tiles from MBTiles using the mbtiles:// scheme
 * @format
 */

import {
  Camera,
  FillLayer,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
  SymbolLayer,
} from '@maplibre/maplibre-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  MapAdapter,
  MapMarkerData,
  MapRenderOptions,
  OverlayState,
} from './mapAdapter';
import type { OfflineRegion } from '../../types';
import type { GeoJSON } from 'geojson';

/**
 * Builds a MapLibre style JSON that sources raster tiles from the mbtiles:// scheme.
 * The native interceptor (iOS: MbtilesUrlProtocol, Android: MbtilesModule) translates
 * mbtiles://{encoded-path}/{z}/{x}/{y} requests into SQLite tile-blob lookups.
 */
function buildMapStyle(mbtilesPath: string): string {
  const encoded = encodeURIComponent(mbtilesPath);
  const style = {
    version: 8,
    sources: {
      'offline-tiles': {
        type: 'raster',
        tiles: [`mbtiles://${encoded}/{z}/{x}/{y}`],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 18,
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#f0ede3' },
      },
      {
        id: 'offline-tiles',
        type: 'raster',
        source: 'offline-tiles',
        paint: { 'raster-opacity': 1 },
      },
    ],
  };
  return JSON.stringify(style);
}

export interface MapLibreMapViewProps {
  region: OfflineRegion;
  overlays: OverlayState;
  onTap?: (lat: number, lng: number) => void;
  markers: MapMarkerData[];
  onMarkerPress: (id: string) => void;
}

/**
 * React component that renders the offline map using MapLibre.
 * Uses the mbtiles:// scheme to serve tiles from the local MBTiles SQLite file.
 * Overlay layers (water, cities, roads) are sourced from finalised GeoJSON files.
 */
export function MapLibreMapView({
  region,
  overlays,
  onTap,
  markers,
  onMarkerPress,
}: MapLibreMapViewProps) {
  if (!region.tilesPath) {
    return null;
  }

  const handlePress = (feature: GeoJSON.Feature) => {
    if (!onTap) {
      return;
    }
    const geom = feature?.geometry;
    if (geom?.type === 'Point') {
      const [lng, lat] = (geom as GeoJSON.Point).coordinates;
      onTap(lat, lng);
    }
  };

  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      styleJSON={buildMapStyle(region.tilesPath)}
      onPress={handlePress}
      logoEnabled={false}
      attributionEnabled={false}
    >
      <Camera
        centerCoordinate={[region.centerLng, region.centerLat]}
        zoomLevel={12}
        animationDuration={0}
      />

      {/* Water overlay */}
      {overlays.water && region.waterPath ? (
        <ShapeSource id="water-source" url={`file://${region.waterPath}`}>
          <FillLayer id="water-fill" style={layerStyles.water} />
        </ShapeSource>
      ) : null}

      {/* Cities overlay */}
      {overlays.cities && region.citiesPath ? (
        <ShapeSource id="cities-source" url={`file://${region.citiesPath}`}>
          <SymbolLayer id="cities-label" style={layerStyles.cities} />
        </ShapeSource>
      ) : null}

      {/* Roads overlay (visible when cities overlay is on) */}
      {overlays.cities && region.roadsPath ? (
        <ShapeSource id="roads-source" url={`file://${region.roadsPath}`}>
          <LineLayer id="roads-line" style={layerStyles.roads} />
        </ShapeSource>
      ) : null}

      {/* Markers */}
      {markers.map((marker) => (
        <PointAnnotation
          key={marker.id}
          id={marker.id}
          coordinate={[marker.lng, marker.lat]}
          onSelected={() => onMarkerPress(marker.id)}
          title={marker.title}
        >
          <View style={styles.markerDot} />
        </PointAnnotation>
      ))}
    </MapView>
  );
}

/**
 * MapLibre implementation of MapAdapter.
 *
 * All map state (overlays, markers, tap handler) is driven reactively via React
 * props on MapLibreMapView; the imperative methods below satisfy the MapAdapter
 * interface so that OfflineMapView's existing effect hooks keep working unchanged.
 *
 * Note: setOverlays(), setMarkers(), and setOnTap() are intentional no-ops here
 * because OfflineMapView passes these values directly as props to MapLibreMapView,
 * which re-renders automatically when the React state changes.
 */
export class MapLibreAdapter implements MapAdapter {
  private opts: MapRenderOptions | null = null;

  render(opts: MapRenderOptions): void {
    this.opts = opts;
  }

  /** No-op: overlays are passed as React props to MapLibreMapView. */
  setOverlays(_overlays: OverlayState): void {}

  /** No-op: the tap handler is passed as a React prop to MapLibreMapView. */
  setOnTap(_callback: ((lat: number, lng: number) => void) | undefined): void {}

  /** No-op: markers are passed as React props to MapLibreMapView. */
  setMarkers(_markers: MapMarkerData[], _onPress: (id: string) => void): void {}

  destroy(): void {
    this.opts = null;
  }
}

// MapLibre layer style objects (not React Native styles)
const layerStyles = {
  water: { fillColor: '#4a90d9', fillOpacity: 0.4 },
  cities: {
    textField: ['get', 'name'] as unknown as string,
    textSize: 12,
    textColor: '#333333',
  },
  roads: { lineColor: '#888888', lineWidth: 1 },
};

const styles = StyleSheet.create({
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e74c3c',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
