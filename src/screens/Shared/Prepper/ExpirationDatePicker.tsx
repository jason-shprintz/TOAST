import React from 'react';
import { View, Alert } from 'react-native';
import { Text } from '../../../components/ScaledText';
import { useTheme } from '../../../hooks/useTheme';
import { inventoryFormStyles as styles } from '../../Inventory/inventoryFormStyles';
import { FormPickerButton } from './FormPickerButton';

const MONTHS = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

interface ExpirationDatePickerProps {
  month: number | undefined;
  year: number | undefined;
  onMonthChange: (month: number | undefined) => void;
  onYearChange: (year: number | undefined) => void;
}

/**
 * Expiration date picker (month and year) for inventory forms.
 */
export function ExpirationDatePicker({
  month,
  year,
  onMonthChange,
  onYearChange,
}: ExpirationDatePickerProps): React.JSX.Element {
  const COLORS = useTheme();

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 2099 - currentYear + 1 },
    (_, i) => currentYear + i,
  );

  const showMonthPicker = () => {
    const options = ['None', ...MONTHS.map((m) => m.label)];
    Alert.alert('Select Month', '', [
      ...options.map((option, index) => ({
        text: option,
        onPress: () => {
          if (index === 0) {
            onMonthChange(undefined);
          } else {
            onMonthChange(MONTHS[index - 1].value);
          }
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const showYearPicker = () => {
    const options = ['None', ...years.map((y) => y.toString())];
    Alert.alert('Select Year', '', [
      ...options.map((option, index) => ({
        text: option,
        onPress: () => {
          if (index === 0) {
            onYearChange(undefined);
          } else {
            onYearChange(years[index - 1]);
          }
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const getMonthLabel = () => {
    if (!month) return 'Select Month';
    return MONTHS.find((m) => m.value === month)?.label || 'Select Month';
  };

  return (
    <View style={styles.formGroup}>
      <Text style={[styles.label, { color: COLORS.PRIMARY_DARK }]}>
        Expiration Date (optional)
      </Text>
      <View style={styles.row}>
        <FormPickerButton label={getMonthLabel()} onPress={showMonthPicker} />
        <FormPickerButton
          label={year?.toString() || 'Select Year'}
          onPress={showYearPicker}
        />
      </View>
    </View>
  );
}
