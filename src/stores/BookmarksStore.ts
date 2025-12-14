// SQLite-backed bookmarks
export type BookmarkItem = {
  id: string;
  title: string;
  category?: string;
  createdAt?: number;
};

let SQLite: any;
try {
  SQLite = require('react-native-sqlite-storage');
} catch {
  SQLite = null as any;
}

let db: any | null = null;

async function initDb(): Promise<void> {
  if (db || !SQLite) return;
  try {
    SQLite.enablePromise?.(true);
    db = await SQLite.openDatabase({ name: 'toast.db', location: 'default' });
    await db.executeSql(
      'CREATE TABLE IF NOT EXISTS bookmarks (' +
        'id TEXT PRIMARY KEY NOT NULL,' +
        'title TEXT NOT NULL,' +
        'category TEXT,' +
        'createdAt INTEGER NOT NULL' +
        ')',
    );
  } catch (e) {
    console.error('Failed to init bookmarks db', e);
    db = null;
  }
}

export async function getBookmarks(): Promise<BookmarkItem[]> {
  await initDb();
  if (!db) return [];
  const res = await db.executeSql(
    'SELECT id, title, category, createdAt FROM bookmarks ORDER BY createdAt DESC',
  );
  const rows = res[0].rows;
  const list: BookmarkItem[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows.item(i);
    list.push({
      id: r.id,
      title: r.title,
      category: r.category ?? undefined,
      createdAt: r.createdAt,
    });
  }
  return list;
}

export async function isBookmarked(id: string): Promise<boolean> {
  await initDb();
  if (!db) return false;
  const res = await db.executeSql('SELECT id FROM bookmarks WHERE id = ?', [
    id,
  ]);
  return res[0].rows.length > 0;
}

export async function addBookmark(item: BookmarkItem): Promise<void> {
  await initDb();
  if (!db) return;
  const now = Date.now();
  await db.executeSql(
    'INSERT OR IGNORE INTO bookmarks (id, title, category, createdAt) VALUES (?, ?, ?, ?)',
    [item.id, item.title, item.category ?? null, item.createdAt ?? now],
  );
}

export async function removeBookmark(id: string): Promise<void> {
  await initDb();
  if (!db) return;
  await db.executeSql('DELETE FROM bookmarks WHERE id = ?', [id]);
}
