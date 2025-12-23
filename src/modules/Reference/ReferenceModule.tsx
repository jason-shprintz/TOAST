import React from 'react';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';
import { ToolType } from '../../types/common-types';

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

/**
 * Renders the Reference screen.
 *
 * Displays a section header labeled "Reference" and a list of available reference tools.
 *
 * @returns A React element containing the Reference screen layout.
 */
export default function ReferenceModule() {
  return (
    <ScreenBody>
      <SectionHeader>Reference</SectionHeader>
      <ToolList tools={referenceTools} />
    </ScreenBody>
  );
}
