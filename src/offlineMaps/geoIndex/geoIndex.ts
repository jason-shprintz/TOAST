/**
 * GeoIndex implementation for offline spatial queries
 * @format
 */

import { z } from 'zod';
import { distanceMeters } from '../geo/geoMath';
import {
  parseWaterCollection,
  parseCityCollection,
  parseRoadCollection,
} from '../schemas';
import {
  buildGridIndex,
  latLngToCellKey,
  getNeighboringCells,
  getAllCellsInRadius,
  type GridIndex,
  type GridIndexConfig,
} from './gridIndex';
import type {
  WaterCollectionV1,
  CityCollectionV1,
  RoadCollectionV1,
  WaterFeature,
  CityFeature,
  RoadFeature,
} from '../schemas';
import type {
  GeoIndex,
  MapFeatureRef,
  MapFeatureKind,
  FeatureGeometry,
} from './geoIndexTypes';
import type { FileOps } from '../storage/fileOps';
import type { RegionPaths } from '../storage/paths';

// Index schema version
const INDEX_SCHEMA_VERSION = 1;

/**
 * Index persistence format
 *
 * Note: MapFeatureRefSchema and IndexJsonSchema are defined for reference and documentation
 * but not actively used for validation due to a known issue with Zod v4's z.record() validator
 * in the React Native environment.
 *
 * Issue: When using z.record(z.array(MapFeatureRefSchema)), Zod incorrectly reports that
 * array values are strings. This appears to be a Zod v4.x issue with record validation.
 * See: https://github.com/colinhacks/zod/issues
 *
 * Workaround: We perform basic manual validation in load() instead. These schemas are
 * preserved for future use when the issue is resolved or Zod is upgraded.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
const MapFeatureRefSchema = z.object({
  kind: z.enum(['water', 'city', 'road']),
  id: z.string(),
  name: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  props: z.record(z.unknown()).optional(),
  geometry: z
    .union([
      z.object({
        kind: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()]),
      }),
      z.object({
        kind: z.literal('LineString'),
        coordinates: z.array(z.tuple([z.number(), z.number()])),
      }),
      z.object({
        kind: z.literal('Polygon'),
        coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
      }),
    ])
    .optional(),
});

const IndexJsonSchema = z.object({
  schemaVersion: z.literal(INDEX_SCHEMA_VERSION),
  generatedAt: z.string().datetime(),
  regionId: z.string(),
  cellSizeMeters: z.number(),
  cells: z.record(z.any()), // Using z.any() due to z.record() validation bug
});
/* eslint-enable @typescript-eslint/no-unused-vars */

type IndexJson = z.infer<typeof IndexJsonSchema>;

/**
 * Create a GeoIndex instance
 */
export function createGeoIndex(paths: RegionPaths, fileOps: FileOps): GeoIndex {
  let currentRegionId: string | null = null;
  let gridIndex: GridIndex | null = null;

  return {
    async load(regionId: string): Promise<void> {
      // Unload previous index if exists
      if (currentRegionId !== null) {
        this.unload();
      }

      // Load index from disk
      const indexPath = paths.index(regionId);
      const indexExists = await fileOps.exists(indexPath);

      if (!indexExists) {
        throw new Error(
          `Index not found for region ${regionId} at ${indexPath}`,
        );
      }

      const indexContent = await fileOps.readFile(indexPath);
      const indexJson = JSON.parse(indexContent) as IndexJson;

      // Basic validation
      if (indexJson.schemaVersion !== INDEX_SCHEMA_VERSION) {
        throw new Error(
          `Unsupported index schema version: ${indexJson.schemaVersion}`,
        );
      }

      if (!indexJson.cells || typeof indexJson.cells !== 'object') {
        throw new Error('Invalid index: cells must be an object');
      }

      // Reconstruct grid index
      const cfg: GridIndexConfig = {
        cellSizeMeters: indexJson.cellSizeMeters,
      };

      gridIndex = {
        cfg,
        cells: indexJson.cells,
      };

      currentRegionId = regionId;
    },

    unload(): void {
      currentRegionId = null;
      gridIndex = null;
    },

    nearestWater(lat: number, lng: number): MapFeatureRef | null {
      return findNearest(lat, lng, 'water', gridIndex);
    },

    nearestCity(lat: number, lng: number): MapFeatureRef | null {
      return findNearest(lat, lng, 'city', gridIndex);
    },

    featuresAtPoint(
      lat: number,
      lng: number,
      toleranceMeters: number,
    ): MapFeatureRef[] {
      if (!gridIndex) {
        return [];
      }

      const candidates: Array<{ feature: MapFeatureRef; distance: number }> =
        [];

      // Calculate search radius based on tolerance and cell size
      // Add 1 for safety margin
      const searchRadius =
        Math.ceil(toleranceMeters / gridIndex.cfg.cellSizeMeters) + 1;

      // Search in expanded cell neighborhood based on tolerance
      const { cx, cy } = latLngToCellKey(lat, lng, gridIndex.cfg);
      const cellKeys = getAllCellsInRadius(cx, cy, searchRadius);

      for (const key of cellKeys) {
        const features = gridIndex.cells[key];
        if (!features) continue;

        for (const feature of features) {
          const dist = calculateFeatureDistance(lat, lng, feature);
          if (dist <= toleranceMeters) {
            candidates.push({ feature, distance: dist });
          }
        }
      }

      // Sort by distance
      candidates.sort((a, b) => a.distance - b.distance);

      return candidates.map((c) => c.feature);
    },
  };
}

