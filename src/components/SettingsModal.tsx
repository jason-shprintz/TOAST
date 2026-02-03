import { observer } from 'mobx-react-lite';
import React from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  Text as RNText,
  Switch,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore, useSolarCycleNotificationStore } from '../stores';
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

// No-op handler to prevent backdrop touch from propagating
const preventClose = () => {};

export const SettingsModal = observer(
  ({ visible, onClose }: SettingsModalProps) => {
    const settingsStore = useSettingsStore();
    const solarNotifications = useSolarCycleNotificationStore();
    const COLORS = useTheme();

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
        <TouchableWithoutFeedback
          onPress={onClose}
          accessibilityLabel="Close settings modal"
          accessibilityRole="button"
          accessibilityHint="Tap to dismiss the settings"
        >
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={preventClose}>
              <View
                style={[
                  styles.modalContainer,
                  {
                    backgroundColor: COLORS.PRIMARY_LIGHT,
                    borderColor: COLORS.TOAST_BROWN,
                  },
                ]}
              >
                <View
                  style={[
                    styles.header,
                    {
                      backgroundColor: COLORS.SECONDARY_ACCENT,
                      borderBottomColor: COLORS.TOAST_BROWN,
                    },
                  ]}
                >
                  <RNText
                    style={[styles.headerText, { color: COLORS.PRIMARY_DARK }]}
                  >
                    Settings
                  </RNText>
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
                    <RNText
                      style={[
                        styles.sectionTitle,
                        { color: COLORS.PRIMARY_DARK },
                      ]}
                    >
                      Font Size
                    </RNText>
                    <View style={styles.optionsContainer}>
                      {fontSizeOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.optionButton,
                            {
                              borderColor: COLORS.TOAST_BROWN,
                              backgroundColor: COLORS.BACKGROUND,
                            },
                            settingsStore.fontSize === option.value && {
                              backgroundColor: COLORS.TOAST_BROWN,
                              borderColor: COLORS.PRIMARY_DARK,
                            },
                          ]}
                          onPress={() =>
                            settingsStore.setFontSize(option.value)
                          }
                          accessibilityLabel={`Set font size to ${option.label}`}
                          accessibilityRole="button"
                        >
                          <RNText
                            style={[
                              styles.optionText,
                              { color: COLORS.PRIMARY_DARK },
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
                    <RNText
                      style={[
                        styles.sectionTitle,
                        { color: COLORS.PRIMARY_DARK },
                      ]}
                    >
                      Theme
                    </RNText>
                    <View style={styles.optionsContainer}>
                      {themeModeOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.optionButton,
                            {
                              borderColor: COLORS.TOAST_BROWN,
                              backgroundColor: COLORS.BACKGROUND,
                            },
                            settingsStore.themeMode === option.value && {
                              backgroundColor: COLORS.TOAST_BROWN,
                              borderColor: COLORS.PRIMARY_DARK,
                            },
                          ]}
                          onPress={() =>
                            settingsStore.setThemeMode(option.value)
                          }
                          accessibilityLabel={`Set theme to ${option.label}`}
                          accessibilityRole="button"
                        >
                          <RNText
                            style={[
                              styles.optionText,
                              { color: COLORS.PRIMARY_DARK },
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

                  {/* Solar Cycle Notifications Section */}
                  <View style={styles.section}>
                    <RNText
                      style={[
                        styles.sectionTitle,
                        { color: COLORS.PRIMARY_DARK },
                      ]}
                    >
                      Solar Cycle Notifications
                    </RNText>

                    {/* Enable/Disable Toggle */}
                    <View style={styles.toggleRow}>
                      <RNText
                        style={[
                          styles.toggleLabel,
                          { color: COLORS.PRIMARY_DARK },
                        ]}
                      >
                        Enable Notifications
                      </RNText>
                      <Switch
                        value={solarNotifications.enabled}
                        onValueChange={(value) =>
                          solarNotifications.setEnabled(value)
                        }
                        trackColor={{
                          false: COLORS.BACKGROUND,
                          true: COLORS.TOAST_BROWN,
                        }}
                        thumbColor={COLORS.PRIMARY_LIGHT}
                      />
                    </View>

                    {solarNotifications.enabled && (
                      <>
                        {/* Sunrise Toggle */}
                        <View style={styles.toggleRow}>
                          <RNText
                            style={[
                              styles.toggleLabel,
                              { color: COLORS.PRIMARY_DARK },
                            ]}
                          >
                            Sunrise Notifications
                          </RNText>
                          <Switch
                            value={solarNotifications.sunriseEnabled}
                            onValueChange={(value) =>
                              solarNotifications.setSunriseEnabled(value)
                            }
                            trackColor={{
                              false: COLORS.BACKGROUND,
                              true: COLORS.TOAST_BROWN,
                            }}
                            thumbColor={COLORS.PRIMARY_LIGHT}
                          />
                        </View>

                        {/* Sunset Toggle */}
                        <View style={styles.toggleRow}>
                          <RNText
                            style={[
                              styles.toggleLabel,
                              { color: COLORS.PRIMARY_DARK },
                            ]}
                          >
                            Sunset Notifications
                          </RNText>
                          <Switch
                            value={solarNotifications.sunsetEnabled}
                            onValueChange={(value) =>
                              solarNotifications.setSunsetEnabled(value)
                            }
                            trackColor={{
                              false: COLORS.BACKGROUND,
                              true: COLORS.TOAST_BROWN,
                            }}
                            thumbColor={COLORS.PRIMARY_LIGHT}
                          />
                        </View>

                        {/* Buffer Time Input */}
                        <View style={styles.inputRow}>
                          <RNText
                            style={[
                              styles.toggleLabel,
                              { color: COLORS.PRIMARY_DARK },
                            ]}
                          >
                            Notify Before (minutes)
                          </RNText>
                          <TextInput
                            style={[
                              styles.input,
                              {
                                color: COLORS.PRIMARY_DARK,
                                borderColor: COLORS.TOAST_BROWN,
                                backgroundColor: COLORS.BACKGROUND,
                              },
                            ]}
                            value={solarNotifications.bufferMinutes.toString()}
                            onChangeText={(text) => {
                              // Handle empty string by keeping current value
                              if (text === '') {
                                return;
                              }
                              const value = parseInt(text, 10);
                              if (!isNaN(value)) {
                                solarNotifications.setBufferMinutes(value);
                              }
                            }}
                            keyboardType="number-pad"
                            maxLength={2}
                          />
                        </View>

                        <RNText
                          style={[
                            styles.helperText,
                            { color: COLORS.PRIMARY_DARK },
                          ]}
                        >
                          Receive notifications{' '}
                          {solarNotifications.bufferMinutes} minutes before
                          sunrise/sunset
                        </RNText>
                      </>
                    )}
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    borderRadius: 16,
    borderWidth: 3,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '800',
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
    marginBottom: 8,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionTextSelected: {
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  input: {
    width: 60,
    height: 40,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 8,
    opacity: 0.7,
  },
});
