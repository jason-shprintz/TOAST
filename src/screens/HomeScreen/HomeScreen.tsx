import React from 'react';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';
import { ToolType } from '../../types/common-types';

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

/**
 * Home screen for the app.
 *
 * Renders the primary landing content including the app title and the list of
 * available tool modules.
 *
 * @returns A React element containing a section header and a tool list.
 */
export default function HomeScreen() {
  return (
    <ScreenBody>
      <SectionHeader>TOAST</SectionHeader>
      <ToolList tools={modules} />
    </ScreenBody>
  );
}
