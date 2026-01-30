import { makeAutoObservable, runInAction, computed } from 'mobx';
import { SQLiteDatabase } from '../types/database-types';

let SQLite: any;
try {
  SQLite = require('react-native-sqlite-storage');
} catch {
  SQLite = null as any;
}

/**
 * Represents a single pantry item (food item).
 */
export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string; // e.g., "pieces", "lbs", "gallons"
  notes?: string;
  expirationMonth?: number; // 1-12
  expirationYear?: number; // e.g., 2024, 2025
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/**
 * Store for managing pantry items and categories.
 * Follows the same pattern as InventoryStore but for food items.
 */
export class PantryStore {
  pantryDb: SQLiteDatabase | null = null;
  items: PantryItem[] = [];
  categories: string[] = [];

  constructor() {
    makeAutoObservable(
      this,
      {
        itemsByCategory: computed,
      },
      { autoBind: true },
    );
  }

  /**
   * Generates a unique ID using timestamp and random string.
   * This avoids the need for crypto.getRandomValues() which isn't available in React Native.
   * @private
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Computed property that groups items by category.
   */
  get itemsByCategory(): Record<string, PantryItem[]> {
    const grouped: Record<string, PantryItem[]> = {};

    // Initialize all categories with empty arrays
    for (const category of this.categories) {
      grouped[category] = [];
    }

    // Group items by category
    for (const item of this.items) {
      if (grouped[item.category]) {
        grouped[item.category].push(item);
      }
    }

    return grouped;
  }

  /**
   * Gets all items sorted alphabetically by name.
   */
  get allItemsSorted(): PantryItem[] {
    return [...this.items].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }

  /**
   * Gets the count of items in a specific category.
   */
  getCategoryItemCount(categoryName: string): number {
    return this.items.filter((item) => item.category === categoryName).length;
  }

  /**
   * Initializes the database connection and loads data.
   */
  async initDatabase(): Promise<void> {
    if (!SQLite) {
      console.warn('SQLite not available, using in-memory storage');
      await this.loadDefaultCategories();
      return;
    }

    try {
      this.pantryDb = await SQLite.openDatabase({
        name: 'toast.db',
        location: 'default',
      });
      await this.createTables();
      await this.loadCategories();
      await this.loadItems();
    } catch (error) {
      console.error('Failed to initialize pantry database:', error);
    }
  }

  /**
   * Creates the necessary database tables for pantry.
   */
  private async createTables(): Promise<void> {
    if (!this.pantryDb) return;

    try {
      await this.pantryDb.executeSql(
        'CREATE TABLE IF NOT EXISTS pantry_categories (' +
          'name TEXT PRIMARY KEY, ' +
          'createdAt INTEGER NOT NULL' +
          ')',
      );

      await this.pantryDb.executeSql(
        'CREATE TABLE IF NOT EXISTS pantry_items (' +
          'id TEXT PRIMARY KEY, ' +
          'name TEXT NOT NULL, ' +
          'category TEXT NOT NULL, ' +
          'quantity REAL NOT NULL, ' +
          'unit TEXT, ' +
          'notes TEXT, ' +
          'expirationMonth INTEGER, ' +
          'expirationYear INTEGER, ' +
          'createdAt INTEGER NOT NULL, ' +
          'updatedAt INTEGER NOT NULL' +
          ')',
      );

      await this.migrateDatabase();
    } catch (error) {
      console.error('Failed to create pantry tables:', error);
    }
  }

  /**
   * Migrates existing database schema to support new columns.
   */
  private async migrateDatabase(): Promise<void> {
    if (!this.pantryDb) return;

    try {
      const [results] = await this.pantryDb.executeSql(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='pantry_items'",
      );

      if (results.rows.length > 0) {
        const tableSchema = results.rows.item(0).sql as string;

        if (!tableSchema.includes('expirationMonth')) {
          await this.pantryDb.executeSql(
            'ALTER TABLE pantry_items ADD COLUMN expirationMonth INTEGER',
          );
        }

        if (!tableSchema.includes('expirationYear')) {
          await this.pantryDb.executeSql(
            'ALTER TABLE pantry_items ADD COLUMN expirationYear INTEGER',
          );
        }
      }
    } catch (error) {
      console.log('Database migration completed or not needed', error);
    }
  }

  /**
   * Loads categories from the database.
   */
  private async loadCategories(): Promise<void> {
    if (!this.pantryDb) {
      await this.loadDefaultCategories();
      return;
    }

    try {
      const [results] = await this.pantryDb.executeSql(
        'SELECT * FROM pantry_categories ORDER BY createdAt ASC',
      );

      if (results && results.rows && results.rows.length > 0) {
        const loadedCategories: string[] = [];
        for (let i = 0; i < results.rows.length; i++) {
          const row = results.rows.item(i);
          loadedCategories.push(row.name);
        }
        runInAction(() => {
          this.categories = loadedCategories;
        });
      }

      // If no categories exist, create defaults
      if (this.categories.length === 0) {
        await this.createDefaultCategories();
      }
    } catch (error) {
      console.error('Failed to load pantry categories:', error);
      await this.loadDefaultCategories();
    }
  }

