import React from 'react';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';
import { ToolType } from '../../types/common-types';

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
    icon: 'backpack-outline',
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
 * Renders the Prepper screen module.
 *
 * Displays a section header labeled "Prepper" and a list of available
 * prepper-related tools within a standard screen layout.
 *
 * @returns A React element containing the Prepper module UI.
 */
export default function PrepperModule() {
  return (
    <ScreenBody>
      <SectionHeader>Prepper</SectionHeader>
      <ToolList tools={prepperTools} />
    </ScreenBody>
  );
}
