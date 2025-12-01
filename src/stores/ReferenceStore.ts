import { makeAutoObservable } from 'mobx';

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

  addReference(reference: Omit<ReferenceItem, 'id' | 'bookmarked'>) {
    this.references.push({
      ...reference,
      id: Date.now().toString(),
      bookmarked: false,
    });
  }

  toggleBookmark(referenceId: string) {
    const reference = this.references.find(r => r.id === referenceId);
    if (reference) {
      reference.bookmarked = !reference.bookmarked;
    }
  }

  setSearchQuery(query: string) {
    this.searchQuery = query;
  }

  get bookmarkedReferences() {
    return this.references.filter(ref => ref.bookmarked);
  }

  get filteredReferences() {
    if (!this.searchQuery) return this.references;

    return this.references.filter(
      ref =>
        ref.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ref.content.toLowerCase().includes(this.searchQuery.toLowerCase()),
    );
  }
}
