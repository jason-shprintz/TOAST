import React from 'react';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';
import { ToolType } from '../../types/common-types';

const communicationTools: ToolType[] = [
  {
    name: 'Ham Radio',
    screen: 'ComingSoon',
    icon: 'radio-outline',
    id: 'comm_ham_radio',
  },
  {
    name: 'Morse Code',
    screen: 'ComingSoon',
    icon: 'code-outline',
    id: 'comm_morse_code',
  },
  {
    name: 'Bluetooth',
    screen: 'ComingSoon',
    icon: 'bluetooth-outline',
    id: 'comm_bluetooth',
  },
];

/**
 * Renders the Communications screen module.
 *
 * Displays a section header labeled "Communications" and a list of available
 * communication-related tools within a standard screen layout.
 *
 * @returns A React element containing the Communications module UI.
 */
export default function CommunicationsModule() {
  return (
    <ScreenBody>
      <SectionHeader>Communications</SectionHeader>
      <ToolList tools={communicationTools} />
    </ScreenBody>
  );
}
