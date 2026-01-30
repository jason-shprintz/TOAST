import { makeAutoObservable, runInAction, computed } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { SQLiteDatabase } from '../types/database-types';

let SQLite: any;
try {
  SQLite = require('react-native-sqlite-storage');
} catch {
  SQLite = null as any;
}

/**
 * Represents a single inventory item.
 */
export interface InventoryItem {
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
 * Store for managing inventory items and categories.
 * Follows the same pattern as CoreStore for notes.
 */
export class InventoryStore {
  inventoryDb: SQLiteDatabase | null = null;
  items: InventoryItem[] = [];
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
   * Computed property that groups items by category.
   */
  get itemsByCategory(): Record<string, InventoryItem[]> {
    const grouped: Record<string, InventoryItem[]> = {};

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
  get allItemsSorted(): InventoryItem[] {
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
      this.inventoryDb = await SQLite.openDatabase({
        name: 'toast.db',
        location: 'default',
      });
      await this.createTables();
      await this.loadCategories();
      await this.loadItems();
    } catch (error) {
      console.error('Failed to initialize inventory database:', error);
    }
  }

  /**
   * Creates the necessary database tables for inventory.
   */
  private async createTables(): Promise<void> {
    if (!this.inventoryDb) return;

    try {
      await this.inventoryDb.executeSql(
        'CREATE TABLE IF NOT EXISTS inventory_categories (' +
          'name TEXT PRIMARY KEY, ' +
          'createdAt INTEGER NOT NULL' +
          ')',
      );

      await this.inventoryDb.executeSql(
        'CREATE TABLE IF NOT EXISTS inventory_items (' +
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
      console.error('Failed to create inventory tables:', error);
    }
  }

  /**
   * Migrates existing database schema to support new columns.
   */
  private async migrateDatabase(): Promise<void> {
    if (!this.inventoryDb) return;

    try {
      const [results] = await this.inventoryDb.executeSql(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='inventory_items'",
      );

      if (results.rows.length > 0) {
        const tableSchema = results.rows.item(0).sql as string;
        
        if (!tableSchema.includes('expirationMonth')) {
          await this.inventoryDb.executeSql(
            'ALTER TABLE inventory_items ADD COLUMN expirationMonth INTEGER',
          );
        }
        
        if (!tableSchema.includes('expirationYear')) {
          await this.inventoryDb.executeSql(
            'ALTER TABLE inventory_items ADD COLUMN expirationYear INTEGER',
          );
        }
      }
    } catch (error) {
      console.log('Database migration completed or not needed');
    }
  }

  /**
   * Loads categories from the database.
   */
  private async loadCategories(): Promise<void> {
    if (!this.inventoryDb) {
      await this.loadDefaultCategories();
      return;
    }

    try {
      const [results] = await this.inventoryDb.executeSql(
        'SELECT * FROM inventory_categories ORDER BY createdAt ASC',
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
      console.error('Failed to load inventory categories:', error);
      await this.loadDefaultCategories();
    }
  }

  /**
   * Loads default categories into memory without database.
   */
  private async loadDefaultCategories(): Promise<void> {
    runInAction(() => {
      this.categories = ['Home Base', 'Main Vehicle'];
    });
  }

  /**
   * Creates default categories in the database.
   */
  private async createDefaultCategories(): Promise<void> {
    const defaultCategories = ['Home Base', 'Main Vehicle'];
    for (const category of defaultCategories) {
      await this.addCategory(category);
    }
    // Add default items
    await this.createDefaultItems();
  }

  /**
   * Creates default inventory items for the default categories.
   */
  private async createDefaultItems(): Promise<void> {
    // Default items for Home Base
    const homeBaseItems = [
      { name: 'Water (gallons)', quantity: 10, unit: 'gallons' },
      { name: 'Canned Food', quantity: 20, unit: 'cans' },
      { name: 'Batteries (AA)', quantity: 24, unit: 'pieces' },
      { name: 'First Aid Kit', quantity: 1, unit: 'kit' },
      { name: 'Flashlight', quantity: 3, unit: 'pieces' },
    ];

    // Default items for Main Vehicle
    const mainVehicleItems = [
      { name: 'Emergency Road Kit', quantity: 1, unit: 'kit' },
      { name: 'Jumper Cables', quantity: 1, unit: 'set' },
      { name: 'Spare Tire', quantity: 1, unit: 'piece' },
      { name: 'Water Bottles', quantity: 6, unit: 'bottles' },
      { name: 'Blanket', quantity: 2, unit: 'pieces' },
    ];

    try {
      for (const item of homeBaseItems) {
        await this.createItem(
          item.name,
          'Home Base',
          item.quantity,
          item.unit,
          undefined,
        );
      }

      for (const item of mainVehicleItems) {
        await this.createItem(
          item.name,
          'Main Vehicle',
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
   * Loads all inventory items from the database.
   */
  private async loadItems(): Promise<void> {
    if (!this.inventoryDb) return;

    try {
      const [results] = await this.inventoryDb.executeSql(
        'SELECT * FROM inventory_items ORDER BY name ASC',
      );

      if (results && results.rows && results.rows.length > 0) {
        const loadedItems: InventoryItem[] = [];
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
        if (
          this.categories.includes('Home Base') &&
          this.categories.includes('Main Vehicle')
        ) {
          await this.createDefaultItems();
        }
      }
    } catch (error) {
      console.error('Failed to load inventory items:', error);
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

    if (!this.inventoryDb) {
      runInAction(() => {
        this.categories.push(trimmedName);
      });
      return;
    }

    try {
      await this.inventoryDb.executeSql(
        'INSERT INTO inventory_categories (name, createdAt) VALUES (?, ?)',
        [trimmedName, createdAt],
      );
      runInAction(() => {
        this.categories.push(trimmedName);
      });
    } catch (error) {
      console.error('Failed to add inventory category:', error);
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
    if (this.inventoryDb) {
      try {
        await this.inventoryDb.executeSql(
          'DELETE FROM inventory_categories WHERE name = ?',
          [name],
        );
      } catch (error) {
        console.error('Failed to delete inventory category:', error);
        throw new Error('Failed to delete category');
      }
    }

    runInAction(() => {
      this.categories = this.categories.filter((c) => c !== name);
    });
  }

  /**
   * Creates a new inventory item.
   */
  async createItem(
    name: string,
    category: string,
    quantity: number,
    unit?: string,
    notes?: string,
    expirationMonth?: number,
    expirationYear?: number,
  ): Promise<InventoryItem> {
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

    const now = Date.now();
    const item: InventoryItem = {
      id: uuidv4(),
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

    if (this.inventoryDb) {
      try {
        await this.inventoryDb.executeSql(
          'INSERT INTO inventory_items (id, name, category, quantity, unit, notes, expirationMonth, expirationYear, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        console.error('Failed to create inventory item:', error);
        throw new Error('Failed to create item');
      }
    }

    runInAction(() => {
      this.items.push(item);
    });

    return item;
  }

  /**
   * Updates an existing inventory item.
   */
  async updateItem(
    id: string,
    updates: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>,
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

    const updatedItem: InventoryItem = {
      ...item,
      ...updates,
      updatedAt: Date.now(),
    };

    if (this.inventoryDb) {
      try {
        await this.inventoryDb.executeSql(
          'UPDATE inventory_items SET name = ?, category = ?, quantity = ?, unit = ?, notes = ?, expirationMonth = ?, expirationYear = ?, updatedAt = ? WHERE id = ?',
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
        console.error('Failed to update inventory item:', error);
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
   * Deletes an inventory item.
   */
  async deleteItem(id: string): Promise<void> {
    const item = this.items.find((i) => i.id === id);
    if (!item) {
      throw new Error('Item not found');
    }

    if (this.inventoryDb) {
      try {
        await this.inventoryDb.executeSql(
          'DELETE FROM inventory_items WHERE id = ?',
          [id],
        );
      } catch (error) {
        console.error('Failed to delete inventory item:', error);
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
