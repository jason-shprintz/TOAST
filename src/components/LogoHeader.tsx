import React from 'react';
import { Image, StyleSheet, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';
import { COLORS } from '../theme';

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
  shadowStyle?: Partial<ViewStyle>;
};

/**
 * Renders the Toast logo as a circular image with customizable size and style.
 *
 * @param size - The diameter of the logo in pixels. Defaults to 120.
 * @param style - Optional additional styles to apply to the logo image.
 * @param shadowStyle - Optional shadow styles to apply dynamic shadows (e.g., sun shadow).
 * @returns A React element displaying the Toast logo.
 */
export default function LogoHeader({ size = 120, style, shadowStyle }: Props) {
  const containerStyle: StyleProp<ViewStyle> = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    shadowStyle,
  ];

  const imageStyle: StyleProp<ImageStyle> = [
    styles.base,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    style,
  ];

  return (
    <View style={containerStyle}>
      <Image
        source={require('../../assets/toast-logo.png')}
        style={imageStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    resizeMode: 'contain',
    marginBottom: 10,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
  },
});
