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
