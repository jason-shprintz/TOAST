import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS } from '../theme';

type Props = {
  style?: StyleProp<ViewStyle>;
};

/**
 * A container component that wraps its children in a scrollable view.
 * 
 * @param style - Optional styles to apply to the scroll view's content container.
 * @param children - The components or elements to be rendered inside the scrollable container.
 * 
 * @returns A `ScrollView` with the provided children and styles.
 */
export default function ScreenScrollContainer({
  style,
  children,
}: PropsWithChildren<Props>) {
  return (
    <ScrollView contentContainerStyle={[styles.base, style]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: {
    flexGrow: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
});
