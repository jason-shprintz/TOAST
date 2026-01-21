import React from 'react';
import { COMMUNICATION_TOOLS } from '../../../constants';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';

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
      <ToolList tools={COMMUNICATION_TOOLS} />
    </ScreenBody>
  );
}
