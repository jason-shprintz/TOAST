import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type Props = {
  style?: StyleProp<ViewStyle>;
};

/**
 * A layout wrapper component that renders its children inside a `View` with the
 * component's base styles merged with an optional `style` prop.
 *
 * @remarks
 * Style precedence follows React Native array semantics: `style` is applied after
 * the base styles and can override them.
 *
 * The outermost container sets `backgroundColor` to the theme's background color so
 * that iOS over-scroll reveals the correct color instead of flashing white or black.
 *
 * @param props - Component props.
 * @param props.style - Optional additional/override styles for the container `View`.
 * @param props.children - React children to render within the container.
 *
 * @returns A styled React Native `View` containing `children`.
 */
export default function ScreenBody({
  style,
  children,
}: PropsWithChildren<Props>) {
  const COLORS = useTheme();
  return (
    <View style={[styles.base, { backgroundColor: COLORS.BACKGROUND }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
});
