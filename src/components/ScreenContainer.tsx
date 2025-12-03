import React, { PropsWithChildren } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS } from '../theme';

type Props = {
  style?: StyleProp<ViewStyle>;
};

/**
 * A container component that wraps its children inside a styled `View`.
 *
 * @param style - Additional styles to apply to the container.
 * @param children - React elements to be rendered inside the container.
 */
export default function ScreenContainer({
  style,
  children,
}: PropsWithChildren<Props>) {
  return <View style={[styles.base, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
});