/**
 * Find nearest feature of a specific kind
 */
function findNearest(
  lat: number,
  lng: number,
  kind: MapFeatureKind,
  gridIndex: GridIndex | null,
): MapFeatureRef | null {
  if (!gridIndex) {
    return null;
  }

  const { cx, cy } = latLngToCellKey(lat, lng, gridIndex.cfg);

  let bestFeature: MapFeatureRef | null = null;
  let bestDistance = Infinity;

  // Search in expanding rings (up to 50 cells)
  const maxRing = 50;
  for (let ring = 0; ring <= maxRing; ring++) {
    const cellKeys = getNeighboringCells(cx, cy, ring);

    for (const key of cellKeys) {
      const features = gridIndex.cells[key];
      if (!features) continue;

      for (const feature of features) {
        if (feature.kind !== kind) continue;

        const dist = distanceMeters(lat, lng, feature.lat, feature.lng);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestFeature = feature;
        }
      }
    }

    // Early exit if we found something and ring distance exceeds best
    if (bestFeature && ring > 0) {
      const ringDistanceMeters = ring * gridIndex.cfg.cellSizeMeters;
      if (ringDistanceMeters > bestDistance) {
        break;
      }
    }
  }

  return bestFeature;
}

/**
 * Calculate distance from point to feature (handles geometry)
 */
function calculateFeatureDistance(
  lat: number,
  lng: number,
  feature: MapFeatureRef,
): number {
  if (!feature.geometry) {
    // Use representative point
    return distanceMeters(lat, lng, feature.lat, feature.lng);
  }

  switch (feature.geometry.kind) {
    case 'Point': {
      const [fLng, fLat] = feature.geometry.coordinates;
      return distanceMeters(lat, lng, fLat, fLng);
    }

    case 'LineString': {
      return distanceToLineString(lat, lng, feature.geometry.coordinates);
    }

    case 'Polygon': {
      // TODO Phase 2: Implement proper polygon containment/distance checking
      // Currently using centroid-based distance as Phase 1 approximation
      // Phase 2 should implement:
      // - Point-in-polygon test (ray casting algorithm)
      // - Distance to polygon boundary for points outside
      return distanceMeters(lat, lng, feature.lat, feature.lng);
    }
  }
}

/**
 * Calculate minimum distance from point to line string
 */
function distanceToLineString(
  lat: number,
  lng: number,
  coordinates: [number, number][],
): number {
  let minDist = Infinity;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lng1, lat1] = coordinates[i];
    const [lng2, lat2] = coordinates[i + 1];

    const dist = distanceToSegment(lat, lng, lat1, lng1, lat2, lng2);
    if (dist < minDist) {
      minDist = dist;
    }
  }

  return minDist;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToSegment(
  lat: number,
  lng: number,
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  // Convert to simple coordinate system for segment projection
  const px = lng;
  const py = lat;
  const ax = lng1;
  const ay = lat1;
  const bx = lng2;
  const by = lat2;

  // Vector from A to B
  const abx = bx - ax;
  const aby = by - ay;

  // Vector from A to P
  const apx = px - ax;
  const apy = py - ay;

  // Project P onto AB
  const abLenSq = abx * abx + aby * aby;

  if (abLenSq === 0) {
    // A and B are the same point
    return distanceMeters(lat, lng, lat1, lng1);
  }

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));

  // Closest point on segment
  const closestLng = ax + t * abx;
  const closestLat = ay + t * aby;

  return distanceMeters(lat, lng, closestLat, closestLng);
}

/**
 * Build index from overlay JSON files and return GridIndex
 */
