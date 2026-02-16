/**
 * Tests for Offline Region schemas
 * @format
 */

import {
  parseRegionJson,
  parseWaterCollection,
  parseCityCollection,
  parseRoadCollection,
  REGION_SCHEMA_VERSION,
  WATER_SCHEMA_VERSION,
  CITY_SCHEMA_VERSION,
  ROAD_SCHEMA_VERSION,
} from '../schemas';

describe('Offline Region Schemas', () => {
  describe('RegionJson Schema', () => {
    it('should validate a valid region.json', () => {
      const validRegion = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        center: { lat: 40.7128, lng: -74.006 },
        radiusMiles: 25,
        bounds: {
          minLat: 40.5,
          minLng: -74.5,
          maxLat: 41.0,
          maxLng: -73.5,
        },
        tiles: {
          format: 'mbtiles',
          minZoom: 8,
          maxZoom: 14,
        },
        dem: {
          format: 'grid',
          units: 'meters',
          encoding: 'int16',
          width: 1000,
          height: 1000,
          nodata: -9999,
          bounds: {
            minLat: 40.5,
            minLng: -74.5,
            maxLat: 41.0,
            maxLng: -73.5,
          },
        },
      };

      const result = parseRegionJson(validRegion);
      expect(result).toEqual(validRegion);
      expect(result.schemaVersion).toBe(REGION_SCHEMA_VERSION);
    });

    it('should throw on missing schemaVersion', () => {
      const invalid = {
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        center: { lat: 40.7128, lng: -74.006 },
        radiusMiles: 25,
        bounds: {
          minLat: 40.5,
          minLng: -74.5,
          maxLat: 41.0,
          maxLng: -73.5,
        },
        tiles: {
          format: 'mbtiles',
          minZoom: 8,
          maxZoom: 14,
        },
        dem: {
          format: 'grid',
          units: 'meters',
          encoding: 'int16',
          width: 1000,
          height: 1000,
          nodata: -9999,
          bounds: {
            minLat: 40.5,
            minLng: -74.5,
            maxLat: 41.0,
            maxLng: -73.5,
          },
        },
      };

      expect(() => parseRegionJson(invalid)).toThrow();
    });

    it('should throw on missing required fields', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        // missing center, radiusMiles, bounds, tiles, dem
      };

      expect(() => parseRegionJson(invalid)).toThrow();
    });

    it('should throw on invalid schemaVersion value', () => {
      const invalid = {
        schemaVersion: 999, // wrong version
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        center: { lat: 40.7128, lng: -74.006 },
        radiusMiles: 25,
        bounds: {
          minLat: 40.5,
          minLng: -74.5,
          maxLat: 41.0,
          maxLng: -73.5,
        },
        tiles: {
          format: 'mbtiles',
          minZoom: 8,
          maxZoom: 14,
        },
        dem: {
          format: 'grid',
          units: 'meters',
          encoding: 'int16',
          width: 1000,
          height: 1000,
          nodata: -9999,
          bounds: {
            minLat: 40.5,
            minLng: -74.5,
            maxLat: 41.0,
            maxLng: -73.5,
          },
        },
      };

      expect(() => parseRegionJson(invalid)).toThrow();
    });

    it('should throw on invalid generatedAt timestamp', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: 'not-a-valid-iso-timestamp',
        regionId: 'region-123',
        center: { lat: 40.7128, lng: -74.006 },
        radiusMiles: 25,
        bounds: {
          minLat: 40.5,
          minLng: -74.5,
          maxLat: 41.0,
          maxLng: -73.5,
        },
        tiles: {
          format: 'mbtiles',
          minZoom: 8,
          maxZoom: 14,
        },
        dem: {
          format: 'grid',
          units: 'meters',
          encoding: 'int16',
          width: 1000,
          height: 1000,
          nodata: -9999,
          bounds: {
            minLat: 40.5,
            minLng: -74.5,
            maxLat: 41.0,
            maxLng: -73.5,
          },
        },
      };

      expect(() => parseRegionJson(invalid)).toThrow();
    });

    it('should throw on invalid tile format', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        center: { lat: 40.7128, lng: -74.006 },
        radiusMiles: 25,
        bounds: {
          minLat: 40.5,
          minLng: -74.5,
          maxLat: 41.0,
          maxLng: -73.5,
        },
        tiles: {
          format: 'invalid-format', // should be 'mbtiles'
          minZoom: 8,
          maxZoom: 14,
        },
        dem: {
          format: 'grid',
          units: 'meters',
          encoding: 'int16',
          width: 1000,
          height: 1000,
          nodata: -9999,
          bounds: {
            minLat: 40.5,
            minLng: -74.5,
            maxLat: 41.0,
            maxLng: -73.5,
          },
        },
      };

      expect(() => parseRegionJson(invalid)).toThrow();
    });

    it('should throw on invalid zoom levels', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        center: { lat: 40.7128, lng: -74.006 },
        radiusMiles: 25,
        bounds: {
          minLat: 40.5,
          minLng: -74.5,
          maxLat: 41.0,
          maxLng: -73.5,
        },
        tiles: {
          format: 'mbtiles',
          minZoom: -1, // invalid: negative
          maxZoom: 14,
        },
        dem: {
          format: 'grid',
          units: 'meters',
          encoding: 'int16',
          width: 1000,
          height: 1000,
          nodata: -9999,
          bounds: {
            minLat: 40.5,
            minLng: -74.5,
            maxLat: 41.0,
            maxLng: -73.5,
          },
        },
      };

      expect(() => parseRegionJson(invalid)).toThrow();
    });

    it('should throw on invalid DEM dimensions', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        center: { lat: 40.7128, lng: -74.006 },
        radiusMiles: 25,
        bounds: {
          minLat: 40.5,
          minLng: -74.5,
          maxLat: 41.0,
          maxLng: -73.5,
        },
        tiles: {
          format: 'mbtiles',
          minZoom: 8,
          maxZoom: 14,
        },
        dem: {
          format: 'grid',
          units: 'meters',
          encoding: 'int16',
          width: -100, // invalid: negative
          height: 1000,
          nodata: -9999,
          bounds: {
            minLat: 40.5,
            minLng: -74.5,
            maxLat: 41.0,
            maxLng: -73.5,
          },
        },
      };

      expect(() => parseRegionJson(invalid)).toThrow();
    });

    it('should throw on unexpected fields (strict mode)', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        center: { lat: 40.7128, lng: -74.006 },
        radiusMiles: 25,
        bounds: {
          minLat: 40.5,
          minLng: -74.5,
          maxLat: 41.0,
          maxLng: -73.5,
        },
        tiles: {
          format: 'mbtiles',
          minZoom: 8,
          maxZoom: 14,
        },
        dem: {
          format: 'grid',
          units: 'meters',
          encoding: 'int16',
          width: 1000,
          height: 1000,
          nodata: -9999,
          bounds: {
            minLat: 40.5,
            minLng: -74.5,
            maxLat: 41.0,
            maxLng: -73.5,
          },
        },
        unexpectedField: 'should cause error', // extra field
      };

      expect(() => parseRegionJson(invalid)).toThrow();
    });
  });

  describe('Water Collection Schema', () => {
    it('should validate a valid water collection with Point geometry', () => {
      const validWater = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'water-1',
            type: 'spring',
            geometry: {
              kind: 'Point',
              coordinates: [-74.006, 40.7128], // [lng, lat]
            },
            properties: {
              name: 'Mountain Spring',
              isSeasonal: false,
              notes: 'Reliable water source',
            },
          },
        ],
      };

      const result = parseWaterCollection(validWater);
      expect(result).toEqual(validWater);
      expect(result.schemaVersion).toBe(WATER_SCHEMA_VERSION);
      expect(result.features).toHaveLength(1);
      expect(result.features[0].type).toBe('spring');
    });

    it('should validate a valid water collection with LineString geometry', () => {
      const validWater = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'water-2',
            type: 'river',
            geometry: {
              kind: 'LineString',
              coordinates: [
                [-74.006, 40.7128],
                [-74.007, 40.7129],
                [-74.008, 40.713],
              ],
            },
            properties: {
              name: 'Hudson River',
              isSeasonal: false,
            },
          },
        ],
      };

      const result = parseWaterCollection(validWater);
      expect(result).toEqual(validWater);
      expect(result.features[0].geometry.kind).toBe('LineString');
    });

    it('should validate a valid water collection with Polygon geometry', () => {
      const validWater = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'water-3',
            type: 'lake',
            geometry: {
              kind: 'Polygon',
              coordinates: [
                [
                  [-74.006, 40.7128],
                  [-74.007, 40.7128],
                  [-74.007, 40.7129],
                  [-74.006, 40.7129],
                  [-74.006, 40.7128],
                ],
              ],
            },
            properties: {
              name: 'Central Lake',
              isSeasonal: false,
            },
          },
        ],
      };

      const result = parseWaterCollection(validWater);
      expect(result).toEqual(validWater);
      expect(result.features[0].geometry.kind).toBe('Polygon');
    });

    it('should validate empty features array', () => {
      const validWater = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [],
      };

      const result = parseWaterCollection(validWater);
      expect(result.features).toEqual([]);
    });

    it('should throw on invalid water type enum', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'water-1',
            type: 'invalid-type', // not in enum
            geometry: {
              kind: 'Point',
              coordinates: [-74.006, 40.7128],
            },
            properties: {
              name: 'Test',
              isSeasonal: false,
            },
          },
        ],
      };

      expect(() => parseWaterCollection(invalid)).toThrow();
    });

    it('should throw on missing schemaVersion', () => {
      const invalid = {
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [],
      };

      expect(() => parseWaterCollection(invalid)).toThrow();
    });

    it('should throw on invalid coordinate shape', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'water-1',
            type: 'spring',
            geometry: {
              kind: 'Point',
              coordinates: [40.7128], // missing lng - invalid tuple
            },
            properties: {
              name: 'Test',
              isSeasonal: false,
            },
          },
        ],
      };

      expect(() => parseWaterCollection(invalid)).toThrow();
    });

    it('should throw on LineString with less than 2 positions', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'water-1',
            type: 'river',
            geometry: {
              kind: 'LineString',
              coordinates: [[-74.006, 40.7128]], // only 1 position - invalid
            },
            properties: {
              name: 'Test River',
              isSeasonal: false,
            },
          },
        ],
      };

      expect(() => parseWaterCollection(invalid)).toThrow();
    });

    it('should throw on Polygon with invalid linear ring (less than 4 positions)', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'water-1',
            type: 'lake',
            geometry: {
              kind: 'Polygon',
              coordinates: [
                [
                  [-74.006, 40.7128],
                  [-74.007, 40.7128],
                  [-74.006, 40.7128], // only 3 positions - invalid
                ],
              ],
            },
            properties: {
              name: 'Test Lake',
              isSeasonal: false,
            },
          },
        ],
      };

      expect(() => parseWaterCollection(invalid)).toThrow();
    });

    it('should throw on Polygon with unclosed ring', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'water-1',
            type: 'lake',
            geometry: {
              kind: 'Polygon',
              coordinates: [
                [
                  [-74.006, 40.7128],
                  [-74.007, 40.7128],
                  [-74.007, 40.7129],
                  [-74.006, 40.7129], // not closed - should be [-74.006, 40.7128]
                ],
              ],
            },
            properties: {
              name: 'Test Lake',
              isSeasonal: false,
            },
          },
        ],
      };

      expect(() => parseWaterCollection(invalid)).toThrow();
    });
  });

  describe('City Collection Schema', () => {
    it('should validate a valid city collection', () => {
      const validCities = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'city-1',
            geometry: {
              kind: 'Point',
              coordinates: [-74.006, 40.7128],
            },
            properties: {
              name: 'New York',
              populationTier: 'large',
              population: 8000000,
            },
          },
          {
            id: 'city-2',
            geometry: {
              kind: 'Point',
              coordinates: [-73.935, 40.73],
            },
            properties: {
              name: 'Brooklyn',
              populationTier: 'medium',
              population: 2500000,
            },
          },
        ],
      };

      const result = parseCityCollection(validCities);
      expect(result).toEqual(validCities);
      expect(result.schemaVersion).toBe(CITY_SCHEMA_VERSION);
      expect(result.features).toHaveLength(2);
    });

    it('should throw on invalid populationTier enum', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'city-1',
            geometry: {
              kind: 'Point',
              coordinates: [-74.006, 40.7128],
            },
            properties: {
              name: 'New York',
              populationTier: 'huge', // invalid enum value
              population: 8000000,
            },
          },
        ],
      };

      expect(() => parseCityCollection(invalid)).toThrow();
    });

    it('should throw on missing required properties', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'city-1',
            geometry: {
              kind: 'Point',
              coordinates: [-74.006, 40.7128],
            },
            properties: {
              name: 'New York',
              // missing populationTier and population
            },
          },
        ],
      };

      expect(() => parseCityCollection(invalid)).toThrow();
    });

    it('should validate empty features array', () => {
      const validCities = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [],
      };

      const result = parseCityCollection(validCities);
      expect(result.features).toEqual([]);
    });
  });

  describe('Road Collection Schema', () => {
    it('should validate a valid road collection', () => {
      const validRoads = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'road-1',
            geometry: {
              kind: 'LineString',
              coordinates: [
                [-74.006, 40.7128],
                [-74.007, 40.7129],
                [-74.008, 40.713],
              ],
            },
            properties: {
              class: 'highway',
              name: 'Interstate 95',
            },
          },
          {
            id: 'road-2',
            geometry: {
              kind: 'LineString',
              coordinates: [
                [-74.01, 40.71],
                [-74.011, 40.711],
              ],
            },
            properties: {
              class: 'trail',
            },
          },
        ],
      };

      const result = parseRoadCollection(validRoads);
      expect(result).toEqual(validRoads);
      expect(result.schemaVersion).toBe(ROAD_SCHEMA_VERSION);
      expect(result.features).toHaveLength(2);
    });

    it('should throw on invalid road class enum', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'road-1',
            geometry: {
              kind: 'LineString',
              coordinates: [
                [-74.006, 40.7128],
                [-74.007, 40.7129],
              ],
            },
            properties: {
              class: 'superhighway', // invalid enum value
              name: 'Test Road',
            },
          },
        ],
      };

      expect(() => parseRoadCollection(invalid)).toThrow();
    });

    it('should validate road without name (optional field)', () => {
      const validRoads = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'road-1',
            geometry: {
              kind: 'LineString',
              coordinates: [
                [-74.006, 40.7128],
                [-74.007, 40.7129],
              ],
            },
            properties: {
              class: 'dirt',
            },
          },
        ],
      };

      const result = parseRoadCollection(validRoads);
      expect(result.features[0].properties.name).toBeUndefined();
    });

    it('should throw on wrong geometry type (Point instead of LineString)', () => {
      const invalid = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [
          {
            id: 'road-1',
            geometry: {
              kind: 'Point', // roads must be LineString
              coordinates: [-74.006, 40.7128],
            },
            properties: {
              class: 'highway',
              name: 'Test Road',
            },
          },
        ],
      };

      expect(() => parseRoadCollection(invalid)).toThrow();
    });

    it('should validate empty features array', () => {
      const validRoads = {
        schemaVersion: 1,
        generatedAt: '2026-02-13T23:00:00.000Z',
        regionId: 'region-123',
        features: [],
      };

      const result = parseRoadCollection(validRoads);
      expect(result.features).toEqual([]);
    });
  });
});
