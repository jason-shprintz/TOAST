import { StyleSheet, View } from 'react-native';
import { COLORS } from '../theme';

/**
 * Renders a simple horizontal divider for separating content sections.
 *
 * @remarks
 * This component currently returns a single `View` styled via `styles.ScreenContainer`.
 *
 * @returns A React element representing the horizontal rule.
 */
export function HorizontalRule() {
  return <View style={styles.ScreenContainer} />;
}

const styles = StyleSheet.create({
  ScreenContainer: {
    width: '100%',
    backgroundColor: COLORS.SECONDARY_ACCENT,
    paddingTop: 2,
    marginVertical: 2,
    alignItems: 'center',
  },
});
