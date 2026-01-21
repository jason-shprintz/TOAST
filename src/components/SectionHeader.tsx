import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, TextProps, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme';
import { HorizontalRule } from './HorizontalRule';
import { Text } from './ScaledText';

type Props = TextProps & {
  title?: string;
  isShowHr?: boolean;
  enableSearch?: boolean;
};

type SectionHeaderNavigationProp = NativeStackNavigationProp<{
  Search: undefined;
}>;

/**
 * Renders a section header using a `Text` component.
 *
 * Displays either the provided `title` prop or the `children` as the header content.
 * Additional styles can be applied via the `style` prop, and other props are spread onto the `Text` component.
 *
 * @param title - The text to display as the section header. If not provided, `children` will be used.
 * @param children - Alternative content to display if `title` is not specified.
 * @param style - Custom styles to apply to the header.
 * @param isShowHr - Whether to show the horizontal rule below the header. Default is true.
 * @param enableSearch - Whether clicking the header opens the search screen. Default is true.
 * @param rest - Additional props to pass to the `Text` component.
 */
export default function SectionHeader({
  title,
  children,
  style,
  isShowHr = true,
  enableSearch = true,
  ...rest
}: Props) {
  const navigation = useNavigation<SectionHeaderNavigationProp>();

  const handlePress = () => {
    navigation.navigate('Search');
  };

  const header = (
    <Text {...rest} style={[styles.header, style]}>
      {title ?? children}
    </Text>
  );

  return (
    <>
      {enableSearch ? (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          style={styles.searchBar}
          accessibilityRole="button"
          accessibilityLabel="Search"
          accessibilityHint="Double tap to open search screen"
        >
          {header}
        </TouchableOpacity>
      ) : (
        header
      )}
      {isShowHr && <HorizontalRule />}
    </>
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
    width: '100%',
    textAlign: 'center',
    alignSelf: 'center',
    marginVertical: 12,
  },
  searchBar: {
    width: '80%',
    alignSelf: 'center',
  },
});
