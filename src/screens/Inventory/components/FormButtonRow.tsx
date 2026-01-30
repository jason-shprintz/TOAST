import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../../components/ScaledText';
import { useTheme } from '../../../hooks/useTheme';
import { inventoryFormStyles as styles } from '../inventoryFormStyles';

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
  const COLORS = useTheme();

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={[
          styles.cancelButton,
          {
            backgroundColor: COLORS.PRIMARY_LIGHT,
            borderColor: COLORS.PRIMARY_DARK,
          },
        ]}
        onPress={onCancel}
        accessibilityLabel={cancelLabel}
        accessibilityRole="button"
      >
        <Text style={[styles.cancelButtonText, { color: COLORS.PRIMARY_DARK }]}>
          {cancelLabel}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: COLORS.PRIMARY_DARK },
          saveDisabled && styles.disabledButton,
        ]}
        onPress={onSave}
        disabled={saveDisabled}
        accessibilityLabel={saveLabel}
        accessibilityRole="button"
      >
        <Text style={[styles.saveButtonText, { color: COLORS.PRIMARY_LIGHT }]}>
          {saveLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
