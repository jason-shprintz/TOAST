/**
 * @format
 */

import {
  BACKUP_VERSION,
  BackupData,
  createBackupData,
  createBackupPreview,
  validateBackup,
} from '../src/utils/backupService';

const SAMPLE_BACKUP: BackupData = {
  version: BACKUP_VERSION,
  backupDate: '2026-03-03',
  createdAt: 1741046400000,
  data: {
    notes: [
      {
        id: 'note-1',
        createdAt: 1741000000000,
        category: 'General',
        type: 'text',
        title: 'Test Note',
        text: 'Hello',
        photoUris: [],
      },
    ],
    noteCategories: ['General', 'Work'],
    checklists: [
      {
        id: 'cl-1',
        name: 'Bug-out bag',
        createdAt: 1740000000000,
        isDefault: true,
      },
    ],
    checklistItems: [
      {
        id: 'cli-1',
        checklistId: 'cl-1',
        text: 'Water',
        checked: false,
        order: 0,
      },
    ],
    inventoryItems: [
      {
        id: 'inv-1',
        name: 'Flashlight',
        category: 'Tools',
        quantity: 2,
        createdAt: 1740000000000,
        updatedAt: 1740000000000,
      },
    ],
    inventoryCategories: ['Tools', 'Food'],
    pantryItems: [
      {
        id: 'pan-1',
        name: 'Rice',
        category: 'Grains',
        quantity: 5,
        unit: 'lbs',
        createdAt: 1740000000000,
        updatedAt: 1740000000000,
      },
    ],
    pantryCategories: ['Grains', 'Canned'],
    bookmarks: [
      {
        id: 'bm-1',
        title: 'First Aid',
        category: 'Health',
        createdAt: 1740000000000,
      },
    ],
    settings: {
      fontSize: 'medium',
      themeMode: 'dark',
      noteSortOrder: 'newest-oldest',
    },
  },
};

describe('BackupService', () => {
  describe('validateBackup', () => {
    it('should return true for a valid backup object', () => {
      expect(validateBackup(SAMPLE_BACKUP)).toBe(true);
    });

    it('should return false for null', () => {
      expect(validateBackup(null)).toBe(false);
    });

    it('should return false for a non-object value', () => {
      expect(validateBackup('string')).toBe(false);
      expect(validateBackup(42)).toBe(false);
      expect(validateBackup([])).toBe(false);
    });

    it('should return false when version is missing', () => {
      const noVersion = { ...(SAMPLE_BACKUP as any) };
      delete noVersion.version;
      expect(validateBackup(noVersion)).toBe(false);
    });

    it('should return false when version does not match BACKUP_VERSION', () => {
      const bad = { ...SAMPLE_BACKUP, version: '2.0' };
      expect(validateBackup(bad)).toBe(false);
    });

    it('should return false when backupDate is missing', () => {
      const bad = { ...SAMPLE_BACKUP, backupDate: undefined };
      expect(validateBackup(bad)).toBe(false);
    });

    it('should return false when createdAt is not a number', () => {
      const bad = { ...SAMPLE_BACKUP, createdAt: '2026-03-03' };
      expect(validateBackup(bad)).toBe(false);
    });

    it('should return false when data is missing', () => {
      const noData = { ...(SAMPLE_BACKUP as any) };
      delete noData.data;
      expect(validateBackup(noData)).toBe(false);
    });

    it('should return false when notes array is missing', () => {
      const bad = {
        ...SAMPLE_BACKUP,
        data: { ...SAMPLE_BACKUP.data, notes: undefined },
      };
      expect(validateBackup(bad)).toBe(false);
    });

    it('should return false when inventoryItems is not an array', () => {
      const bad = {
        ...SAMPLE_BACKUP,
        data: { ...SAMPLE_BACKUP.data, inventoryItems: null },
      };
      expect(validateBackup(bad)).toBe(false);
    });

    it('should return false when settings is missing', () => {
      const bad = {
        ...SAMPLE_BACKUP,
        data: { ...SAMPLE_BACKUP.data, settings: undefined },
      };
      expect(validateBackup(bad)).toBe(false);
    });
  });

  describe('createBackupPreview', () => {
    it('should return correct item counts', () => {
      const preview = createBackupPreview(SAMPLE_BACKUP);
      expect(preview.backupDate).toBe('2026-03-03');
      expect(preview.createdAt).toBe(1741046400000);
      expect(preview.noteCount).toBe(1);
      expect(preview.checklistCount).toBe(1);
      expect(preview.inventoryItemCount).toBe(1);
      expect(preview.pantryItemCount).toBe(1);
      expect(preview.bookmarkCount).toBe(1);
    });

    it('should return zero counts for empty data', () => {
      const emptyBackup: BackupData = {
        ...SAMPLE_BACKUP,
        data: {
          ...SAMPLE_BACKUP.data,
          notes: [],
          checklists: [],
          checklistItems: [],
          inventoryItems: [],
          pantryItems: [],
          bookmarks: [],
        },
      };
      const preview = createBackupPreview(emptyBackup);
      expect(preview.noteCount).toBe(0);
      expect(preview.checklistCount).toBe(0);
      expect(preview.inventoryItemCount).toBe(0);
      expect(preview.pantryItemCount).toBe(0);
      expect(preview.bookmarkCount).toBe(0);
    });
  });

  describe('createBackupData', () => {
    it('should produce a valid backup object', () => {
      const backup = createBackupData(
        SAMPLE_BACKUP.data.notes,
        SAMPLE_BACKUP.data.noteCategories,
        SAMPLE_BACKUP.data.checklists,
        SAMPLE_BACKUP.data.checklistItems,
        SAMPLE_BACKUP.data.inventoryItems,
        SAMPLE_BACKUP.data.inventoryCategories,
        SAMPLE_BACKUP.data.pantryItems,
        SAMPLE_BACKUP.data.pantryCategories,
        SAMPLE_BACKUP.data.bookmarks,
        SAMPLE_BACKUP.data.settings,
      );

      expect(validateBackup(backup)).toBe(true);
      expect(backup.version).toBe(BACKUP_VERSION);
      expect(typeof backup.backupDate).toBe('string');
      expect(backup.backupDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof backup.createdAt).toBe('number');
    });

    it('should include all provided data', () => {
      const backup = createBackupData(
        SAMPLE_BACKUP.data.notes,
        SAMPLE_BACKUP.data.noteCategories,
        SAMPLE_BACKUP.data.checklists,
        SAMPLE_BACKUP.data.checklistItems,
        SAMPLE_BACKUP.data.inventoryItems,
        SAMPLE_BACKUP.data.inventoryCategories,
        SAMPLE_BACKUP.data.pantryItems,
        SAMPLE_BACKUP.data.pantryCategories,
        SAMPLE_BACKUP.data.bookmarks,
        SAMPLE_BACKUP.data.settings,
      );

      expect(backup.data.notes).toHaveLength(1);
      expect(backup.data.noteCategories).toEqual(['General', 'Work']);
      expect(backup.data.inventoryItems).toHaveLength(1);
      expect(backup.data.pantryItems).toHaveLength(1);
      expect(backup.data.bookmarks).toHaveLength(1);
      expect(backup.data.settings.fontSize).toBe('medium');
    });
  });
});
