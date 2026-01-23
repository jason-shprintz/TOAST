/**
 * @format
 */

import { searchItems, getAllSearchableItems } from '../src/utils/searchData';

describe('Search Functionality', () => {
  test('getAllSearchableItems returns non-empty array', () => {
    const items = getAllSearchableItems();
    expect(items.length).toBeGreaterThan(0);
  });

  test('searchItems returns empty array for empty query', () => {
    const results = searchItems('');
    expect(results).toEqual([]);
  });

  test('searchItems returns empty array for whitespace query', () => {
    const results = searchItems('   ');
    expect(results).toEqual([]);
  });

  test('searchItems finds Core module', () => {
    const results = searchItems('core');
    expect(results.length).toBeGreaterThan(0);
    const coreModule = results.find((item) => item.id === 'home_core');
    expect(coreModule).toBeDefined();
    expect(coreModule?.title).toBe('Core');
  });

  test('searchItems finds Flashlight tool', () => {
    const results = searchItems('flashlight');
    expect(results.length).toBeGreaterThan(0);
    const flashlight = results.find((item) => item.id === 'core_flashlight');
    expect(flashlight).toBeDefined();
    expect(flashlight?.title).toBe('Flashlight');
  });

  test('searchItems is case insensitive', () => {
    const resultsLower = searchItems('morse');
    const resultsUpper = searchItems('MORSE');
    const resultsMixed = searchItems('MoRsE');
    expect(resultsLower.length).toBeGreaterThan(0);
    expect(resultsLower.length).toEqual(resultsUpper.length);
    expect(resultsLower.length).toEqual(resultsMixed.length);
  });

  test('searchItems finds reference entries by title', () => {
    const results = searchItems('fire');
    expect(results.length).toBeGreaterThan(0);
    const fireEntry = results.find(
      (item) => item.type === 'reference' && item.searchText.includes('fire'),
    );
    expect(fireEntry).toBeDefined();
  });

  test('searchItems returns results sorted alphabetically', () => {
    const results = searchItems('a');
    expect(results.length).toBeGreaterThan(1);
    for (let i = 0; i < results.length - 1; i++) {
      expect(
        results[i].title.localeCompare(results[i + 1].title),
      ).toBeLessThanOrEqual(0);
    }
  });

  test('searchItems handles partial matches', () => {
    const results = searchItems('comm');
    expect(results.length).toBeGreaterThan(0);
    // Should find "Comms" module and "Communications" related items
    const commsModule = results.find((item) => item.title === 'Comms');
    expect(commsModule).toBeDefined();
  });

  test('searchItems finds items by tags', () => {
    // Search for a common tag like "survival"
    const results = searchItems('survival');
    expect(results.length).toBeGreaterThan(0);
    const survivalItem = results.find((item) => item.type === 'reference');
    expect(survivalItem).toBeDefined();
  });
});
