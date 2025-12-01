import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { COLORS } from '../theme';

type Props = TextProps & { title?: string };

export default function SectionHeader({
  title,
  children,
  style,
  ...rest
}: Props) {
  return (
    <Text {...rest} style={[styles.header, style]}>
      {title ?? children}
    </Text>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.PRIMARY_DARK,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 50,
    width: '80%',
    textAlign: 'center',
    alignSelf: 'center',
  },
});
