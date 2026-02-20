import { FlashlightModeType, ToolType } from './src/types/common-types';

export const FlashlightModes: FlashlightModeType = {
  OFF: 'off',
  ON: 'on',
  STROBE: 'strobe',
  SOS: 'sos',
  NIGHTVISION: 'nightvision',
};

export const MODULES: ToolType[] = [
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

export const CORE_TOOLS: ToolType[] = [
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
  {
    name: 'Sun Times',
    screen: 'SunTime',
    icon: 'sunny-outline',
    id: 'core_sun_time',
  },
  {
    name: 'Lunar Cycles',
    screen: 'LunarCycles',
    icon: 'moon-outline',
    id: 'core_lunar_cycles',
  },
  {
    name: 'Barometric Pressure',
    screen: 'BarometricPressure',
    icon: 'analytics-outline',
    id: 'core_barometric_pressure',
  },
];

export const COMMUNICATION_TOOLS: ToolType[] = [
  {
    name: 'Morse Code',
    screen: 'MorseCode',
    icon: 'flash-outline',
    id: 'comm_morse_code',
  },
  {
    name: 'NATO Phonetic',
    screen: 'NatoPhonetic',
    icon: 'radio-outline',
    id: 'comm_nato_phonetic',
  },
  {
    name: 'Radio Frequency References',
    screen: 'RadioFrequencies',
    icon: 'cellular-outline',
    id: 'comm_radio_frequency',
  },
  {
    name: 'Digital Whistle',
    screen: 'DigitalWhistle',
    icon: 'musical-notes-outline',
    id: 'comm_digital_whistle',
  },
  {
    name: 'Decibel Meter',
    screen: 'DecibelMeter',
    icon: 'volume-high-outline',
    id: 'comm_decibel_meter',
  },
  {
    name: 'Ground-to-Air Signals',
    screen: 'GroundToAirSignals',
    icon: 'sunny-outline',
    id: 'comm_ground_to_air',
  },
];

export const NAVIGATION_TOOLS: ToolType[] = [
  {
    name: 'Offline Map Tiles',
    screen: 'OfflineMapScreen',
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

export const REFERENCE_TOOLS: ToolType[] = [
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

export const PREPPER_TOOLS: ToolType[] = [
  {
    name: 'Depletion Calculator',
    screen: 'ComingSoon',
    icon: 'calculator-outline',
    id: 'prepper_depletion_calculator',
  },
  {
    name: 'Pantry',
    screen: 'Pantry',
    icon: 'restaurant-outline',
    id: 'prepper_pantry',
  },
  {
    name: 'Inventory',
    screen: 'Inventory',
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
    screen: 'ScenarioCards',
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
