# Offline Map UI Integration Guide

## Overview

The Offline Map UI provides a complete screen for viewing offline maps rendered from local MBTiles files with overlay toggles.

## Components

### OfflineMapScreen

Main screen component with automatic state management:

- **Loading**: Shows spinner while fetching region
- **Error**: Displays error message with retry button
- **Missing**: Shows CTA to download offline region
- **Ready**: Renders the OfflineMapView

### OfflineMapView

Core map view component that:

- Renders map using local MBTiles via adapter
- Manages overlay toggle state (Water/Cities/Terrain)
- Provides tap callback for future inspector integration

### OverlayToggles

UI component with three toggle switches for overlays.

## Usage

### Adding to Navigation

To add the Offline Map screen to your app navigation:

```typescript
// In src/navigation/AppNavigator.tsx
import OfflineMapScreen from '../offlineMaps/ui/OfflineMapScreen';

// Inside Stack.Navigator
<Stack.Screen name="OfflineMap" component={OfflineMapScreen} />
```

### Programmatic Navigation

```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('OfflineMap');
```

### Using the Hook Directly

```typescript
import { useOfflineRegion } from '../offlineMaps/ui';

function MyComponent() {
  const { region, status, error } = useOfflineRegion();

  if (status === 'ready' && region) {
    // Region is available and has tilesPath
  }
}
```

## Map SDK Integration

The current implementation uses a **stub adapter** that displays region information but doesn't render actual tiles. To integrate a real map SDK:

1. Install your preferred map library (e.g., `@maplibre/maplibre-react-native`)
2. Create a new adapter in `src/offlineMaps/ui/mapAdapters/`:

```typescript
// maplibreAdapter.ts
import type { MapAdapter, MapRenderOptions, OverlayState } from './mapAdapter';

export class MapLibreAdapter implements MapAdapter {
  render(opts: MapRenderOptions): void {
    // Initialize MapLibre with local tile source
    // Configure to use opts.mbtilesPath
  }

  setCenter(lat: number, lng: number): void {
    /* ... */
  }
  setOverlays(overlays: OverlayState): void {
    /* ... */
  }
  destroy(): void {
    /* ... */
  }
}
```

3. Update `stubMapAdapter.ts` factory:

```typescript
export function createMapAdapter(): MapAdapter {
  return new MapLibreAdapter(); // Instead of StubMapAdapter
}
```

## Network Isolation

The implementation guarantees no network calls when rendering a ready region:

- RegionRepository reads from local SQLite
- Map adapter uses local MBTiles file
- No remote tile endpoints are configured
- Test suite verifies fetch() is never called

## Extension Points

### Tap Inspector (Issue 12)

The map tap callback is already wired:

```typescript
// In OfflineMapScreen
const handleMapTap = useCallback((lat: number, lng: number) => {
  // Open inspector sheet with lat/lng
}, []);
```

### Quick Actions (Issue 13)

Quick actions can be added as siblings to the OfflineMapView in OfflineMapScreen.

### Overlay Rendering (Issue 10/12)

The overlay state is managed but rendering is not yet implemented. The MapAdapter's `setOverlays()` method is the integration point.
