import { StyleSheet } from 'react-native';
import { ColorScheme } from '../../theme/colors';

/**
 * Creates styles for the DigitalWhistleScreen component.
 * @param COLORS - Theme colors from useTheme hook
 * @returns StyleSheet for the DigitalWhistleScreen
 */
export const createStyles = (COLORS: ColorScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      paddingHorizontal: 14,
      paddingTop: 10,
    },
    whistleSection: {
      marginBottom: 30,
    },
    whistleTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: COLORS.PRIMARY_DARK,
      marginBottom: 12,
      textAlign: 'center',
    },
    whistleDescription: {
      fontSize: 14,
      color: COLORS.PRIMARY_DARK,
      marginBottom: 16,
      textAlign: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    button: {
      flex: 1,
      backgroundColor: COLORS.ACCENT,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    buttonActive: {
      backgroundColor: COLORS.TOAST_BROWN,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.PRIMARY_DARK,
    },
    separator: {
      height: 2,
      backgroundColor: COLORS.TOAST_BROWN,
      marginVertical: 20,
      opacity: 0.3,
    },
    note: {
      fontSize: 12,
      color: COLORS.PRIMARY_DARK,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 20,
      paddingHorizontal: 20,
    },
  });
