import { StyleSheet, View } from 'react-native';
import { COLORS } from '../theme';

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
