import React from 'react';
import { REFERENCE_TOOLS } from '../../../constants';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';

/**
 * Renders the Reference screen.
 *
 * Displays a section header labeled "Reference" and a list of available reference tools.
 *
 * @returns A React element containing the Reference screen layout.
 */
export default function ReferenceModule() {
  return (
    <ScreenBody>
      <SectionHeader>Reference</SectionHeader>
      <ToolList tools={REFERENCE_TOOLS} />
    </ScreenBody>
  );
}
