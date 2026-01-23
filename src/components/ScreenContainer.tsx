import React, { PropsWithChildren } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../hooks/useTheme';

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
  const COLORS = useTheme();
  
  return (
    <View style={[styles.base, style, { backgroundColor: COLORS.BACKGROUND }]}>
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
    width: '100%',
    alignSelf: 'stretch',
    paddingTop: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
});
