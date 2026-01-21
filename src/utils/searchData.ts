import {
  COMMUNICATION_TOOLS,
  CORE_TOOLS,
  MODULES,
  NAVIGATION_TOOLS,
  PREPPER_TOOLS,
  REFERENCE_TOOLS,
} from '../../constants';
import emergencyData from '../data/emergency.json';
import healthData from '../data/health.json';
import survivalData from '../data/survival.json';
import toolsData from '../data/tools.json';
import weatherData from '../data/weather.json';
import ReferenceEntryType from '../types/data-type';

export type SearchableItem = {
  id: string;
  title: string;
  type: 'tool' | 'module' | 'reference';
  screen: string;
  icon: string;
  searchText: string; // Combined text for searching
  category?: string;
  data?: any; // Additional data for navigation
};

// Cache for searchable items to improve performance
let cachedSearchableItems: SearchableItem[] | null = null;

/**
 * Converts a tool to a searchable item
 */
function toolToSearchableItem(
  tool: { id: string; name: string; screen: string; icon: string },
  type: 'tool' | 'module',
): SearchableItem {
  return {
    id: tool.id,
    title: tool.name,
    type,
    screen: tool.screen,
    icon: tool.icon,
    searchText: tool.name.toLowerCase(),
  };
}

/**
 * Converts a reference entry to a searchable item
 */
function referenceEntryToSearchableItem(
  entry: ReferenceEntryType,
): SearchableItem {
  // Combine all searchable text fields
  const searchText = [
    entry.title,
    entry.summary,
    entry.category,
    ...(entry.tags || []),
  ]
    .join(' ')
    .toLowerCase();

  return {
    id: entry.id,
    title: entry.title,
    type: 'reference',
    screen: 'Entry',
    icon: 'document-text-outline',
    searchText,
    category: entry.category,
    data: { entry },
  };
}

/**
 * Gets all searchable items in the app
 * Results are cached to improve performance during real-time search
 */
export function getAllSearchableItems(): SearchableItem[] {
  // Return cached items if available
  if (cachedSearchableItems !== null) {
    return cachedSearchableItems;
  }

  const items: SearchableItem[] = [];

  // Add modules
  MODULES.forEach(module => {
    items.push(toolToSearchableItem(module, 'module'));
  });

  // Add all tools
  [
    ...CORE_TOOLS,
    ...COMMUNICATION_TOOLS,
    ...NAVIGATION_TOOLS,
    ...REFERENCE_TOOLS,
    ...PREPPER_TOOLS,
  ].forEach(tool => {
    items.push(toolToSearchableItem(tool, 'tool'));
  });

  // Add reference entries
  const allReferenceEntries = [
    ...healthData.entries,
    ...survivalData.entries,
    ...emergencyData.entries,
    ...toolsData.entries,
    ...weatherData.entries,
  ];

  allReferenceEntries.forEach(entry => {
    items.push(referenceEntryToSearchableItem(entry));
  });

  // Cache the results
  cachedSearchableItems = items;

  return items;
}

/**
 * Searches items by query string
 */
export function searchItems(query: string): SearchableItem[] {
  if (!query || query.trim() === '') {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const allItems = getAllSearchableItems();

  const results = allItems.filter(item =>
    item.searchText.includes(normalizedQuery),
  );

  // Sort alphabetically by title
  return results.sort((a, b) => a.title.localeCompare(b.title));
}
