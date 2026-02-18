/**
 * Stub map adapter implementation
 * This is a placeholder that renders a basic view until a real map SDK is integrated
 * @format
 */

import type {
  MapAdapter,
  MapMarkerData,
  MapRenderOptions,
  OverlayState,
} from './mapAdapter';

/**
 * Stub implementation that doesn't use a real map SDK
 * Shows basic information about the offline region
 * Replace with MapLibreAdapter or MapboxAdapter when ready
 */
export class StubMapAdapter implements MapAdapter {
  private opts: MapRenderOptions | null = null;
  private onTapCallback: ((lat: number, lng: number) => void) | undefined;
  private onMarkerPressCallback: ((id: string) => void) | undefined;

  render(opts: MapRenderOptions): void {
    this.opts = opts;
    this.onTapCallback = opts.onTap;
    // In a real implementation, this would:
    // 1. Initialize the map SDK
    // 2. Configure it to load tiles from mbtilesPath
    // 3. Set up tap handlers
    // 4. Configure overlay layers
    console.log('StubMapAdapter: render called with', {
      mbtilesPath: opts.mbtilesPath,
      overlays: opts.overlays,
    });
  }

  setOverlays(overlays: OverlayState): void {
    console.log('StubMapAdapter: setOverlays', overlays);
  }

  setOnTap(callback: ((lat: number, lng: number) => void) | undefined): void {
    this.onTapCallback = callback;
    console.log('StubMapAdapter: setOnTap', { hasCallback: !!callback });
  }

  setMarkers(markers: MapMarkerData[], onPress: (id: string) => void): void {
    this.onMarkerPressCallback = onPress;
    console.log('StubMapAdapter: setMarkers', {
      count: markers.length,
      markers,
    });
  }

  destroy(): void {
    this.opts = null;
    this.onTapCallback = undefined;
    this.onMarkerPressCallback = undefined;
    console.log('StubMapAdapter: destroy called');
  }
}

/**
 * Factory function to create map adapter
 * When a real map SDK is added, this can be updated to return the appropriate adapter
 */
export function createMapAdapter(): MapAdapter {
  return new StubMapAdapter();
}
