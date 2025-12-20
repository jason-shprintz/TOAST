import { observer } from 'mobx-react-lite';
import React from 'react';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';
import { ToolType } from '../../types/common-types';

const coreTools: ToolType[] = [
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
    <ScreenBody>
      <SectionHeader>Core</SectionHeader>
      <ToolList tools={coreTools} />
    </ScreenBody>
  );
});
