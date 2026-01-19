import emergencyData from '../data/emergency.json';
import healthData from '../data/health.json';
import survivalData from '../data/survival.json';
import toolsData from '../data/tools.json';
import weatherData from '../data/weather.json';
import { ToolType } from '../types/common-types';
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

// Main modules
const modules: ToolType[] = [
  { name: 'Core', screen: 'CoreModule', icon: 'apps-outline', id: 'home_core' },
  {
    name: 'Navigation',
    screen: 'NavigationModule',
    icon: 'compass-outline',
    id: 'home_navigation',
  },
  {
    name: 'Reference',
    screen: 'ReferenceModule',
    icon: 'book-outline',
    id: 'home_reference',
  },
  {
    name: 'Comms',
    screen: 'CommunicationsModule',
    icon: 'call-outline',
    id: 'home_communications',
  },
  {
    name: 'Prepper',
    screen: 'PrepperModule',
    icon: 'shield-checkmark-outline',
    id: 'home_prepper',
  },
];

// Core tools
const coreTools: ToolType[] = [
  {
    name: 'Device Status',
    screen: 'DeviceStatus',
    icon: 'speedometer-outline',
    id: 'core_device_status',
  },
  {
    name: 'Flashlight',
    screen: 'Flashlight',
    icon: 'flashlight-outline',
    id: 'core_flashlight',
  },
  {
    name: 'Voice Log',
    screen: 'VoiceLog',
    icon: 'mic-outline',
    id: 'core_voice_log',
  },
  {
    name: 'Notepad',
    screen: 'Notepad',
    icon: 'document-text-outline',
    id: 'core_notepad',
  },
  {
    name: 'Unit Conversion',
    screen: 'UnitConversion',
    icon: 'swap-horizontal-outline',
    id: 'core_unit_conversion',
  },
  {
    name: 'Checklist',
    screen: 'Checklist',
    icon: 'list-outline',
    id: 'core_checklist',
  },
];

// Communication tools
const communicationTools: ToolType[] = [
  {
    name: 'Morse Code',
    screen: 'MorseCode',
    icon: 'flash-outline',
    id: 'comm_morse_code',
  },
  {
    name: 'Radio Frequency References',
    screen: 'ComingSoon',
    icon: 'cellular-outline',
    id: 'comm_radio_frequency',
  },
  {
    name: 'Digital Whistle',
    screen: 'ComingSoon',
    icon: 'musical-notes-outline',
    id: 'comm_digital_whistle',
  },
  {
    name: 'Decibel Meter',
    screen: 'ComingSoon',
    icon: 'volume-high-outline',
    id: 'comm_decibel_meter',
  },
];

// Navigation tools
const navigationTools: ToolType[] = [
  {
    name: 'Offline Map Tiles',
    screen: 'ComingSoon',
    icon: 'map-outline',
    id: 'nav_offline_map_tiles',
  },
  {
    name: 'Compass & Gyro Orientation',
    screen: 'ComingSoon',
    icon: 'compass-outline',
    id: 'nav_compass_gyro',
  },
  {
    name: 'Waypoints & Breadcrumbs',
    screen: 'ComingSoon',
    icon: 'location-outline',
    id: 'nav_waypoints_breadcrumbs',
  },
  {
    name: 'Return to Start',
    screen: 'ComingSoon',
    icon: 'arrow-undo-outline',
    id: 'nav_return_to_start',
  },
  {
    name: 'Elevation Graphs',
    screen: 'ComingSoon',
    icon: 'trending-up-outline',
    id: 'nav_elevation_graphs',
  },
  {
    name: 'Downloadable Trail Packs',
    screen: 'ComingSoon',
    icon: 'download-outline',
    id: 'nav_trail_packs',
  },
];

// Reference tools
const referenceTools: ToolType[] = [
  {
    name: 'Bookmark',
    screen: 'Bookmark',
    icon: 'bookmark-outline',
    id: 'ref_bookmark',
  },
  {
    name: 'Health',
    screen: 'Health',
    icon: 'medkit-outline',
    id: 'ref_health',
  },
  {
    name: 'Survival Guide',
    screen: 'Survival',
    icon: 'leaf-outline',
    id: 'ref_survival_guide',
  },
  {
    name: 'Weather',
    screen: 'Weather',
    icon: 'rainy-outline',
    id: 'ref_weather',
  },
  {
    name: 'Tools & Knots',
    screen: 'ToolsAndKnots',
    icon: 'hammer-outline',
    id: 'ref_tools_knots',
  },
  {
    name: 'Emergency',
    screen: 'Emergency',
    icon: 'warning-outline',
    id: 'ref_emergency',
  },
];

// Prepper tools
const prepperTools: ToolType[] = [
  {
    name: 'Depletion Calculator',
    screen: 'ComingSoon',
    icon: 'calculator-outline',
    id: 'prepper_depletion_calculator',
  },
  {
    name: 'Pantry',
    screen: 'ComingSoon',
    icon: 'restaurant-outline',
    id: 'prepper_pantry',
  },
  {
    name: 'Inventory',
    screen: 'ComingSoon',
    icon: 'cube-outline',
    id: 'prepper_inventory',
  },
  {
    name: 'Bug-Out',
    screen: 'ComingSoon',
    icon: 'bag-outline',
    id: 'prepper_bug_out',
  },
  {
    name: 'Scenario Cards',
    screen: 'ComingSoon',
    icon: 'albums-outline',
    id: 'prepper_scenario_cards',
  },
  {
    name: 'Barter Estimator',
    screen: 'ComingSoon',
    icon: 'swap-horizontal-outline',
    id: 'prepper_barter_estimator',
  },
];

/**
 * Converts a tool to a searchable item
 */
function toolToSearchableItem(
  tool: ToolType,
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
 */
export function getAllSearchableItems(): SearchableItem[] {
  const items: SearchableItem[] = [];

  // Add modules
  modules.forEach(module => {
    items.push(toolToSearchableItem(module, 'module'));
  });

  // Add all tools
  [
    ...coreTools,
    ...communicationTools,
    ...navigationTools,
    ...referenceTools,
    ...prepperTools,
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
