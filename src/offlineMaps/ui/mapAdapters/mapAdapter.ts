/**
 * Map adapter interface
 * Abstracts map SDK implementation to allow switching providers
 * @format
 */

import type { RefObject } from 'react';
import type { View } from 'react-native';

export interface OverlayState {
  water: boolean;
  cities: boolean;
  terrain: boolean;
}

export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  title?: string;
}

export interface MapRenderOptions {
  containerRef: RefObject<View> | null;
  mbtilesPath: string;
  onTap?: (lat: number, lng: number) => void;
  overlays: OverlayState;
}

/**
 * Interface for map SDK adapters
 * Implement this for specific map providers (MapLibre, Mapbox, etc.)
 */
export interface MapAdapter {
  /**
   * Mount the map with local tile source
   */
  render(opts: MapRenderOptions): void;

  /**
   * Update overlay visibility
   */
  setOverlays(overlays: OverlayState): void;

  /**
   * Update the tap callback handler
   */
  setOnTap(callback: ((lat: number, lng: number) => void) | undefined): void;

  /**
   * Set markers on the map
   */
  setMarkers(markers: MapMarkerData[], onPress: (id: string) => void): void;

  /**
   * Clean up map resources
   */
  destroy(): void;
}
