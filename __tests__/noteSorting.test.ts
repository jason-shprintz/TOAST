/**
 * @format
 */

import { sortNotes } from '../src/utils/noteSorting';

describe('noteSorting', () => {
  const mockNotes = [
    {
      id: '1',
      title: 'Apple Note',
      createdAt: 1000,
    },
    {
      id: '2',
      title: 'Zebra Note',
      createdAt: 2000,
    },
    {
      id: '3',
      title: 'Banana Note',
      createdAt: 3000,
    },
    {
      id: '4',
      title: undefined, // Untitled note
      createdAt: 1500,
    },
  ];

  describe('sortNotes', () => {
    it('should sort by newest-oldest (default)', () => {
      const sorted = sortNotes(mockNotes, 'newest-oldest');
      expect(sorted.map(n => n.id)).toEqual(['3', '2', '4', '1']);
    });

    it('should sort by oldest-newest', () => {
      const sorted = sortNotes(mockNotes, 'oldest-newest');
      expect(sorted.map(n => n.id)).toEqual(['1', '4', '2', '3']);
    });

    it('should sort by a-z', () => {
      const sorted = sortNotes(mockNotes, 'a-z');
      // Untitled notes should come first alphabetically
      expect(sorted.map(n => n.id)).toEqual(['4', '1', '3', '2']);
    });

    it('should sort by z-a', () => {
      const sorted = sortNotes(mockNotes, 'z-a');
      // Untitled notes should come last when sorting Z-A
      expect(sorted.map(n => n.id)).toEqual(['2', '3', '1', '4']);
    });

    it('should handle empty array', () => {
      const sorted = sortNotes([], 'newest-oldest');
      expect(sorted).toEqual([]);
    });

    it('should not mutate original array', () => {
      const original = [...mockNotes];
      sortNotes(mockNotes, 'a-z');
      expect(mockNotes).toEqual(original);
    });

    it('should handle notes with identical titles', () => {
      const duplicateNotes = [
        { id: '1', title: 'Same', createdAt: 1000 },
        { id: '2', title: 'Same', createdAt: 2000 },
      ];
      const sorted = sortNotes(duplicateNotes, 'a-z');
      // Should maintain stable order or use createdAt as tiebreaker
      expect(sorted.length).toBe(2);
      expect(sorted[0].title).toBe('Same');
      expect(sorted[1].title).toBe('Same');
    });

    it('should handle case-insensitive alphabetical sorting', () => {
      const caseNotes = [
        { id: '1', title: 'apple', createdAt: 1000 },
        { id: '2', title: 'Banana', createdAt: 2000 },
        { id: '3', title: 'CHERRY', createdAt: 3000 },
      ];
      const sorted = sortNotes(caseNotes, 'a-z');
      expect(sorted.map(n => n.title)).toEqual(['apple', 'Banana', 'CHERRY']);
    });
  });
});
