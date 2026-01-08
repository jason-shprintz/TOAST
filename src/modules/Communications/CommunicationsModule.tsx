import React from 'react';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';
import { ToolType } from '../../types/common-types';

const communicationTools: ToolType[] = [
  {
    name: 'Morse Code',
    screen: 'ComingSoon',
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
