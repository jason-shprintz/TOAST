import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { SPACING } from '../theme';
import { LIGHT_COLORS } from '../theme/colors';
import { HorizontalRule } from './HorizontalRule';
import MarqueeText from './MarqueeText';

type Props = {
  title?: string;
  children?: React.ReactNode;
  /** Custom styles applied to the header container (border, background, etc.). */
  style?: StyleProp<ViewStyle>;
  isShowHr?: boolean;
  enableSearch?: boolean;
};

type SectionHeaderNavigationProp = NativeStackNavigationProp<{
  Search: undefined;
}>;

/**
 * Renders a section header with optional search shortcut.
 *
 * When the title fits within the available width it is displayed centred.
 * When the title is too long it scrolls horizontally like a ticker via
 * `MarqueeText`, looping continuously until the component unmounts.
 * While scrolling, the left padding is removed so the text starts from the
 * container edge; the right padding is preserved to avoid crowding the icon.
 *
 * @param title - Text to display. If omitted, `children` is used instead.
 * @param children - Fallback content when `title` is not provided.
 * @param style - Custom styles for the header container.
 * @param isShowHr - Whether to render the horizontal rule below. Default true.
 * @param enableSearch - Whether tapping opens the search screen. Default true.
 */
export default function SectionHeader({
  title,
  children,
  style,
  isShowHr = true,
  enableSearch = true,
}: Props) {
  const navigation = useNavigation<SectionHeaderNavigationProp>();
  const COLORS = useTheme();
  const [isScrolling, setIsScrolling] = useState(false);

  const handlePress = () => {
    navigation.navigate('Search');
  };

  const header = (
    <View
      style={[
        styles.headerContainer,
        // Padding depends on both overflow state and whether search is active.
        isScrolling
          ? enableSearch
            ? styles.headerScrollingWithSearch
            : styles.headerScrollingNoSearch
          : enableSearch && styles.headerWithSearch,
        {
          backgroundColor: COLORS.SECONDARY_ACCENT,
          borderColor: COLORS.TOAST_BROWN,
        },
        style,
      ]}
    >
      <MarqueeText
        style={[styles.headerText, { color: LIGHT_COLORS.PRIMARY_DARK }]}
        onOverflowChange={setIsScrolling}
      >
        {title ?? children}
      </MarqueeText>
    </View>
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
          <View style={styles.headerRow}>
            {header}
            <Ionicons
              name="search-outline"
              size={16}
              color={LIGHT_COLORS.PRIMARY_DARK}
              style={styles.searchIcon}
              accessible={false}
            />
          </View>
        </TouchableOpacity>
      ) : (
        header
      )}
      {isShowHr && <HorizontalRule />}
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    width: '100%',
    alignSelf: 'center',
    marginVertical: SPACING.md,
  },
  /** Non-scrolling with search icon: wider horizontal padding to clear the icon. */
  headerWithSearch: {
    paddingHorizontal: 40,
  },
  /** Scrolling with search icon: no left padding so text starts at the edge;
   *  right padding clears the search icon. */
  headerScrollingWithSearch: {
    paddingLeft: 0,
    paddingRight: 40,
  },
  /** Scrolling without search icon: no left padding, standard right padding. */
  headerScrollingNoSearch: {
    paddingLeft: 0,
    paddingRight: SPACING.md,
  },
  headerText: {
    fontSize: 20,
    fontFamily: 'Bitter-Bold',
  },
  searchBar: {
    width: '80%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    right: SPACING.md,
    opacity: 0.6,
  },
});
