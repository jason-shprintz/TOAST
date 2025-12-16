import React from 'react';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
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

export default function CommunicationsModule() {
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Communications</SectionHeader>
      <ToolList tools={communicationTools} />
    </ScreenContainer>
  );
}
