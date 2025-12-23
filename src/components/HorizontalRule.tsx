import { StyleSheet, View } from 'react-native';
import { COLORS } from '../theme';

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
    width: '100%',
    backgroundColor: COLORS.SECONDARY_ACCENT,
    height: 2,
    alignItems: 'center',
  },
});
