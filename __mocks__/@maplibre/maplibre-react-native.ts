/**
 * Mock for @maplibre/maplibre-react-native
 * Provides stub components for use in Jest tests
 */

import React from 'react';
import { View } from 'react-native';

const MapView = jest.fn(({ children }: { children?: React.ReactNode }) =>
  React.createElement(View, { testID: 'map-view' }, children),
);

const Camera = jest.fn(() => null);

const ShapeSource = jest.fn(({ children }: { children?: React.ReactNode }) =>
  React.createElement(View, { testID: 'shape-source' }, children),
);

const FillLayer = jest.fn(() => null);
const LineLayer = jest.fn(() => null);
const SymbolLayer = jest.fn(() => null);
const RasterSource = jest.fn(() => null);
const RasterLayer = jest.fn(() => null);
const PointAnnotation = jest.fn(() => null);
const MarkerView = jest.fn(() => null);
const BackgroundLayer = jest.fn(() => null);
const CircleLayer = jest.fn(() => null);
const FillExtrusionLayer = jest.fn(() => null);
const HeatmapLayer = jest.fn(() => null);
const VectorSource = jest.fn(() => null);
const ImageSource = jest.fn(() => null);
const Images = jest.fn(() => null);
const Light = jest.fn(() => null);
const Callout = jest.fn(() => null);
const Annotation = jest.fn(() => null);
const UserLocation = jest.fn(() => null);
const OfflineManager = { pack: jest.fn(), deletePack: jest.fn() };
const SnapshotManager = { takeSnap: jest.fn() };
const LocationManager = {
  start: jest.fn(),
  stop: jest.fn(),
  getLastKnownLocation: jest.fn(),
};
const Logger = {
  setLogCallback: jest.fn(),
  setLogLevel: jest.fn(),
};

export {
  MapView,
  Camera,
  ShapeSource,
  FillLayer,
  LineLayer,
  SymbolLayer,
  RasterSource,
  RasterLayer,
  PointAnnotation,
  MarkerView,
  BackgroundLayer,
  CircleLayer,
  FillExtrusionLayer,
  HeatmapLayer,
  VectorSource,
  ImageSource,
  Images,
  Light,
  Callout,
  Annotation,
  UserLocation,
  OfflineManager,
  SnapshotManager,
  LocationManager,
  Logger,
};

export default {
  MapView,
  Camera,
  ShapeSource,
  FillLayer,
  LineLayer,
  SymbolLayer,
  RasterSource,
  RasterLayer,
  PointAnnotation,
  MarkerView,
  BackgroundLayer,
  CircleLayer,
  FillExtrusionLayer,
  HeatmapLayer,
  VectorSource,
  ImageSource,
  Images,
  Light,
  Callout,
  Annotation,
  UserLocation,
  OfflineManager,
  SnapshotManager,
  LocationManager,
  Logger,
};
