import React from 'react';
import { CORE_TOOLS } from '../../../constants';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';

/**
 * Renders the Core tools screen.
 *
 * Displays a section header labeled "Core" and a list of tools sourced from
 * {@link CORE_TOOLS}, wrapped within the standard {@link ScreenBody} layout.
 *
 * @returns A React element representing the Core module screen.
 */
export default function CoreModule() {
  return (
    <ScreenBody>
      <SectionHeader>Core</SectionHeader>
      <ToolList tools={CORE_TOOLS} />
    </ScreenBody>
  );
}
