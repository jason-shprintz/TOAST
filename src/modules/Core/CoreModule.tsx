import { observer } from 'mobx-react-lite';
import React from 'react';
import LogoHeader from '../../components/LogoHeader';
import MapTools from '../../components/MapTools';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import { toolType } from '../../types/common-types';

const coreTools: toolType[] = [
  {
    name: 'Device Status',
    screen: 'DeviceStatus',
    icon: 'speedometer-outline',
    id: 'core_device_status',
  },
  {
    name: 'Flashlight',
    screen: 'Flashlight',
    icon: 'flashlight-outline',
    id: 'core_flashlight',
  },
  {
    name: 'Notepad',
    screen: 'Notepad',
    icon: 'document-text-outline',
    id: 'core_notepad',
  },
  {
    name: 'Unit Conversion',
    screen: 'ComingSoon',
    icon: 'swap-horizontal-outline',
    id: 'core_unit_conversion',
  },
  {
    name: 'Checklist',
    screen: 'ComingSoon',
    icon: 'list-outline',
    id: 'core_checklist',
  },
];

export default observer(function CoreModule() {
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Core</SectionHeader>
      <MapTools tools={coreTools} />
    </ScreenContainer>
  );
});
