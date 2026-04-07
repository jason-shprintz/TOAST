import React from 'react';
import AppButton from '../../../components/AppButton';
import { inventoryFormStyles as styles } from '../../Inventory/inventoryFormStyles';

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
  return (
    <AppButton
      label={label}
      onPress={onPress}
      variant="destructive"
      icon="trash-outline"
      style={styles.deleteButtonContainer}
    />
  );
}
