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
    name: 'Voice Log',
    screen: 'VoiceLog',
    icon: 'mic-outline',
    id: 'core_voice_log',
  },
  {
    name: 'Notepad',
    screen: 'Notepad',
    icon: 'document-text-outline',
    id: 'core_notepad',
  },
  {
    name: 'Unit Conversion',
    screen: 'UnitConversion',
    icon: 'swap-horizontal-outline',
    id: 'core_unit_conversion',
  },
  {
    name: 'Checklist',
    screen: 'Checklist',
    icon: 'list-outline',
    id: 'core_checklist',
  },
];

/**
 * Renders the Core tools screen.
 *
 * Displays a section header labeled "Core" and a list of tools sourced from
 * {@link coreTools}, wrapped within the standard {@link ScreenBody} layout.
 *
 * @returns A React element representing the Core module screen.
 */
export default function CoreModule() {
  return (
    <ScreenBody>
      <SectionHeader>Core</SectionHeader>
      <ToolList tools={coreTools} />
    </ScreenBody>
  );
}
