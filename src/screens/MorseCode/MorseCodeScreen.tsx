import React from 'react';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';
import { ToolType } from '../../types/common-types';

const morseCodeTools: ToolType[] = [
  {
    name: 'Alpha to Morse',
    screen: 'ComingSoon',
    icon: 'text-outline',
    id: 'morse_alpha_to_morse',
  },
  {
    name: 'Morse to Alpha',
    screen: 'ComingSoon',
    icon: 'swap-horizontal-outline',
    id: 'morse_morse_to_alpha',
  },
  {
    name: 'Trainer',
    screen: 'ComingSoon',
    icon: 'school-outline',
    id: 'morse_trainer',
  },
  {
    name: 'Nato Phonetic',
    screen: 'NatoPhonetic',
    icon: 'radio-outline',
    id: 'morse_nato_phonetic',
  },
  {
    name: 'Cheat Sheet',
    screen: 'ComingSoon',
    icon: 'document-text-outline',
    id: 'morse_cheat_sheet',
  },
];

/**
 * Renders the Morse Code screen.
 *
 * Displays a section header labeled "Morse Code" and a list of available
 * morse code-related tools within a standard screen layout.
 *
 * @returns A React element containing the Morse Code screen UI.
 */
export default function MorseCodeScreen() {
  return (
    <ScreenBody>
      <SectionHeader>Morse Code</SectionHeader>
      <ToolList tools={morseCodeTools} />
    </ScreenBody>
  );
}
