import React from 'react';
import { PREPPER_TOOLS } from '../../../constants';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';

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
      <ToolList tools={PREPPER_TOOLS} />
    </ScreenBody>
  );
}
