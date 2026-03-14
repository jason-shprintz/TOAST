/**
 * Mock for react-native-maps
 */

import React from 'react';
import { View } from 'react-native';

const MapView = React.forwardRef<any, any>((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    animateToRegion: jest.fn(),
  }));
  return <View testID="map-view" {...props} />;
});

MapView.displayName = 'MapView';

export default MapView;

export const Marker = ({
  testID,
  children,
  ...props
}: {
  testID?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}) => (
  <View testID={testID ?? 'map-marker'} {...(props as object)}>
    {children}
  </View>
);

export const PROVIDER_DEFAULT = null;
export const PROVIDER_GOOGLE = 'google';
