/**
 * Map adapter interface
 * Abstracts map SDK implementation to allow switching providers
 * @format
 */

export interface OverlayState {
  water: boolean;
  cities: boolean;
  terrain: boolean;
}

export interface MapRenderOptions {
  containerRef: any; // Platform-specific container reference
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
   * Set map center position
   */
  setCenter(lat: number, lng: number): void;

  /**
   * Update overlay visibility
   */
  setOverlays(overlays: OverlayState): void;

  /**
   * Clean up map resources
   */
  destroy(): void;
}
