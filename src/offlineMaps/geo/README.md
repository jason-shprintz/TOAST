# Tile Coverage and Bounding Geometry Utilities

Pure geometry and tiling math utilities for offline map tile coverage calculations.

## Files

- **`geoMath.ts`** - Geodesy and geometry utilities
- **`tiles.ts`** - Slippy map tile calculations (Web Mercator)
- **`coverage.ts`** - Tile coverage computation

## Usage Examples

### Computing Tile Coverage for a Region

```typescript
import { computeTileCoverage } from './coverage';

// Define a circular region (e.g., Las Vegas with 25-mile radius)
const center = { lat: 36.1699, lng: -115.1398 };
const radiusMiles = 25;
const config = { minZoom: 8, maxZoom: 10 };

// Compute coverage
const result = computeTileCoverage(center, radiusMiles, config);

console.log('Bounds:', result.bounds);
console.log('Total tiles:', result.totalTileCount);
console.log('Tiles by zoom:', result.tileCountByZoom);
// result.tiles contains sorted list of {z, x, y} tile coordinates
```

### Converting Regions to Bounding Boxes

```typescript
import { regionToBounds } from './geoMath';

const center = { lat: 40.7128, lng: -74.006 }; // NYC
const radiusMiles = 10;

const bounds = regionToBounds(center, radiusMiles);
// Returns: { minLat, minLng, maxLat, maxLng }
```

### Tile Coordinate Conversions

```typescript
import { lonToTileX, latToTileY, tileXToLon, tileYToLat } from './tiles';

// Convert lat/lng to tile coordinates at zoom level 10
const x = lonToTileX(-115.1398, 10);
const y = latToTileY(36.1699, 10);

// Convert back to lat/lng
const lng = tileXToLon(x, 10);
const lat = tileYToLat(y, 10);
```

### Estimating Tile Counts

```typescript
import { estimateTileCountForBounds } from './coverage';
import { regionToBounds } from './geoMath';

const center = { lat: 36.1699, lng: -115.1398 };
const bounds = regionToBounds(center, 25);
const config = { minZoom: 8, maxZoom: 10 };

const estimate = estimateTileCountForBounds(bounds, config);
console.log('Total tiles:', estimate.total);
console.log('By zoom:', estimate.byZoom);
```

## Features

- **Pure computation** - No I/O, network, or database operations
- **Deterministic** - Same input always produces same output
- **Edge case handling** - Handles antimeridian crossing and polar regions
- **Sorted & unique tiles** - Results sorted by z, y, x and deduplicated
- **Web Mercator projection** - Standard slippy map tile projection

## Edge Cases Handled

1. **Antimeridian Crossing** - When a region crosses the 180°/-180° longitude line
2. **Polar Regions** - Latitude clamped to Web Mercator limits (±85.05112878°)
3. **Longitude Normalization** - All longitudes normalized to [-180, 180] range

## Type Definitions

```typescript
interface LatLng {
  lat: number;
  lng: number;
}

interface Bounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

interface TileCoord {
  z: number;  // zoom level
  x: number;  // tile X coordinate
  y: number;  // tile Y coordinate
}

interface TileCoverageConfig {
  minZoom: number;  // inclusive
  maxZoom: number;  // inclusive
}

interface CoverageResult {
  bounds: Bounds;
  tiles: TileCoord[];
  tileCountByZoom: Record<number, number>;
  totalTileCount: number;
}
```
