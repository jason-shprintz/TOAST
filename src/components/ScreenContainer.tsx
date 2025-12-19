import React, { PropsWithChildren } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
  return (
    <View style={[styles.base, style]}>
      <LinearGradient
        colors={COLORS.BACKGROUND_GRADIENT}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
});
