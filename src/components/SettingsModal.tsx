import { observer } from 'mobx-react-lite';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  Text as RNText,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import {
  useCoreStore,
  useInventoryStore,
  usePantryStore,
  useSettingsStore,
} from '../stores';
import {
  addBookmark,
  clearBookmarks,
  getBookmarks,
} from '../stores/BookmarksStore';
import { FontSize, ThemeMode } from '../stores/SettingsStore';
import {
  BackupData,
  BackupPreview,
  createBackupData,
  createBackupPreview,
  exportBackup,
  listBackupFiles,
  readBackupFile,
} from '../utils/backupService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Settings modal component that overlays on top of the app.
 * Allows users to configure font size, theme mode, and manage data backups.
 *
 * Note: Uses React Native's Text directly to avoid scaling issues in the settings UI.
 */

// No-op handler to prevent backdrop touch from propagating
const preventClose = () => {};

/** Formats a Unix timestamp (ms) as a locale date-time string. */
function formatBackupDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export const SettingsModal = observer(
  ({ visible, onClose }: SettingsModalProps) => {
    const settingsStore = useSettingsStore();
    const coreStore = useCoreStore();
    const inventoryStore = useInventoryStore();
    const pantryStore = usePantryStore();
    const COLORS = useTheme();

    // Backup UI state
    const [isExporting, setIsExporting] = useState(false);
    const [backupFiles, setBackupFiles] = useState<
      { name: string; path: string }[]
    >([]);
    const [showFileList, setShowFileList] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<BackupData | null>(
      null,
    );
    const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(
      null,
    );
    const [isRestoring, setIsRestoring] = useState(false);

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

    const handleExport = useCallback(async () => {
      setIsExporting(true);
      try {
        const bookmarks = await getBookmarks();
        const backupData = createBackupData(
          coreStore.notes,
          coreStore.categories,
          coreStore.checklists,
          coreStore.checklistItems,
          inventoryStore.items,
          inventoryStore.categories,
          pantryStore.items,
          pantryStore.categories,
          bookmarks,
          {
            fontSize: settingsStore.fontSize,
            themeMode: settingsStore.themeMode,
            noteSortOrder: settingsStore.noteSortOrder,
          },
        );
        await exportBackup(backupData);
        await settingsStore.setLastBackupAt(Date.now());
      } catch (error) {
        Alert.alert(
          'Export Failed',
          'Could not export backup. Please try again.',
        );
        console.error('Export failed:', error);
      } finally {
        setIsExporting(false);
      }
    }, [coreStore, inventoryStore, pantryStore, settingsStore]);

    const handleOpenRestorePanel = useCallback(async () => {
      const files = await listBackupFiles();
      setBackupFiles(files);
      setShowFileList(true);
      setSelectedBackup(null);
      setBackupPreview(null);
    }, []);

    const handleSelectFile = useCallback(async (filePath: string) => {
      const data = await readBackupFile(filePath);
      if (!data) {
        Alert.alert(
          'Invalid File',
          'The selected file is not a valid TOAST backup.',
        );
        return;
      }
      setSelectedBackup(data);
      setBackupPreview(createBackupPreview(data));
    }, []);

    const handleRestore = useCallback(
      async (mode: 'replace' | 'merge') => {
        if (!selectedBackup) {
          return;
        }
        setIsRestoring(true);
        try {
          const { data } = selectedBackup;

          // Restore bookmarks
          if (mode === 'replace') {
            await clearBookmarks();
          }
          for (const bookmark of data.bookmarks) {
            await addBookmark(bookmark);
          }

          // Restore notes and categories
          await coreStore.importNotesData(
            data.noteCategories,
            data.notes,
            mode,
          );

          // Restore checklists
          await coreStore.importChecklistsData(
            data.checklists,
            data.checklistItems,
            mode,
          );

          // Restore inventory
          await inventoryStore.importData(
            data.inventoryCategories,
            data.inventoryItems,
            mode,
          );

          // Restore pantry
          await pantryStore.importData(
            data.pantryCategories,
            data.pantryItems,
            mode,
          );

          // Restore settings (apply to store, but don't overwrite current UI prefs in replace mode)
          if (mode === 'replace' && data.settings) {
            if (data.settings.fontSize) {
              await settingsStore.setFontSize(data.settings.fontSize as any);
            }
            if (data.settings.themeMode) {
              await settingsStore.setThemeMode(data.settings.themeMode as any);
            }
            if (data.settings.noteSortOrder) {
              await settingsStore.setNoteSortOrder(
                data.settings.noteSortOrder as any,
              );
            }
          }

          setShowFileList(false);
          setSelectedBackup(null);
          setBackupPreview(null);
          Alert.alert('Restore Complete', 'Your data has been restored.');
        } catch (error) {
          Alert.alert(
            'Restore Failed',
            'Could not restore backup. Please try again.',
          );
          console.error('Restore failed:', error);
        } finally {
          setIsRestoring(false);
        }
      },
      [selectedBackup, coreStore, inventoryStore, pantryStore, settingsStore],
    );

    const confirmRestore = useCallback(
      (mode: 'replace' | 'merge') => {
        const modeLabel =
          mode === 'replace'
            ? 'replace all existing data'
            : 'merge with existing data';
        Alert.alert('Confirm Restore', `This will ${modeLabel}. Continue?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: () => handleRestore(mode),
          },
        ]);
      },
      [handleRestore],
    );

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

                  {/* Data & Backup Section */}
                  <View style={styles.section}>
                    <RNText
                      style={[
                        styles.sectionTitle,
                        { color: COLORS.PRIMARY_DARK },
                      ]}
                    >
                      Data &amp; Backup
                    </RNText>

                    {/* Last backup timestamp */}
                    <RNText
                      style={[
                        styles.backupStatus,
                        { color: COLORS.PRIMARY_DARK },
                      ]}
                    >
                      {settingsStore.lastBackupAt
                        ? `Last backed up: ${formatBackupDate(settingsStore.lastBackupAt)}`
                        : 'No backup yet'}
                    </RNText>

                    {/* Export Now button */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          borderColor: COLORS.TOAST_BROWN,
                          backgroundColor: COLORS.BACKGROUND,
                        },
                      ]}
                      onPress={handleExport}
                      disabled={isExporting}
                      accessibilityLabel="Export backup now"
                      accessibilityRole="button"
                    >
                      {isExporting ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.PRIMARY_DARK}
                        />
                      ) : (
                        <View style={styles.actionButtonInner}>
                          <Ionicons
                            name="share-outline"
                            size={20}
                            color={COLORS.PRIMARY_DARK}
                          />
                          <RNText
                            style={[
                              styles.actionButtonText,
                              { color: COLORS.PRIMARY_DARK },
                            ]}
                          >
                            Export Now
                          </RNText>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Restore from Backup button */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          borderColor: COLORS.TOAST_BROWN,
                          backgroundColor: COLORS.BACKGROUND,
                        },
                      ]}
                      onPress={handleOpenRestorePanel}
                      accessibilityLabel="Restore from backup"
                      accessibilityRole="button"
                    >
                      <View style={styles.actionButtonInner}>
                        <Ionicons
                          name="cloud-download-outline"
                          size={20}
                          color={COLORS.PRIMARY_DARK}
                        />
                        <RNText
                          style={[
                            styles.actionButtonText,
                            { color: COLORS.PRIMARY_DARK },
                          ]}
                        >
                          Restore from Backup
                        </RNText>
                      </View>
                    </TouchableOpacity>

                    {/* Restore panel — file list */}
                    {showFileList && (
                      <View
                        style={[
                          styles.restorePanel,
                          {
                            borderColor: COLORS.TOAST_BROWN,
                            backgroundColor: COLORS.SECONDARY_ACCENT,
                          },
                        ]}
                      >
                        <View style={styles.restorePanelHeader}>
                          <RNText
                            style={[
                              styles.restorePanelTitle,
                              { color: COLORS.PRIMARY_DARK },
                            ]}
                          >
                            Select a Backup File
                          </RNText>
                          <TouchableOpacity
                            onPress={() => {
                              setShowFileList(false);
                              setSelectedBackup(null);
                              setBackupPreview(null);
                            }}
                            accessibilityLabel="Close restore panel"
                            accessibilityRole="button"
                          >
                            <Ionicons
                              name="close-circle-outline"
                              size={22}
                              color={COLORS.PRIMARY_DARK}
                            />
                          </TouchableOpacity>
                        </View>

                        {backupFiles.length === 0 ? (
                          <RNText
                            style={[
                              styles.noFilesText,
                              { color: COLORS.PRIMARY_DARK },
                            ]}
                          >
                            No backup files found. Export a backup first, then
                            save it to your Documents folder to restore.
                          </RNText>
                        ) : (
                          backupFiles.map((file) => (
                            <TouchableOpacity
                              key={file.path}
                              style={[
                                styles.fileItem,
                                {
                                  borderColor: COLORS.TOAST_BROWN,
                                  backgroundColor:
                                    selectedBackup &&
                                    backupPreview?.backupDate ===
                                      file.name.replace(
                                        /^toast-backup-(.+)\.json$/,
                                        '$1',
                                      )
                                      ? COLORS.TOAST_BROWN
                                      : COLORS.BACKGROUND,
                                },
                              ]}
                              onPress={() => handleSelectFile(file.path)}
                              accessibilityLabel={`Select backup file ${file.name}`}
                              accessibilityRole="button"
                            >
                              <RNText
                                style={[
                                  styles.fileName,
                                  { color: COLORS.PRIMARY_DARK },
                                ]}
                              >
                                {file.name}
                              </RNText>
                            </TouchableOpacity>
                          ))
                        )}

                        {/* Backup preview and restore options */}
                        {backupPreview && (
                          <View style={styles.previewContainer}>
                            <RNText
                              style={[
                                styles.previewTitle,
                                { color: COLORS.PRIMARY_DARK },
                              ]}
                            >
                              Backup from {backupPreview.backupDate}
                            </RNText>
                            <RNText
                              style={[
                                styles.previewText,
                                { color: COLORS.PRIMARY_DARK },
                              ]}
                            >
                              {backupPreview.pantryItemCount} pantry items,{' '}
                              {backupPreview.inventoryItemCount} inventory
                              items, {backupPreview.noteCount} notes,{' '}
                              {backupPreview.checklistCount} checklists,{' '}
                              {backupPreview.bookmarkCount} bookmarks
                            </RNText>
                            <View style={styles.restoreButtons}>
                              <TouchableOpacity
                                style={[
                                  styles.restoreButton,
                                  {
                                    borderColor: COLORS.TOAST_BROWN,
                                    backgroundColor: COLORS.BACKGROUND,
                                  },
                                  isRestoring && styles.restoreButtonDisabled,
                                ]}
                                onPress={() => confirmRestore('replace')}
                                disabled={isRestoring}
                                accessibilityLabel="Replace all data with backup"
                                accessibilityRole="button"
                              >
                                {isRestoring ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={COLORS.PRIMARY_DARK}
                                  />
                                ) : (
                                  <RNText
                                    style={[
                                      styles.restoreButtonText,
                                      { color: COLORS.PRIMARY_DARK },
                                    ]}
                                  >
                                    Replace
                                  </RNText>
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.restoreButton,
                                  {
                                    borderColor: COLORS.TOAST_BROWN,
                                    backgroundColor: COLORS.BACKGROUND,
                                  },
                                  isRestoring && styles.restoreButtonDisabled,
                                ]}
                                onPress={() => confirmRestore('merge')}
                                disabled={isRestoring}
                                accessibilityLabel="Merge backup with existing data"
                                accessibilityRole="button"
                              >
                                {isRestoring ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={COLORS.PRIMARY_DARK}
                                  />
                                ) : (
                                  <RNText
                                    style={[
                                      styles.restoreButtonText,
                                      { color: COLORS.PRIMARY_DARK },
                                    ]}
                                  >
                                    Merge
                                  </RNText>
                                )}
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
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
  backupStatus: {
    fontSize: 13,
    marginBottom: 12,
    opacity: 0.7,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  restorePanel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  restorePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  restorePanelTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  noFilesText: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 18,
  },
  fileItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '500',
  },
  previewContainer: {
    marginTop: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 10,
    lineHeight: 18,
  },
  restoreButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  restoreButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  restoreButtonDisabled: {
    opacity: 0.5,
  },
});
