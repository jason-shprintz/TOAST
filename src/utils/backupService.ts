/**
 * Backup and restore service for TOAST app data.
 * Supports exporting all user data to a JSON file and restoring from a backup.
 */

import { Platform, Share } from 'react-native';
import RNFS from 'react-native-fs';
import type { Checklist, ChecklistItem, Note } from '../stores/CoreStore';
import type { InventoryItem } from '../stores/InventoryStore';
import type { PantryItem } from '../stores/PantryStore';
import type { BookmarkItem } from '../stores/BookmarksStore';

export const BACKUP_VERSION = '1.0';
export const BACKUP_FILE_PREFIX = 'toast-backup-';

export type RestoreMode = 'replace' | 'merge';

export interface BackupSettings {
  fontSize: string;
  themeMode: string;
  noteSortOrder: string;
}

/**
 * Full backup data structure stored in the JSON file.
 */
export interface BackupData {
  version: string;
  backupDate: string;
  createdAt: number;
  data: {
    notes: Note[];
    noteCategories: string[];
    checklists: Checklist[];
    checklistItems: ChecklistItem[];
    inventoryItems: InventoryItem[];
    inventoryCategories: string[];
    pantryItems: PantryItem[];
    pantryCategories: string[];
    bookmarks: BookmarkItem[];
    settings: BackupSettings;
  };
}

/**
 * Human-readable summary shown to the user before restoring a backup.
 */
export interface BackupPreview {
  backupDate: string;
  createdAt: number;
  pantryItemCount: number;
  inventoryItemCount: number;
  noteCount: number;
  checklistCount: number;
  bookmarkCount: number;
}

/**
 * Creates a backup data object from the provided store data.
 */
export function createBackupData(
  notes: Note[],
  noteCategories: string[],
  checklists: Checklist[],
  checklistItems: ChecklistItem[],
  inventoryItems: InventoryItem[],
  inventoryCategories: string[],
  pantryItems: PantryItem[],
  pantryCategories: string[],
  bookmarks: BookmarkItem[],
  settings: BackupSettings,
): BackupData {
  const now = new Date();
  const backupDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return {
    version: BACKUP_VERSION,
    backupDate,
    createdAt: now.getTime(),
    data: {
      notes,
      noteCategories,
      checklists,
      checklistItems,
      inventoryItems,
      inventoryCategories,
      pantryItems,
      pantryCategories,
      bookmarks,
      settings,
    },
  };
}

/**
 * Validates the structure of a parsed backup JSON object.
 * Returns true only if the object matches the expected BackupData shape.
 */
export function validateBackup(json: any): json is BackupData {
  if (!json || typeof json !== 'object') {
    return false;
  }
  if (typeof json.version !== 'string') {
    return false;
  }
  if (typeof json.backupDate !== 'string') {
    return false;
  }
  if (typeof json.createdAt !== 'number') {
    return false;
  }
  if (!json.data || typeof json.data !== 'object') {
    return false;
  }
  const d = json.data;
  if (!Array.isArray(d.notes)) {
    return false;
  }
  if (!Array.isArray(d.noteCategories)) {
    return false;
  }
  if (!Array.isArray(d.checklists)) {
    return false;
  }
  if (!Array.isArray(d.checklistItems)) {
    return false;
  }
  if (!Array.isArray(d.inventoryItems)) {
    return false;
  }
  if (!Array.isArray(d.inventoryCategories)) {
    return false;
  }
  if (!Array.isArray(d.pantryItems)) {
    return false;
  }
  if (!Array.isArray(d.pantryCategories)) {
    return false;
  }
  if (!Array.isArray(d.bookmarks)) {
    return false;
  }
  if (!d.settings || typeof d.settings !== 'object') {
    return false;
  }
  return true;
}

/**
 * Creates a human-readable preview of a backup's contents.
 */
export function createBackupPreview(backupData: BackupData): BackupPreview {
  return {
    backupDate: backupData.backupDate,
    createdAt: backupData.createdAt,
    pantryItemCount: backupData.data.pantryItems.length,
    inventoryItemCount: backupData.data.inventoryItems.length,
    noteCount: backupData.data.notes.length,
    checklistCount: backupData.data.checklists.length,
    bookmarkCount: backupData.data.bookmarks.length,
  };
}

/**
 * Returns the platform-specific directory path where backup files are stored.
 * iOS: Documents directory (accessible via Files app)
 * Android: Downloads directory
 */
export function getBackupDirectory(): string {
  return Platform.OS === 'ios'
    ? RNFS.DocumentDirectoryPath
    : RNFS.DownloadDirectoryPath;
}

/**
 * Lists available backup files found in the backup directory,
 * sorted with the most recent first.
 */
export async function listBackupFiles(): Promise<
  { name: string; path: string }[]
> {
  try {
    const dirPath = getBackupDirectory();
    const files = await RNFS.readDir(dirPath);
    return files
      .filter(
        (f) =>
          f.name.startsWith(BACKUP_FILE_PREFIX) &&
          f.name.endsWith('.json') &&
          !f.isDirectory(),
      )
      .map((f) => ({ name: f.name, path: f.path }))
      .sort((a, b) => b.name.localeCompare(a.name));
  } catch {
    return [];
  }
}

/**
 * Reads and parses a backup file from the given path.
 * Returns null if the file cannot be read or fails validation.
 */
export async function readBackupFile(
  filePath: string,
): Promise<BackupData | null> {
  try {
    const content = await RNFS.readFile(filePath, 'utf8');
    const json = JSON.parse(content);
    if (!validateBackup(json)) {
      return null;
    }
    return json as BackupData;
  } catch {
    return null;
  }
}

/**
 * Exports a backup by writing it to a temporary file and opening
 * the native share sheet so the user can save it to Files, email it, etc.
 */
export async function exportBackup(backupData: BackupData): Promise<void> {
  const filename = `${BACKUP_FILE_PREFIX}${backupData.backupDate}.json`;
  const destPath = `${RNFS.CachesDirectoryPath}/${filename}`;
  const json = JSON.stringify(backupData, null, 2);
  await RNFS.writeFile(destPath, json, 'utf8');
  if (Platform.OS === 'ios') {
    await Share.share({ url: `file://${destPath}`, title: filename });
  } else {
    await Share.share({ message: json, title: filename });
  }
}
