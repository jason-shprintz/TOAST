import React, { PropsWithChildren } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
};

/**
 * A React component that renders its children inside a styled grid container.
 *
 * @param style - Optional custom styles to apply to the grid container.
 * @param children - The content to be rendered inside the grid.
 */
export default function Grid({ style, children }: PropsWithChildren<Props>) {
  return <View style={[styles.grid, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    paddingTop: 20,
  },
});
