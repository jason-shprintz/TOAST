import { makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';

export interface ReferenceItem {
  id: string;
  title: string;
  category: string;
  content: string;
  bookmarked: boolean;
}

export class ReferenceStore {
  references: ReferenceItem[] = [];

  searchQuery: string = '';

  constructor() {
    makeAutoObservable(this);
  }

  // TODO: Is this needed?
  addReference(reference: Omit<ReferenceItem, 'id' | 'bookmarked'>) {
    this.references.push({
      ...reference,
      id: uuidv4(),
      bookmarked: false,
    });
  }

  // TODO: Is this needed?
  toggleBookmark(referenceId: string) {
    const reference = this.references.find((r) => r.id === referenceId);
    if (reference) {
      reference.bookmarked = !reference.bookmarked;
    }
  }

  // TODO: Implement search filtering in ReferenceStore
  setSearchQuery(query: string) {
    this.searchQuery = query;
  }

  get bookmarkedReferences() {
    return this.references.filter((ref) => ref.bookmarked);
  }

  get filteredReferences() {
    if (!this.searchQuery) return this.references;

    return this.references.filter(
      (ref) =>
        ref.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ref.content.toLowerCase().includes(this.searchQuery.toLowerCase()),
    );
  }
}
