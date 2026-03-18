import { StyleSheet, View } from 'react-native';
import { COLORS, SPACING } from '../theme';

/**
 * Renders a simple horizontal divider for separating content sections.
 *
 * @remarks
 * This component currently returns a single `View` styled via `styles.horizontalLine`.
 *
 * @returns A React element representing the horizontal rule.
 */
export function HorizontalRule() {
  return <View style={styles.horizontalLine} />;
}

const styles = StyleSheet.create({
  horizontalLine: {
    height: 1,
    backgroundColor: COLORS.TOAST_BROWN,
    opacity: 0.3,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
});
