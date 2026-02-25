/**
 * Overpass API overlay provider
 * Fetches water, city, and road features from OpenStreetMap via the Overpass API
 * @format
 */

import {
  WATER_SCHEMA_VERSION,
  CITY_SCHEMA_VERSION,
  ROAD_SCHEMA_VERSION,
} from '../schemas';
import type {
  OverlayProvider,
  OverlayKind,
  OverlayRequest,
  OverlayFetchProgress,
} from './overlayTypes';
import type {
  WaterCollectionV1,
  CityCollectionV1,
  RoadCollectionV1,
} from '../schemas';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/** Default timeout for Overpass API requests in milliseconds */
const OVERPASS_TIMEOUT_MS = 120_000;

// ─── Overpass API response shapes ────────────────────────────────────────────

interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OverpassWay {
  type: 'way';
  id: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

type OverpassElement = OverpassNode | OverpassWay;

interface OverpassResponse {
  elements: OverpassElement[];
}

// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Execute an Overpass QL query and return the parsed JSON response
 */
async function queryOverpass(
  query: string,
  onProgress?: (p: OverlayFetchProgress) => void,
): Promise<OverpassResponse> {
  onProgress?.({ message: 'Querying Overpass API...' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        `Overpass API request timed out after ${OVERPASS_TIMEOUT_MS / 1000}s`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(
      `Overpass API error: HTTP ${response.status} ${response.statusText}`,
    );
  }

  onProgress?.({ message: 'Processing results...' });
  return response.json() as Promise<OverpassResponse>;
}

/**
 * Format bounds as (south,west,north,east) for Overpass bbox filter
 */
function bbox(bounds: OverlayRequest['bounds']): string {
  return `${bounds.minLat},${bounds.minLng},${bounds.maxLat},${bounds.maxLng}`;
}

/**
 * Map OSM waterway/water tags to the app's WaterFeature type
 */
function mapWaterType(
  tags: Record<string, string>,
): WaterCollectionV1['features'][number]['type'] {
  if (tags.natural === 'spring') return 'spring';
  if (tags.waterway === 'river') return 'river';
  if (tags.waterway === 'stream' || tags.waterway === 'creek') return 'creek';
  if (tags.waterway === 'ditch' || tags.waterway === 'drain') return 'wash';
  const waterType = tags.water;
  if (waterType === 'lake') return 'lake';
  if (waterType === 'reservoir') return 'reservoir';
  if (waterType === 'pond') return 'pond';
  return 'other';
}

/**
 * Map OSM place tag to the app's population tier
 */
function mapPopulationTier(place: string): 'small' | 'medium' | 'large' {
  if (place === 'city') return 'large';
  if (place === 'town') return 'medium';
  return 'small';
}

/**
 * Default population estimate when no population tag is present
 */
function defaultPopulation(place: string): number {
  if (place === 'city') return 100000;
  if (place === 'town') return 10000;
  if (place === 'village') return 1000;
  return 200;
}

/**
 * Map OSM highway value to the app's road class
 */
function mapRoadClass(
  highway: string,
): 'highway' | 'secondary' | 'dirt' | 'trail' | 'other' {
  if (['motorway', 'trunk', 'primary'].includes(highway)) return 'highway';
  if (['secondary', 'tertiary'].includes(highway)) return 'secondary';
  if (
    [
      'track',
      'service',
      'unclassified',
      'residential',
      'living_street',
    ].includes(highway)
  )
    return 'dirt';
  if (['path', 'footway', 'cycleway', 'bridleway', 'steps'].includes(highway))
    return 'trail';
  return 'other';
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Overlay provider that fetches features from OpenStreetMap via the Overpass API.
 * Returns water bodies, settlements, and named roads within the region bounds.
 */
export class OverpassOverlayProvider implements OverlayProvider {
  async fetchOverlay(
    kind: OverlayKind,
    req: OverlayRequest,
    opts?: { onProgress?: (progress: OverlayFetchProgress) => void },
  ): Promise<unknown> {
    const { bounds, regionId } = req;
    const generatedAt = new Date().toISOString();
    const onProgress = opts?.onProgress;

    switch (kind) {
      case 'water':
        return this.fetchWater(regionId, bounds, generatedAt, onProgress);
      case 'cities':
        return this.fetchCities(regionId, bounds, generatedAt, onProgress);
      case 'roads':
        return this.fetchRoads(regionId, bounds, generatedAt, onProgress);
      default:
        throw new Error(`Unknown overlay kind: ${kind}`);
    }
  }

  private async fetchWater(
    regionId: string,
    bounds: OverlayRequest['bounds'],
    generatedAt: string,
    onProgress?: (p: OverlayFetchProgress) => void,
  ): Promise<WaterCollectionV1> {
    const bb = bbox(bounds);
    const query = [
      `[out:json][timeout:90][bbox:${bb}];`,
      `(`,
      `  node["natural"="spring"];`,
      `  way["natural"="water"];`,
      `  way["waterway"~"^(river|stream|canal|creek|ditch|drain)$"];`,
      `);`,
      `out geom;`,
    ].join('');

    const data = await queryOverpass(query, onProgress);
    const features: WaterCollectionV1['features'] = [];

    for (const el of data.elements) {
      const tags = el.tags ?? {};
      const id = `${el.type}/${el.id}`;
      const type = mapWaterType(tags);
      const isSeasonal = tags.seasonal === 'yes' || tags.intermittent === 'yes';
      const name = tags.name;

      if (el.type === 'node') {
        features.push({
          id,
          type,
          geometry: { kind: 'Point', coordinates: [el.lon, el.lat] },
          properties: { name, isSeasonal },
        });
      } else if (el.type === 'way' && el.geometry && el.geometry.length >= 2) {
        const coords = el.geometry.map((pt): [number, number] => [
          pt.lon,
          pt.lat,
        ]);

        // Closed rings with ≥ 4 points become Polygon (lake/reservoir/etc.)
        const isClosed =
          coords.length >= 4 &&
          coords[0][0] === coords[coords.length - 1][0] &&
          coords[0][1] === coords[coords.length - 1][1];

        if (
          isClosed &&
          (tags.natural === 'water' || tags.waterway === 'riverbank')
        ) {
          features.push({
            id,
            type,
            geometry: { kind: 'Polygon', coordinates: [coords] },
            properties: { name, isSeasonal },
          });
        } else {
          features.push({
            id,
            type,
            geometry: { kind: 'LineString', coordinates: coords },
            properties: { name, isSeasonal },
          });
        }
      }
    }

    return {
      schemaVersion: WATER_SCHEMA_VERSION,
      generatedAt,
      regionId,
      features,
    };
  }

  private async fetchCities(
    regionId: string,
    bounds: OverlayRequest['bounds'],
    generatedAt: string,
    onProgress?: (p: OverlayFetchProgress) => void,
  ): Promise<CityCollectionV1> {
    const bb = bbox(bounds);
    const query = [
      `[out:json][timeout:30][bbox:${bb}];`,
      `node["place"~"^(city|town|village|hamlet)$"]["name"];`,
      `out body;`,
    ].join('');

    const data = await queryOverpass(query, onProgress);
    const features: CityCollectionV1['features'] = [];

    for (const el of data.elements) {
      if (el.type !== 'node') continue;
      const tags = el.tags ?? {};
      if (!tags.name) continue;

      const place = tags.place ?? 'village';
      const populationTier = mapPopulationTier(place);
      const rawPop = parseInt(tags.population ?? '', 10);
      const population = isNaN(rawPop) ? defaultPopulation(place) : rawPop;

      features.push({
        id: `node/${el.id}`,
        geometry: { kind: 'Point', coordinates: [el.lon, el.lat] },
        properties: { name: tags.name, populationTier, population },
      });
    }

    return {
      schemaVersion: CITY_SCHEMA_VERSION,
      generatedAt,
      regionId,
      features,
    };
  }

  private async fetchRoads(
    regionId: string,
    bounds: OverlayRequest['bounds'],
    generatedAt: string,
    onProgress?: (p: OverlayFetchProgress) => void,
  ): Promise<RoadCollectionV1> {
    const bb = bbox(bounds);
    // Restrict to named roads to limit data volume
    const query = [
      `[out:json][timeout:90][bbox:${bb}];`,
      `way["highway"]["name"];`,
      `out geom;`,
    ].join('');

    const data = await queryOverpass(query, onProgress);
    const features: RoadCollectionV1['features'] = [];

    for (const el of data.elements) {
      if (el.type !== 'way') continue;
      if (!el.geometry || el.geometry.length < 2) continue;
      const tags = el.tags ?? {};

      const coords = el.geometry.map((pt): [number, number] => [
        pt.lon,
        pt.lat,
      ]);

      features.push({
        id: `way/${el.id}`,
        geometry: { kind: 'LineString', coordinates: coords },
        properties: {
          class: mapRoadClass(tags.highway ?? 'other'),
          name: tags.name,
        },
      });
    }

    return {
      schemaVersion: ROAD_SCHEMA_VERSION,
      generatedAt,
      regionId,
      features,
    };
  }
}
