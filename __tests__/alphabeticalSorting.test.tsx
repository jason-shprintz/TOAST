/**
 * @format
 */

import { ToolType, CategoryType } from '../src/types/common-types';

describe('Alphabetical Sorting', () => {
  describe('ToolList sorting logic', () => {
    it('should sort tools alphabetically by name', () => {
      const unsortedTools: ToolType[] = [
        { name: 'Zebra', screen: 'ZebraScreen', icon: 'icon1', id: 'z' },
        { name: 'Alpha', screen: 'AlphaScreen', icon: 'icon2', id: 'a' },
        { name: 'Mike', screen: 'MikeScreen', icon: 'icon3', id: 'm' },
        { name: 'Beta', screen: 'BetaScreen', icon: 'icon4', id: 'b' },
      ];

      // Apply the same sorting logic as ToolList component
      const sortedTools = [...unsortedTools].sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      // Extract names in sorted order
      const sortedNames = sortedTools.map(tool => tool.name);

      // Expected alphabetical order
      const expectedOrder = ['Alpha', 'Beta', 'Mike', 'Zebra'];

      expect(sortedNames).toEqual(expectedOrder);
    });

    it('should handle tools with same starting letters correctly', () => {
      const unsortedTools: ToolType[] = [
        { name: 'Device', screen: 'DeviceScreen', icon: 'icon1', id: 'd1' },
        { name: 'Decibel', screen: 'DecibelScreen', icon: 'icon2', id: 'd2' },
        { name: 'Digital', screen: 'DigitalScreen', icon: 'icon3', id: 'd3' },
      ];

      const sortedTools = [...unsortedTools].sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      const sortedNames = sortedTools.map(tool => tool.name);
      const expectedOrder = ['Decibel', 'Device', 'Digital'];

      expect(sortedNames).toEqual(expectedOrder);
    });
  });

  describe('CategoryList sorting logic', () => {
    it('should sort categories alphabetically by title', () => {
      const unsortedCategories: CategoryType[] = [
        {
          title: 'Zebra',
          icon: 'icon1',
          id: 'z',
          category: 'Zebra',
          data: [],
        },
        {
          title: 'Alpha',
          icon: 'icon2',
          id: 'a',
          category: 'Alpha',
          data: [],
        },
        {
          title: 'Mike',
          icon: 'icon3',
          id: 'm',
          category: 'Mike',
          data: [],
        },
        {
          title: 'Beta',
          icon: 'icon4',
          id: 'b',
          category: 'Beta',
          data: [],
        },
      ];

      // Apply the same sorting logic as CategoryList component
      const sortedCategories = [...unsortedCategories].sort((a, b) =>
        a.title.localeCompare(b.title),
      );

      // Extract titles in sorted order
      const sortedTitles = sortedCategories.map(category => category.title);

      // Expected alphabetical order
      const expectedOrder = ['Alpha', 'Beta', 'Mike', 'Zebra'];

      expect(sortedTitles).toEqual(expectedOrder);
    });

    it('should handle categories with symbols and spaces correctly', () => {
      const unsortedCategories: CategoryType[] = [
        {
          title: 'Wind & Storms',
          icon: 'icon1',
          id: 'w',
          category: 'Wind & Storms',
          data: [],
        },
        {
          title: 'Cold Weather',
          icon: 'icon2',
          id: 'c',
          category: 'Cold Weather',
          data: [],
        },
        {
          title: 'Heat & Sun',
          icon: 'icon3',
          id: 'h',
          category: 'Heat & Sun',
          data: [],
        },
      ];

      const sortedCategories = [...unsortedCategories].sort((a, b) =>
        a.title.localeCompare(b.title),
      );

      const sortedTitles = sortedCategories.map(category => category.title);
      const expectedOrder = ['Cold Weather', 'Heat & Sun', 'Wind & Storms'];

      expect(sortedTitles).toEqual(expectedOrder);
    });
  });
});
