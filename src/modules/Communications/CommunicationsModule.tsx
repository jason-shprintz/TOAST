import React from 'react';
import LogoHeader from '../../components/LogoHeader';
import MapTools from '../../components/MapTools';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import { toolType } from '../../types/tools-type';

export default function CommunicationsModule() {
  const communicationTools: toolType[] = [
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

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Communications</SectionHeader>
      <MapTools tools={communicationTools} />
    </ScreenContainer>
  );
}
