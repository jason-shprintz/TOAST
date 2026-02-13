/**
 * Versioned JSON schemas and runtime validation for Offline Terrain Intelligence
 * @format
 */

import { z } from 'zod';

// Schema version constants
export const REGION_SCHEMA_VERSION = 1;
export const WATER_SCHEMA_VERSION = 1;
export const CITY_SCHEMA_VERSION = 1;
export const ROAD_SCHEMA_VERSION = 1;

// Common geometry schemas
const PointGeometrySchema = z.object({
  kind: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
});

const LineStringGeometrySchema = z.object({
  kind: z.literal('LineString'),
  coordinates: z.array(z.tuple([z.number(), z.number()])), // [[lng, lat], ...]
});

const PolygonGeometrySchema = z.object({
  kind: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))), // [[[lng, lat], ...]]
});

const GeometrySchema = z.union([
  PointGeometrySchema,
  LineStringGeometrySchema,
  PolygonGeometrySchema,
]);

// Region JSON Schema V1
export const RegionJsonSchemaV1 = z.object({
  schemaVersion: z.literal(REGION_SCHEMA_VERSION),
  generatedAt: z.string(),
  regionId: z.string(),
  center: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  radiusMiles: z.number(),
  bounds: z.object({
    minLat: z.number(),
    minLng: z.number(),
    maxLat: z.number(),
    maxLng: z.number(),
  }),
  tiles: z.object({
    format: z.string(),
    minZoom: z.number(),
    maxZoom: z.number(),
  }),
  dem: z.object({
    format: z.string(),
    units: z.string(),
    width: z.number(),
    height: z.number(),
    nodata: z.number(),
    bounds: z.object({
      minLat: z.number(),
      minLng: z.number(),
      maxLat: z.number(),
      maxLng: z.number(),
    }),
  }),
});

export type RegionJsonV1 = z.infer<typeof RegionJsonSchemaV1>;

// Water Feature Schema
export const WaterFeatureSchema = z.object({
  id: z.string(),
  type: z.enum([
    'river',
    'creek',
    'lake',
    'reservoir',
    'spring',
    'pond',
    'wash',
    'other',
  ]),
  geometry: GeometrySchema,
  properties: z.object({
    name: z.string().optional(),
    isSeasonal: z.boolean(),
    notes: z.string().optional(),
  }),
});

export type WaterFeature = z.infer<typeof WaterFeatureSchema>;

// Water Collection Schema V1
export const WaterCollectionSchemaV1 = z.object({
  schemaVersion: z.literal(WATER_SCHEMA_VERSION),
  generatedAt: z.string(),
  regionId: z.string(),
  features: z.array(WaterFeatureSchema),
});

export type WaterCollectionV1 = z.infer<typeof WaterCollectionSchemaV1>;

// City Feature Schema
export const CityFeatureSchema = z.object({
  id: z.string(),
  geometry: PointGeometrySchema,
  properties: z.object({
    name: z.string(),
    populationTier: z.enum(['small', 'medium', 'large']),
    population: z.number(),
  }),
});

export type CityFeature = z.infer<typeof CityFeatureSchema>;

// City Collection Schema V1
export const CityCollectionSchemaV1 = z.object({
  schemaVersion: z.literal(CITY_SCHEMA_VERSION),
  generatedAt: z.string(),
  regionId: z.string(),
  features: z.array(CityFeatureSchema),
});

export type CityCollectionV1 = z.infer<typeof CityCollectionSchemaV1>;

// Road Feature Schema
export const RoadFeatureSchema = z.object({
  id: z.string(),
  geometry: LineStringGeometrySchema,
  properties: z.object({
    class: z.enum(['highway', 'secondary', 'dirt', 'trail', 'other']),
    name: z.string().optional(),
  }),
});

export type RoadFeature = z.infer<typeof RoadFeatureSchema>;

// Road Collection Schema V1
export const RoadCollectionSchemaV1 = z.object({
  schemaVersion: z.literal(ROAD_SCHEMA_VERSION),
  generatedAt: z.string(),
  regionId: z.string(),
  features: z.array(RoadFeatureSchema),
});

export type RoadCollectionV1 = z.infer<typeof RoadCollectionSchemaV1>;

// Parse helper functions
export function parseRegionJson(input: unknown): RegionJsonV1 {
  return RegionJsonSchemaV1.parse(input);
}

export function parseWaterCollection(input: unknown): WaterCollectionV1 {
  return WaterCollectionSchemaV1.parse(input);
}

export function parseCityCollection(input: unknown): CityCollectionV1 {
  return CityCollectionSchemaV1.parse(input);
}

export function parseRoadCollection(input: unknown): RoadCollectionV1 {
  return RoadCollectionSchemaV1.parse(input);
}