  /**
   * Loads default categories into memory without database.
   */
  private async loadDefaultCategories(): Promise<void> {
    runInAction(() => {
      this.categories = ['Canned Goods', 'Dry Goods', 'Frozen', 'Fresh'];
    });
  }

  /**
   * Creates default categories in the database.
   */
  private async createDefaultCategories(): Promise<void> {
    const defaultCategories = ['Canned Goods', 'Dry Goods', 'Frozen', 'Fresh'];
    for (const category of defaultCategories) {
      await this.addCategory(category);
    }
    // Add default items
    await this.createDefaultItems();
  }

  /**
   * Creates default pantry items for the default categories.
   */
  private async createDefaultItems(): Promise<void> {
    // Default items for Canned Goods
    const cannedGoodsItems = [
      { name: 'Canned Beans', quantity: 10, unit: 'cans' },
      { name: 'Canned Soup', quantity: 8, unit: 'cans' },
      { name: 'Canned Vegetables', quantity: 12, unit: 'cans' },
      { name: 'Canned Fruit', quantity: 6, unit: 'cans' },
    ];

    // Default items for Dry Goods
    const dryGoodsItems = [
      { name: 'Rice', quantity: 5, unit: 'lbs' },
      { name: 'Pasta', quantity: 10, unit: 'boxes' },
      { name: 'Flour', quantity: 3, unit: 'lbs' },
      { name: 'Sugar', quantity: 2, unit: 'lbs' },
    ];

    // Default items for Frozen
    const frozenItems = [
      { name: 'Frozen Vegetables', quantity: 5, unit: 'bags' },
      { name: 'Frozen Meat', quantity: 3, unit: 'lbs' },
    ];

    // Default items for Fresh
    const freshItems = [
      { name: 'Potatoes', quantity: 5, unit: 'lbs' },
      { name: 'Onions', quantity: 3, unit: 'lbs' },
    ];

    try {
      for (const item of cannedGoodsItems) {
        await this.createItem(
          item.name,
          'Canned Goods',
          item.quantity,
          item.unit,
          undefined,
        );
      }

      for (const item of dryGoodsItems) {
        await this.createItem(
          item.name,
          'Dry Goods',
          item.quantity,
          item.unit,
          undefined,
        );
      }

      for (const item of frozenItems) {
        await this.createItem(
          item.name,
          'Frozen',
          item.quantity,
          item.unit,
          undefined,
        );
      }

      for (const item of freshItems) {
        await this.createItem(
          item.name,
          'Fresh',
          item.quantity,
          item.unit,
          undefined,
        );
      }
    } catch (error) {
      console.error('Failed to create default items:', error);
    }
  }

  /**
   * Loads all pantry items from the database.
   */
  private async loadItems(): Promise<void> {
    if (!this.pantryDb) return;

    try {
      const [results] = await this.pantryDb.executeSql(
        'SELECT * FROM pantry_items ORDER BY name ASC',
      );

      if (results && results.rows && results.rows.length > 0) {
        const loadedItems: PantryItem[] = [];
        for (let i = 0; i < results.rows.length; i++) {
          const row = results.rows.item(i);
          loadedItems.push({
            id: row.id,
            name: row.name,
            category: row.category,
            quantity: row.quantity,
            unit: row.unit || undefined,
            notes: row.notes || undefined,
            expirationMonth: row.expirationMonth || undefined,
            expirationYear: row.expirationYear || undefined,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          });
        }
        runInAction(() => {
          this.items = loadedItems;
        });
      } else {
        // If no items exist and we have default categories, create default items
        if (this.categories.length > 0) {
          await this.createDefaultItems();
        }
      }
    } catch (error) {
      console.error('Failed to load pantry items:', error);
    }
  }

