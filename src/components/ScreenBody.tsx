import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

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
  return <View style={[styles.base, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    height: '80%',
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
