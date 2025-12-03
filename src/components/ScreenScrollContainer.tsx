import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS } from '../theme';

type Props = {
  style?: StyleProp<ViewStyle>;
};

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