  /**
   * Adds a new category.
   */
  async addCategory(name: string): Promise<void> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Category name cannot be empty');
    }
    if (this.categories.includes(trimmedName)) {
      throw new Error('Category already exists');
    }

    const createdAt = Date.now();

    if (!this.pantryDb) {
      runInAction(() => {
        this.categories.push(trimmedName);
      });
      return;
    }

    try {
      await this.pantryDb.executeSql(
        'INSERT INTO pantry_categories (name, createdAt) VALUES (?, ?)',
        [trimmedName, createdAt],
      );
      runInAction(() => {
        this.categories.push(trimmedName);
      });
    } catch (error) {
      console.error('Failed to add pantry category:', error);
      throw new Error('Failed to add category');
    }
  }

  /**
   * Deletes a category and optionally moves items to a fallback category.
   */
  async deleteCategory(name: string, fallbackCategory?: string): Promise<void> {
    if (this.categories.length <= 1) {
      throw new Error('Cannot delete the last category');
    }

    if (!this.categories.includes(name)) {
      throw new Error('Category does not exist');
    }

    const itemsInCategory = this.items.filter((item) => item.category === name);

    // If there are items, we need a fallback category
    if (itemsInCategory.length > 0) {
      if (!fallbackCategory) {
        throw new Error('Fallback category required when category has items');
      }
      if (!this.categories.includes(fallbackCategory)) {
        throw new Error('Fallback category does not exist');
      }

      // Move items to fallback category
      for (const item of itemsInCategory) {
        await this.updateItem(item.id, { category: fallbackCategory });
      }
    }

    // Delete the category
    if (this.pantryDb) {
      try {
        await this.pantryDb.executeSql(
          'DELETE FROM pantry_categories WHERE name = ?',
          [name],
        );
      } catch (error) {
        console.error('Failed to delete pantry category:', error);
        throw new Error('Failed to delete category');
      }
    }

    runInAction(() => {
      this.categories = this.categories.filter((c) => c !== name);
    });
  }

  /**
   * Creates a new pantry item.
   */
  async createItem(
    name: string,
    category: string,
    quantity: number,
    unit?: string,
    notes?: string,
    expirationMonth?: number,
    expirationYear?: number,
  ): Promise<PantryItem> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Item name cannot be empty');
    }
    if (!this.categories.includes(category)) {
      throw new Error('Invalid category');
    }
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    if (
      expirationMonth !== undefined &&
      (expirationMonth < 1 || expirationMonth > 12)
    ) {
      throw new Error('Expiration month must be between 1 and 12');
    }
    if (expirationYear !== undefined) {
      const currentYear = new Date().getFullYear();
      if (expirationYear < currentYear || expirationYear > currentYear + 50) {
        throw new Error('Expiration year must be valid');
      }
    }

    const now = Date.now();
    const item: PantryItem = {
      id: this.generateId(),
      name: trimmedName,
      category,
      quantity,
      unit: unit?.trim() || undefined,
      notes: notes?.trim() || undefined,
      expirationMonth,
      expirationYear,
      createdAt: now,
      updatedAt: now,
    };

    if (this.pantryDb) {
      try {
        await this.pantryDb.executeSql(
          'INSERT INTO pantry_items (id, name, category, quantity, unit, notes, expirationMonth, expirationYear, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            item.id,
            item.name,
            item.category,
            item.quantity,
            item.unit || null,
            item.notes || null,
            item.expirationMonth || null,
            item.expirationYear || null,
            item.createdAt,
            item.updatedAt,
          ],
        );
      } catch (error) {
        console.error('Failed to create pantry item:', error);
        throw new Error('Failed to create item');
      }
    }

    runInAction(() => {
      this.items.push(item);
    });

    return item;
  }

  /**
   * Updates an existing pantry item.
   */
  async updateItem(
    id: string,
    updates: Partial<Omit<PantryItem, 'id' | 'createdAt'>>,
  ): Promise<void> {
    const item = this.items.find((i) => i.id === id);
    if (!item) {
      throw new Error('Item not found');
    }

    if (updates.category && !this.categories.includes(updates.category)) {
      throw new Error('Invalid category');
    }
    if (updates.quantity !== undefined && updates.quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    if (
      updates.expirationMonth !== undefined &&
      (updates.expirationMonth < 1 || updates.expirationMonth > 12)
    ) {
      throw new Error('Expiration month must be between 1 and 12');
    }
    if (updates.expirationYear !== undefined) {
      const currentYear = new Date().getFullYear();
      if (
        updates.expirationYear < currentYear ||
        updates.expirationYear > currentYear + 50
      ) {
        throw new Error('Expiration year must be valid');
      }
    }

    const updatedItem: PantryItem = {
      ...item,
      ...updates,
      updatedAt: Date.now(),
    };

    if (this.pantryDb) {
      try {
        await this.pantryDb.executeSql(
          'UPDATE pantry_items SET name = ?, category = ?, quantity = ?, unit = ?, notes = ?, expirationMonth = ?, expirationYear = ?, updatedAt = ? WHERE id = ?',
          [
            updatedItem.name,
            updatedItem.category,
            updatedItem.quantity,
            updatedItem.unit || null,
            updatedItem.notes || null,
            updatedItem.expirationMonth || null,
            updatedItem.expirationYear || null,
            updatedItem.updatedAt,
            id,
          ],
        );
      } catch (error) {
        console.error('Failed to update pantry item:', error);
        throw new Error('Failed to update item');
      }
    }

    runInAction(() => {
      const index = this.items.findIndex((i) => i.id === id);
      if (index !== -1) {
        this.items[index] = updatedItem;
      }
    });
  }

  /**
   * Deletes a pantry item.
   */
  async deleteItem(id: string): Promise<void> {
    const item = this.items.find((i) => i.id === id);
    if (!item) {
      throw new Error('Item not found');
    }

    if (this.pantryDb) {
      try {
        await this.pantryDb.executeSql(
          'DELETE FROM pantry_items WHERE id = ?',
          [id],
        );
      } catch (error) {
        console.error('Failed to delete pantry item:', error);
        throw new Error('Failed to delete item');
      }
    }

    runInAction(() => {
      this.items = this.items.filter((i) => i.id !== id);
    });
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    // Cleanup if needed
  }
}
