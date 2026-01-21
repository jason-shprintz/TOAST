import { NoteSortOrder } from '../stores/SettingsStore';

export interface SortableNote {
  id: string;
  title?: string;
  createdAt: number;
}

/**
 * Sorts an array of notes based on the specified sort order.
 *
 * @param notes - Array of notes to sort
 * @param sortOrder - The sort order to apply
 * @returns A new sorted array of notes
 */
export function sortNotes<T extends SortableNote>(
  notes: T[],
  sortOrder: NoteSortOrder,
): T[] {
  const sorted = [...notes];

  switch (sortOrder) {
    case 'newest-oldest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'oldest-newest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'a-z':
      return sorted.sort((a, b) => {
        const titleA = (a.title || '(Untitled)').toLowerCase();
        const titleB = (b.title || '(Untitled)').toLowerCase();
        return titleA.localeCompare(titleB);
      });
    case 'z-a':
      return sorted.sort((a, b) => {
        const titleA = (a.title || '(Untitled)').toLowerCase();
        const titleB = (b.title || '(Untitled)').toLowerCase();
        return titleB.localeCompare(titleA);
      });
    default:
      return sorted;
  }
}