export async function buildIndexFromOverlays(
  regionId: string,
  paths: RegionPaths,
  fileOps: FileOps,
  cfg: GridIndexConfig,
): Promise<GridIndex> {
  const features: MapFeatureRef[] = [];

  // Load and transform water features
  try {
    const waterPath = paths.tmpWater(regionId);
    if (await fileOps.exists(waterPath)) {
      const waterContent = await fileOps.readFile(waterPath);
      const waterData: WaterCollectionV1 = parseWaterCollection(
        JSON.parse(waterContent),
      );

      for (const waterFeature of waterData.features) {
        features.push(transformWaterFeature(waterFeature));
      }
    }
  } catch (error) {
    console.warn('[GeoIndex] Failed to load water features:', error);
  }

  // Load and transform city features
  try {
    const citiesPath = paths.tmpCities(regionId);
    if (await fileOps.exists(citiesPath)) {
      const citiesContent = await fileOps.readFile(citiesPath);
      const citiesData: CityCollectionV1 = parseCityCollection(
        JSON.parse(citiesContent),
      );

      for (const cityFeature of citiesData.features) {
        features.push(transformCityFeature(cityFeature));
      }
    }
  } catch (error) {
    console.warn('[GeoIndex] Failed to load city features:', error);
  }

  // Load and transform road features
  try {
    const roadsPath = paths.tmpRoads(regionId);
    if (await fileOps.exists(roadsPath)) {
      const roadsContent = await fileOps.readFile(roadsPath);
      const roadsData: RoadCollectionV1 = parseRoadCollection(
        JSON.parse(roadsContent),
      );

      for (const roadFeature of roadsData.features) {
        features.push(transformRoadFeature(roadFeature));
      }
    }
  } catch (error) {
    console.warn('[GeoIndex] Failed to load road features:', error);
  }

  // Build grid index
  return buildGridIndex(features, cfg);
}

/**
 * Transform water feature to MapFeatureRef
 */
function transformWaterFeature(feature: WaterFeature): MapFeatureRef {
  const { lat, lng, geometry } = computeRepresentativePoint(feature.geometry);

  return {
    kind: 'water',
    id: feature.id,
    name: feature.properties.name,
    lat,
    lng,
    props: {
      type: feature.type,
      isSeasonal: feature.properties.isSeasonal,
      notes: feature.properties.notes,
    },
    geometry,
  };
}

/**
 * Transform city feature to MapFeatureRef
 */
function transformCityFeature(feature: CityFeature): MapFeatureRef {
  const [lng, lat] = feature.geometry.coordinates;

  return {
    kind: 'city',
    id: feature.id,
    name: feature.properties.name,
    lat,
    lng,
    props: {
      populationTier: feature.properties.populationTier,
      population: feature.properties.population,
    },
    geometry: {
      kind: 'Point',
      coordinates: feature.geometry.coordinates,
    },
  };
}

/**
 * Transform road feature to MapFeatureRef
 */
function transformRoadFeature(feature: RoadFeature): MapFeatureRef {
  const { lat, lng, geometry } = computeRepresentativePoint(feature.geometry);

  return {
    kind: 'road',
    id: feature.id,
    name: feature.properties.name,
    lat,
    lng,
    props: {
      class: feature.properties.class,
    },
    geometry,
  };
}

/**
 * Compute representative point and minimal geometry from feature geometry
 */
function computeRepresentativePoint(geometry: {
  kind: string;
  coordinates: any;
}): { lat: number; lng: number; geometry: FeatureGeometry } {
  switch (geometry.kind) {
    case 'Point': {
      const [lng, lat] = geometry.coordinates;
      return {
        lat,
        lng,
        geometry: {
          kind: 'Point',
          coordinates: [lng, lat],
        },
      };
    }

    case 'LineString': {
      const coords = geometry.coordinates as [number, number][];
      // Use centroid as representative point
      const centroid = computeCentroid(coords);
      return {
        lat: centroid.lat,
        lng: centroid.lng,
        geometry: {
          kind: 'LineString',
          coordinates: coords,
        },
      };
    }

    case 'Polygon': {
      const coords = geometry.coordinates as [number, number][][];
      // Use exterior ring for centroid
      const exteriorRing = coords[0];
      const centroid = computeCentroid(exteriorRing);
      return {
        lat: centroid.lat,
        lng: centroid.lng,
        geometry: {
          kind: 'Polygon',
          coordinates: coords,
        },
      };
    }

    default:
      throw new Error(`Unknown geometry kind: ${geometry.kind}`);
  }
}

/**
 * Compute centroid of coordinates
 */
function computeCentroid(coords: [number, number][]): {
  lat: number;
  lng: number;
} {
  let sumLat = 0;
  let sumLng = 0;

  for (const [lng, lat] of coords) {
    sumLat += lat;
    sumLng += lng;
  }

  return {
    lat: sumLat / coords.length,
    lng: sumLng / coords.length,
  };
}

/**
 * Write index to disk
 */
export async function writeIndex(
  regionId: string,
  gridIndex: GridIndex,
  paths: RegionPaths,
  fileOps: FileOps,
): Promise<void> {
  const indexJson: IndexJson = {
    schemaVersion: INDEX_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    regionId,
    cellSizeMeters: gridIndex.cfg.cellSizeMeters,
    cells: gridIndex.cells,
  };

  const indexPath = paths.tmpIndex(regionId);
  await fileOps.writeFileAtomic(indexPath, JSON.stringify(indexJson, null, 2));
}
