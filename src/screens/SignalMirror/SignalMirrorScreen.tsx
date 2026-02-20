import React from 'react';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';
import { ToolType } from '../../types/common-types';

const signalMirrorTools: ToolType[] = [
  {
    name: 'Screen Flash SOS',
    screen: 'ScreenFlashSOS',
    icon: 'phone-portrait-outline',
    id: 'signal_mirror_screen_flash_sos',
  },
  {
    name: 'Ground-to-Air Signals',
    screen: 'GroundToAirSignals',
    icon: 'airplane-outline',
    id: 'signal_mirror_ground_to_air',
  },
];

/**
 * SignalMirrorScreen is the hub screen for visual distress signaling tools.
 *
 * It provides access to:
 * - Screen Flash SOS: full-screen strobe in the SOS pattern
 * - Ground-to-Air Signals: reference guide for internationally recognized ground-to-air symbols
 *
 * @returns A React element rendering the Signal Mirror hub screen.
 */
export default function SignalMirrorScreen() {
  return (
    <ScreenBody>
      <SectionHeader>Signal Mirror</SectionHeader>
      <ToolList tools={signalMirrorTools} />
    </ScreenBody>
  );
}
