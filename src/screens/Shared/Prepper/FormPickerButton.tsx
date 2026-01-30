import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Text } from '../../../components/ScaledText';
import { useTheme } from '../../../hooks/useTheme';
import { inventoryFormStyles as styles } from '../../Inventory/inventoryFormStyles';

interface FormPickerButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
}

/**
 * Themed picker button for inventory forms (used for month/year selection).
 */
export function FormPickerButton({
  label,
  ...touchableProps
}: FormPickerButtonProps): React.JSX.Element {
  const COLORS = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.pickerButton,
        {
          backgroundColor: COLORS.PRIMARY_LIGHT,
          borderColor: COLORS.SECONDARY_ACCENT,
        },
      ]}
      {...touchableProps}
    >
      <Text style={[styles.pickerText, { color: COLORS.PRIMARY_DARK }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
