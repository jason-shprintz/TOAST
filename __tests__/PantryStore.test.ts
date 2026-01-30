/**
 * @format
 * Tests for PantryStore functionality
 */

jest.mock('react-native-sqlite-storage', () => {
  // Return null to force in-memory storage mode (no default items created)
  return null;
});

// Silence the expected "SQLite not available" warning in tests
jest.spyOn(console, 'warn').mockImplementation(() => {});

import { PantryStore } from '../src/stores/PantryStore';

describe('PantryStore', () => {
  let store: PantryStore;

  beforeEach(() => {
    store = new PantryStore();
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
      expect(store.categories).toEqual([
        'Canned Goods',
        'Dry Goods',
        'Frozen',
        'Fresh',
      ]);
    });

    it('should add a new category', async () => {
      await store.initDatabase();
      await store.addCategory('Beverages');
      expect(store.categories).toContain('Beverages');
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
      await expect(store.deleteCategory(store.categories[0])).rejects.toThrow(
        'Cannot delete the last category',
      );
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
        'Canned Beans',
        'Canned Goods',
        10,
        'cans',
        'Black beans',
      );
      expect(item.name).toBe('Canned Beans');
      expect(item.quantity).toBe(10);
      expect(item.unit).toBe('cans');
      expect(item.category).toBe('Canned Goods');
      expect(store.items).toHaveLength(1);
    });

    it('should not create item with empty name', async () => {
      await expect(store.createItem('   ', 'Canned Goods', 1)).rejects.toThrow(
        'Item name cannot be empty',
      );
    });

    it('should not create item with negative quantity', async () => {
      await expect(
        store.createItem('Test Item', 'Canned Goods', -1),
      ).rejects.toThrow('Quantity cannot be negative');
    });

    it('should not create item with invalid category', async () => {
      await expect(
        store.createItem('Test Item', 'NonExistent', 1),
      ).rejects.toThrow('Invalid category');
    });

    it('should update an item', async () => {
      const item = await store.createItem('Rice', 'Dry Goods', 5, 'lbs');
      await store.updateItem(item.id, { quantity: 10 });
      expect(store.items[0].quantity).toBe(10);
    });

    it('should delete an item', async () => {
      const item = await store.createItem('Test', 'Canned Goods', 1);
      await store.deleteItem(item.id);
      expect(store.items).toHaveLength(0);
    });

    it('should not delete non-existent item', async () => {
      await expect(store.deleteItem('non-existent-id')).rejects.toThrow(
        'Item not found',
      );
    });
  });

  describe('Computed Properties', () => {
    beforeEach(async () => {
      await store.initDatabase();
    });

    it('should group items by category', async () => {
      await store.createItem('Item1', 'Canned Goods', 1);
      await store.createItem('Item2', 'Dry Goods', 1);
      await store.createItem('Item3', 'Canned Goods', 1);

      const grouped = store.itemsByCategory;
      expect(grouped['Canned Goods']).toHaveLength(2);
      expect(grouped['Dry Goods']).toHaveLength(1);
    });

    it('should return items sorted alphabetically', async () => {
      await store.createItem('Zucchini', 'Fresh', 1);
      await store.createItem('Apples', 'Fresh', 1);
      await store.createItem('Milk', 'Fresh', 1);

      const sorted = store.allItemsSorted;
      expect(sorted[0].name).toBe('Apples');
      expect(sorted[1].name).toBe('Milk');
      expect(sorted[2].name).toBe('Zucchini');
    });

    it('should get category item count', async () => {
      await store.createItem('Item1', 'Canned Goods', 1);
      await store.createItem('Item2', 'Canned Goods', 1);
      await store.createItem('Item3', 'Dry Goods', 1);

      expect(store.getCategoryItemCount('Canned Goods')).toBe(2);
      expect(store.getCategoryItemCount('Dry Goods')).toBe(1);
    });
  });

  describe('Category Deletion with Items', () => {
    beforeEach(async () => {
      await store.initDatabase();
    });

    it('should move items to fallback category when deleting category with items', async () => {
      await store.createItem('Item1', 'Canned Goods', 1);
      await store.createItem('Item2', 'Canned Goods', 1);

      await store.deleteCategory('Canned Goods', 'Dry Goods');

      expect(store.categories).not.toContain('Canned Goods');
      expect(store.items.every((item) => item.category === 'Dry Goods')).toBe(
        true,
      );
    });

    it('should require fallback category when deleting category with items', async () => {
      await store.createItem('Item1', 'Canned Goods', 1);

      await expect(store.deleteCategory('Canned Goods')).rejects.toThrow(
        'Fallback category required when category has items',
      );
    });
  });

  describe('Expiration Date Validation', () => {
    beforeEach(async () => {
      await store.initDatabase();
    });

    describe('createItem validation', () => {
      it('should reject invalid expiration month - zero', async () => {
        await expect(
          store.createItem('Test Item', 'Canned Goods', 1, 'cans', '', 0, 2025),
        ).rejects.toThrow('Expiration month must be between 1 and 12');
      });

      it('should reject invalid expiration month - negative', async () => {
        await expect(
          store.createItem('Test Item', 'Canned Goods', 1, 'cans', '', -1, 2025),
        ).rejects.toThrow('Expiration month must be between 1 and 12');
      });

      it('should reject invalid expiration month - too high', async () => {
        await expect(
          store.createItem('Test Item', 'Canned Goods', 1, 'cans', '', 13, 2025),
        ).rejects.toThrow('Expiration month must be between 1 and 12');
      });

      it('should reject expiration year in the past', async () => {
        const currentYear = new Date().getFullYear();
        const pastYear = currentYear - 1;
        await expect(
          store.createItem(
            'Test Item',
            'Canned Goods',
            1,
            'cans',
            '',
            6,
            pastYear,
          ),
        ).rejects.toThrow(
          `Expiration year must be between ${currentYear} and ${currentYear + 50}`,
        );
      });

      it('should reject expiration year too far in the future', async () => {
        const currentYear = new Date().getFullYear();
        const farFutureYear = currentYear + 51;
        await expect(
          store.createItem(
            'Test Item',
            'Canned Goods',
            1,
            'cans',
            '',
            6,
            farFutureYear,
          ),
        ).rejects.toThrow(
          `Expiration year must be between ${currentYear} and ${currentYear + 50}`,
        );
      });

      it('should accept valid expiration dates - current year', async () => {
        const currentYear = new Date().getFullYear();
        const item = await store.createItem(
          'Test Item',
          'Canned Goods',
          1,
          'cans',
          '',
          6,
          currentYear,
        );
        expect(item.expirationMonth).toBe(6);
        expect(item.expirationYear).toBe(currentYear);
      });

      it('should accept valid expiration dates - future year', async () => {
        const currentYear = new Date().getFullYear();
        const futureYear = currentYear + 10;
        const item = await store.createItem(
          'Test Item',
          'Canned Goods',
          1,
          'cans',
          '',
          12,
          futureYear,
        );
        expect(item.expirationMonth).toBe(12);
        expect(item.expirationYear).toBe(futureYear);
      });

      it('should accept valid expiration dates - edge month 1', async () => {
        const currentYear = new Date().getFullYear();
        const item = await store.createItem(
          'Test Item',
          'Canned Goods',
          1,
          'cans',
          '',
          1,
          currentYear,
        );
        expect(item.expirationMonth).toBe(1);
      });

      it('should accept valid expiration dates - edge month 12', async () => {
        const currentYear = new Date().getFullYear();
        const item = await store.createItem(
          'Test Item',
          'Canned Goods',
          1,
          'cans',
          '',
          12,
          currentYear,
        );
        expect(item.expirationMonth).toBe(12);
      });

      it('should accept items without expiration dates', async () => {
        const item = await store.createItem(
          'Test Item',
          'Canned Goods',
          1,
          'cans',
        );
        expect(item.expirationMonth).toBeUndefined();
        expect(item.expirationYear).toBeUndefined();
      });
    });

    describe('updateItem validation', () => {
      it('should reject invalid expiration month - zero', async () => {
        const item = await store.createItem('Test Item', 'Canned Goods', 1);
        await expect(
          store.updateItem(item.id, { expirationMonth: 0 }),
        ).rejects.toThrow('Expiration month must be between 1 and 12');
      });

      it('should reject invalid expiration month - negative', async () => {
        const item = await store.createItem('Test Item', 'Canned Goods', 1);
        await expect(
          store.updateItem(item.id, { expirationMonth: -1 }),
        ).rejects.toThrow('Expiration month must be between 1 and 12');
      });

      it('should reject invalid expiration month - too high', async () => {
        const item = await store.createItem('Test Item', 'Canned Goods', 1);
        await expect(
          store.updateItem(item.id, { expirationMonth: 13 }),
        ).rejects.toThrow('Expiration month must be between 1 and 12');
      });

      it('should reject expiration year in the past', async () => {
        const item = await store.createItem('Test Item', 'Canned Goods', 1);
        const currentYear = new Date().getFullYear();
        const pastYear = currentYear - 1;
        await expect(
          store.updateItem(item.id, { expirationYear: pastYear }),
        ).rejects.toThrow(
          `Expiration year must be between ${currentYear} and ${currentYear + 50}`,
        );
      });

      it('should reject expiration year too far in the future', async () => {
        const item = await store.createItem('Test Item', 'Canned Goods', 1);
        const currentYear = new Date().getFullYear();
        const farFutureYear = currentYear + 51;
        await expect(
          store.updateItem(item.id, { expirationYear: farFutureYear }),
        ).rejects.toThrow(
          `Expiration year must be between ${currentYear} and ${currentYear + 50}`,
        );
      });

      it('should accept valid expiration date updates', async () => {
        const item = await store.createItem('Test Item', 'Canned Goods', 1);
        const currentYear = new Date().getFullYear();
        await store.updateItem(item.id, {
          expirationMonth: 6,
          expirationYear: currentYear + 5,
        });
        expect(store.items[0].expirationMonth).toBe(6);
        expect(store.items[0].expirationYear).toBe(currentYear + 5);
      });

      it('should accept clearing expiration dates', async () => {
        const currentYear = new Date().getFullYear();
        const item = await store.createItem(
          'Test Item',
          'Canned Goods',
          1,
          'cans',
          '',
          6,
          currentYear,
        );
        await store.updateItem(item.id, {
          expirationMonth: undefined,
          expirationYear: undefined,
        });
        expect(store.items[0].expirationMonth).toBeUndefined();
        expect(store.items[0].expirationYear).toBeUndefined();
      });
    });
  });
});
