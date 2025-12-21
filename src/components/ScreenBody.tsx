import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
};

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
