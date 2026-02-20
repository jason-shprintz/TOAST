import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../components/ScaledText';
import { useTheme } from '../../hooks/useTheme';

interface ImportModalProps {
  visible: boolean;
  title: string;
  /** Hint shown below the text area */
  hint?: string;
  onClose: () => void;
  /** Called with the raw pasted text when the user confirms the import. */
  onImport: (text: string) => void;
}

/**
 * Reusable modal that accepts pasted share-code text for importing data.
 *
 * Used by RallyPointsScreen and CommunicationPlanScreen to receive data
 * shared from another user via the native share sheet.
 */
export function ImportModal({
  visible,
  title,
  hint,
  onClose,
  onImport,
}: ImportModalProps): React.JSX.Element {
  const COLORS = useTheme();
  const [text, setText] = useState('');

  const handleImport = () => {
    if (!text.trim()) return;
    onImport(text.trim());
    setText('');
  };

  const handleClose = () => {
    setText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: COLORS.BACKGROUND,
              borderColor: COLORS.SECONDARY_ACCENT,
            },
          ]}
        >
          <Text style={[styles.title, { color: COLORS.PRIMARY_DARK }]}>
            {title}
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: COLORS.PRIMARY_LIGHT,
                borderColor: COLORS.SECONDARY_ACCENT,
                color: COLORS.PRIMARY_DARK,
              },
            ]}
            placeholder="Paste shared data here..."
            placeholderTextColor={COLORS.PRIMARY_DARK + '80'}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Paste shared data"
          />

          {hint ? (
            <Text style={[styles.hint, { color: COLORS.PRIMARY_DARK }]}>
              {hint}
            </Text>
          ) : null}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: COLORS.PRIMARY_LIGHT,
                  borderColor: COLORS.PRIMARY_DARK,
                },
              ]}
              onPress={handleClose}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, { color: COLORS.PRIMARY_DARK }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.importButton,
                { backgroundColor: COLORS.PRIMARY_DARK },
                !text.trim() && styles.disabledButton,
              ]}
              onPress={handleImport}
              disabled={!text.trim()}
              accessibilityLabel="Import"
              accessibilityRole="button"
            >
              <Text
                style={[styles.buttonText, { color: COLORS.PRIMARY_LIGHT }]}
              >
                Import
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    opacity: 0.65,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  importButton: {},
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
