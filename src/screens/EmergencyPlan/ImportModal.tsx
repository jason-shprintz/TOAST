import React, { useState } from 'react';
import { Modal, StyleSheet, TextInput, View } from 'react-native';
import AppButton from '../../components/AppButton';
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
            <AppButton
              label="Cancel"
              onPress={handleClose}
              variant="secondary"
              style={styles.buttonFlex}
            />
            <AppButton
              label="Import"
              onPress={handleImport}
              disabled={!text.trim()}
              style={styles.buttonFlex}
            />
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
  buttonFlex: {
    flex: 1,
  },
});
