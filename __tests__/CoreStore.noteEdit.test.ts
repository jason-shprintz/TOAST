/**
 * @format
 */

import { CoreStore } from '../src/stores/CoreStore';

// Mock database for testing
const createMockDatabase = () => {
  const storage: Record<string, any> = {};

  return {
    executeSql: jest.fn((query: string, params?: any[]) => {
      // Handle CREATE TABLE
      if (query.includes('CREATE TABLE')) {
        return Promise.resolve([{ rows: { length: 0 } }]);
      }

      // Handle ALTER TABLE (migrations)
      if (query.includes('ALTER TABLE')) {
        return Promise.resolve([{ rows: { length: 0 } }]);
      }

      // Handle INSERT OR REPLACE for notes
      if (query.includes('INSERT OR REPLACE INTO notes')) {
        // Extract id from params (first parameter)
        if (params && params.length > 0) {
          const id = params[0];
          storage[id] = {
            id: params[0],
            createdAt: params[1],
            latitude: params[2],
            longitude: params[3],
            category: params[4],
            type: params[5],
            title: params[6],
            text: params[7],
            bookmarked: params[8],
            sketchDataUri: params[9],
            photoUris: params[10],
            audioUri: params[11],
            transcription: params[12],
            duration: params[13],
          };
        }
        return Promise.resolve([{ rows: { length: 0 } }]);
      }

      // Handle SELECT for notes
      if (query.includes('SELECT * FROM notes')) {
        const items = Object.values(storage);
        return Promise.resolve([
          {
            rows: {
              length: items.length,
              item: (index: number) => items[index],
            },
          },
        ]);
      }

      // Handle DELETE
      if (query.includes('DELETE FROM notes')) {
        if (params && params.length > 0) {
          const id = params[0];
          delete storage[id];
        }
        return Promise.resolve([{ rows: { length: 0 } }]);
      }

      return Promise.resolve([{ rows: { length: 0 } }]);
    }),
  };
};

describe('CoreStore - Note Editing', () => {
  let coreStore: CoreStore;
  let mockDb: ReturnType<typeof createMockDatabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    coreStore = new CoreStore();
    mockDb = createMockDatabase();
  });

  afterEach(() => {
    coreStore.dispose();
  });

  describe('updateNoteContent', () => {
    it('should update note title', async () => {
      await coreStore.initNotesDb();
      (coreStore as any).notesDb = mockDb;

      // Create a note first
      await coreStore.createNote({
        type: 'text',
        title: 'Original Title',
        text: 'Original text',
        category: 'General',
      });

      const note = coreStore.notes[0];
      expect(note.title).toBe('Original Title');

      // Update the title
      await coreStore.updateNoteContent(note.id, {
        title: 'Updated Title',
      });

      const updatedNote = coreStore.notes.find(n => n.id === note.id);
      expect(updatedNote?.title).toBe('Updated Title');
      expect(updatedNote?.text).toBe('Original text'); // Text should remain unchanged
    });

    it('should update note text', async () => {
      await coreStore.initNotesDb();
      (coreStore as any).notesDb = mockDb;

      // Create a note first
      await coreStore.createNote({
        type: 'text',
        title: 'Title',
        text: 'Original text',
        category: 'General',
      });

      const note = coreStore.notes[0];
      expect(note.text).toBe('Original text');

      // Update the text
      await coreStore.updateNoteContent(note.id, {
        text: 'Updated text',
      });

      const updatedNote = coreStore.notes.find(n => n.id === note.id);
      expect(updatedNote?.text).toBe('Updated text');
      expect(updatedNote?.title).toBe('Title'); // Title should remain unchanged
    });

    it('should update note category', async () => {
      await coreStore.initNotesDb();
      (coreStore as any).notesDb = mockDb;

      // Create a note first
      await coreStore.createNote({
        type: 'text',
        title: 'Title',
        text: 'Text',
        category: 'General',
      });

      const note = coreStore.notes[0];
      expect(note.category).toBe('General');

      // Update the category
      await coreStore.updateNoteContent(note.id, {
        category: 'Work',
      });

      const updatedNote = coreStore.notes.find(n => n.id === note.id);
      expect(updatedNote?.category).toBe('Work');
    });

    it('should update multiple fields at once', async () => {
      await coreStore.initNotesDb();
      (coreStore as any).notesDb = mockDb;

      // Create a note first
      await coreStore.createNote({
        type: 'text',
        title: 'Original Title',
        text: 'Original text',
        category: 'General',
      });

      const note = coreStore.notes[0];

      // Update all fields
      await coreStore.updateNoteContent(note.id, {
        title: 'Updated Title',
        text: 'Updated text',
        category: 'Personal',
      });

      const updatedNote = coreStore.notes.find(n => n.id === note.id);
      expect(updatedNote?.title).toBe('Updated Title');
      expect(updatedNote?.text).toBe('Updated text');
      expect(updatedNote?.category).toBe('Personal');
    });

    it('should persist changes to database', async () => {
      await coreStore.initNotesDb();
      (coreStore as any).notesDb = mockDb;

      // Create a note first
      await coreStore.createNote({
        type: 'text',
        title: 'Title',
        text: 'Text',
        category: 'General',
      });

      const note = coreStore.notes[0];

      // Update the note
      await coreStore.updateNoteContent(note.id, {
        title: 'Updated Title',
        text: 'Updated text',
      });

      // Verify database was called with updated values
      const lastCall =
        mockDb.executeSql.mock.calls[mockDb.executeSql.mock.calls.length - 1];
      expect(lastCall[0]).toContain('INSERT OR REPLACE INTO notes');
      expect(lastCall[1]).toContain('Updated Title');
      expect(lastCall[1]).toContain('Updated text');
    });

    it('should handle non-existent note gracefully', async () => {
      await coreStore.initNotesDb();
      (coreStore as any).notesDb = mockDb;

      // Try to update a note that doesn't exist
      await coreStore.updateNoteContent('non-existent-id', {
        title: 'Updated Title',
      });

      // Should not throw error, just do nothing
      expect(coreStore.notes).toHaveLength(0);
    });

    it('should handle partial updates', async () => {
      await coreStore.initNotesDb();
      (coreStore as any).notesDb = mockDb;

      // Create a note first
      await coreStore.createNote({
        type: 'text',
        title: 'Original Title',
        text: 'Original text',
        category: 'General',
      });

      const note = coreStore.notes[0];

      // Update only title, leaving text and category unchanged
      await coreStore.updateNoteContent(note.id, {
        title: 'New Title',
      });

      const updatedNote = coreStore.notes.find(n => n.id === note.id);
      expect(updatedNote?.title).toBe('New Title');
      expect(updatedNote?.text).toBe('Original text');
      expect(updatedNote?.category).toBe('General');
    });
  });
});
