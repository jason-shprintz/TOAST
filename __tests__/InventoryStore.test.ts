/**
 * @format
 * Tests for InventoryStore functionality
 */

jest.mock('react-native-sqlite-storage', () => {
  const mockExecuteSql = jest.fn(() =>
    Promise.resolve([{ rows: { length: 0, item: () => null, raw: () => [] } }]),
  );

  return {
    openDatabase: jest.fn(() =>
      Promise.resolve({
        executeSql: mockExecuteSql,
      }),
    ),
  };
});

import { InventoryStore } from '../src/stores/InventoryStore';

describe('InventoryStore', () => {
  let store: InventoryStore;

  beforeEach(() => {
    store = new InventoryStore();
  });

  afterEach(() => {
    store.dispose();
  });

  describe('Category Management', () => {
    it('should initialize with empty categories', () => {
      expect(store.categories).toEqual([]);
    });

    it('should load default categories', async () => {
      await store.initDatabase();
      expect(store.categories).toEqual(['Home Base', 'Main Vehicle']);
    });

    it('should add a new category', async () => {
      await store.initDatabase();
      await store.addCategory('Bug Out Bag');
      expect(store.categories).toContain('Bug Out Bag');
    });

    it('should not add duplicate category', async () => {
      await store.initDatabase();
      await store.addCategory('Test Category');
      await expect(store.addCategory('Test Category')).rejects.toThrow(
        'Category already exists',
      );
    });

    it('should not add empty category', async () => {
      await store.initDatabase();
      await expect(store.addCategory('   ')).rejects.toThrow(
        'Category name cannot be empty',
      );
    });

    it('should delete a category', async () => {
      await store.initDatabase();
      await store.addCategory('Temporary');
      await store.deleteCategory('Temporary');
      expect(store.categories).not.toContain('Temporary');
    });

    it('should not delete last category', async () => {
      await store.initDatabase();
      // Remove all categories except one
      while (store.categories.length > 1) {
        await store.deleteCategory(store.categories[0]);
      }
      await expect(
        store.deleteCategory(store.categories[0]),
      ).rejects.toThrow('Cannot delete the last category');
    });
  });

  describe('Item Management', () => {
    beforeEach(async () => {
      await store.initDatabase();
    });

    it('should start with no items', () => {
      expect(store.items).toEqual([]);
    });

    it('should create a new item', async () => {
      const item = await store.createItem(
        'Flashlight',
        'Home Base',
        2,
        'pieces',
        'LED flashlights',
      );
      expect(item.name).toBe('Flashlight');
      expect(item.quantity).toBe(2);
      expect(item.unit).toBe('pieces');
      expect(item.category).toBe('Home Base');
      expect(store.items).toHaveLength(1);
    });

    it('should not create item with empty name', async () => {
      await expect(
        store.createItem('   ', 'Home Base', 1),
      ).rejects.toThrow('Item name cannot be empty');
    });

    it('should not create item with negative quantity', async () => {
      await expect(
        store.createItem('Test Item', 'Home Base', -1),
      ).rejects.toThrow('Quantity cannot be negative');
    });

    it('should not create item with invalid category', async () => {
      await expect(
        store.createItem('Test Item', 'NonExistent', 1),
      ).rejects.toThrow('Invalid category');
    });

    it('should update an item', async () => {
      const item = await store.createItem('Water', 'Main Vehicle', 10, 'gallons');
      await store.updateItem(item.id, { quantity: 15 });
      expect(store.items[0].quantity).toBe(15);
    });

    it('should delete an item', async () => {
      const item = await store.createItem('Test', 'Home Base', 1);
      await store.deleteItem(item.id);
      expect(store.items).toHaveLength(0);
    });

    it('should not delete non-existent item', async () => {
      await expect(
        store.deleteItem('non-existent-id'),
      ).rejects.toThrow('Item not found');
    });
  });

  describe('Computed Properties', () => {
    beforeEach(async () => {
      await store.initDatabase();
    });

    it('should group items by category', async () => {
      await store.createItem('Item1', 'Home Base', 1);
      await store.createItem('Item2', 'Main Vehicle', 1);
      await store.createItem('Item3', 'Home Base', 1);

      const grouped = store.itemsByCategory;
      expect(grouped['Home Base']).toHaveLength(2);
      expect(grouped['Main Vehicle']).toHaveLength(1);
    });

    it('should return items sorted alphabetically', async () => {
      await store.createItem('Zebra', 'Home Base', 1);
      await store.createItem('Apple', 'Home Base', 1);
      await store.createItem('Monkey', 'Home Base', 1);

      const sorted = store.allItemsSorted;
      expect(sorted[0].name).toBe('Apple');
      expect(sorted[1].name).toBe('Monkey');
      expect(sorted[2].name).toBe('Zebra');
    });

    it('should get category item count', async () => {
      await store.createItem('Item1', 'Home Base', 1);
      await store.createItem('Item2', 'Home Base', 1);
      await store.createItem('Item3', 'Main Vehicle', 1);

      expect(store.getCategoryItemCount('Home Base')).toBe(2);
      expect(store.getCategoryItemCount('Main Vehicle')).toBe(1);
    });
  });

  describe('Category Deletion with Items', () => {
    beforeEach(async () => {
      await store.initDatabase();
    });

    it('should move items to fallback category when deleting category with items', async () => {
      await store.createItem('Item1', 'Home Base', 1);
      await store.createItem('Item2', 'Home Base', 1);

      await store.deleteCategory('Home Base', 'Main Vehicle');

      expect(store.categories).not.toContain('Home Base');
      expect(store.items.every((item) => item.category === 'Main Vehicle')).toBe(true);
    });

    it('should require fallback category when deleting category with items', async () => {
      await store.createItem('Item1', 'Home Base', 1);

      await expect(
        store.deleteCategory('Home Base'),
      ).rejects.toThrow('Fallback category required when category has items');
    });
  });
});
