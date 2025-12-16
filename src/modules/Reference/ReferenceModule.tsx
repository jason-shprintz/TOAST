import React from 'react';
import LogoHeader from '../../components/LogoHeader';
import MapTools from '../../components/MapTools';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import { toolType } from '../../types/common-types';

const referenceTools: toolType[] = [
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
    screen: 'ComingSoon',
    icon: 'hammer-outline',
    id: 'ref_tools_knots',
  },
  {
    name: 'Emergency',
    screen: 'ComingSoon',
    icon: 'warning-outline',
    id: 'ref_emergency',
  },
];

export default function ReferenceModule() {
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Reference</SectionHeader>
      <MapTools tools={referenceTools} />
    </ScreenContainer>
  );
}
