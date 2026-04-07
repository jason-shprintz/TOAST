import React from 'react';
import { View } from 'react-native';
import AppButton from '../../../components/AppButton';
import { inventoryFormStyles as styles } from '../../Inventory/inventoryFormStyles';

interface FormButtonRowProps {
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}

/**
 * Cancel/Save button row for inventory forms.
 */
export function FormButtonRow({
  onCancel,
  onSave,
  saveDisabled = false,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
}: FormButtonRowProps): React.JSX.Element {
  return (
    <View style={styles.buttonContainer}>
      <AppButton
        label={cancelLabel}
        onPress={onCancel}
        variant="secondary"
        style={styles.buttonFlex}
      />
      <AppButton
        label={saveLabel}
        onPress={onSave}
        disabled={saveDisabled}
        style={styles.buttonFlex}
      />
    </View>
  );
}
