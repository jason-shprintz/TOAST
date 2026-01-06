import { observer } from 'mobx-react-lite';
import React from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Text as RNText,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../stores';
import { COLORS } from '../theme';
import { FontSize, ThemeMode } from '../stores/SettingsStore';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Settings modal component that overlays on top of the app.
 * Allows users to configure font size and theme mode.
 * Settings are automatically persisted when changed.
 * 
 * Note: Uses React Native's Text directly to avoid scaling issues in the settings UI.
 */
export const SettingsModal = observer(
  ({ visible, onClose }: SettingsModalProps) => {
    const settingsStore = useSettingsStore();

    const fontSizeOptions: { value: FontSize; label: string }[] = [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ];

    const themeModeOptions: { value: ThemeMode; label: string }[] = [
      { value: 'light', label: 'Light Mode' },
      { value: 'dark', label: 'Dark Mode' },
      { value: 'system', label: 'System' },
    ];

    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <RNText style={styles.headerText}>Settings</RNText>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityLabel="Close settings"
                accessibilityRole="button"
              >
                <Ionicons
                  name="close-outline"
                  size={28}
                  color={COLORS.PRIMARY_DARK}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              {/* Font Size Section */}
              <View style={styles.section}>
                <RNText style={styles.sectionTitle}>Font Size</RNText>
                <View style={styles.optionsContainer}>
                  {fontSizeOptions.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        settingsStore.fontSize === option.value &&
                          styles.optionButtonSelected,
                      ]}
                      onPress={() => settingsStore.setFontSize(option.value)}
                      accessibilityLabel={`Set font size to ${option.label}`}
                      accessibilityRole="button"
                    >
                      <RNText
                        style={[
                          styles.optionText,
                          settingsStore.fontSize === option.value &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </RNText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Theme Mode Section */}
              <View style={styles.section}>
                <RNText style={styles.sectionTitle}>Theme</RNText>
                <RNText style={styles.placeholderNote}>
                  (Placeholder - not yet implemented)
                </RNText>
                <View style={styles.optionsContainer}>
                  {themeModeOptions.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        settingsStore.themeMode === option.value &&
                          styles.optionButtonSelected,
                      ]}
                      onPress={() => settingsStore.setThemeMode(option.value)}
                      accessibilityLabel={`Set theme to ${option.label}`}
                      accessibilityRole="button"
                    >
                      <RNText
                        style={[
                          styles.optionText,
                          settingsStore.themeMode === option.value &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </RNText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 500,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.TOAST_BROWN,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.TOAST_BROWN,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.PRIMARY_DARK,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 8,
  },
  placeholderNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.PRIMARY_DARK,
    opacity: 0.6,
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
    backgroundColor: COLORS.BACKGROUND,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.TOAST_BROWN,
    borderColor: COLORS.PRIMARY_DARK,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    textAlign: 'center',
  },
  optionTextSelected: {
    fontWeight: '800',
  },
});
