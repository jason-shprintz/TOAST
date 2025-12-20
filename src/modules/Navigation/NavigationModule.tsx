import React from 'react';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';
import { ToolType } from '../../types/common-types';

const navigationTools: ToolType[] = [
  {
    name: 'Map',
    screen: 'ComingSoon',
    icon: 'map-outline',
    id: 'nav_map',
  },
  {
    name: 'Compass',
    screen: 'ComingSoon',
    icon: 'compass-outline',
    id: 'nav_compass',
  },
];

export default function NavigationModule() {
  return (
    <ScreenBody>
      <SectionHeader>Navigation</SectionHeader>
      <ToolList tools={navigationTools} />
    </ScreenBody>
  );
}
