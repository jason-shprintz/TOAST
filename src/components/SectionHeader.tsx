import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, TextProps, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { LIGHT_COLORS } from '../theme/colors';
import { HorizontalRule } from './HorizontalRule';
import { Text } from './ScaledText';

type Props = TextProps & {
  title?: string;
  isShowHr?: boolean;
  enableSearch?: boolean;
};

type SectionHeaderNavigationProp = NativeStackNavigationProp<{
  Search: undefined;
  RagAssistant: undefined;
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
  const COLORS = useTheme();

  const handleSearchPress = () => {
    navigation.navigate('Search');
  };

  const handleRagPress = () => {
    navigation.navigate('RagAssistant');
  };

  const header = (
    <Text
      {...rest}
      style={[
        styles.header,
        {
          color: LIGHT_COLORS.PRIMARY_DARK,
          backgroundColor: COLORS.SECONDARY_ACCENT,
          borderColor: COLORS.TOAST_BROWN,
        },
        style,
      ]}
    >
      {title ?? children}
    </Text>
  );

  return (
    <>
      {enableSearch ? (
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleSearchPress}
            activeOpacity={0.7}
            style={styles.searchBar}
            accessibilityRole="button"
            accessibilityLabel="Search"
            accessibilityHint="Double tap to open search screen"
          >
            {header}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRagPress}
            activeOpacity={0.7}
            style={[
              styles.ragButton,
              {
                backgroundColor: COLORS.SECONDARY_ACCENT,
                borderColor: COLORS.TOAST_BROWN,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Reference Assistant"
            accessibilityHint="Double tap to ask the reference assistant a question"
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color={COLORS.PRIMARY_DARK}
            />
          </TouchableOpacity>
        </View>
      ) : (
        header
      )}
      {isShowHr && <HorizontalRule />}
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    gap: 8,
  },
  header: {
    fontSize: 20,
    fontWeight: '800',
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
    textAlign: 'center',
    alignSelf: 'center',
    marginVertical: 12,
  },
  searchBar: {
    flex: 1,
  },
  ragButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
