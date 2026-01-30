import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Text } from '../../../components/ScaledText';
import { useTheme } from '../../../hooks/useTheme';
import { inventoryFormStyles as styles } from '../inventoryFormStyles';

interface DeleteButtonProps {
  onPress: () => void;
  label?: string;
}

/**
 * Delete button for inventory item forms.
 */
export function DeleteButton({
  onPress,
  label = 'Delete Item',
}: DeleteButtonProps): React.JSX.Element {
  const COLORS = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.deleteButton,
        { backgroundColor: COLORS.ERROR || '#d32f2f' },
      ]}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={[styles.deleteButtonText, { color: COLORS.PRIMARY_LIGHT }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
