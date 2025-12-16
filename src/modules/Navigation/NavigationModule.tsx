import React from 'react';
import LogoHeader from '../../components/LogoHeader';
import MapTools from '../../components/MapTools';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import { toolType } from '../../types/tools-type';

export default function NavigationModule() {
  const navigationTools: toolType[] = [
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

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Navigation</SectionHeader>
      <MapTools tools={navigationTools} />
    </ScreenContainer>
  );
}
