import React from 'react';
import { EARTH_TOOLS } from '../../../constants';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';

/**
 * Renders the Earth module screen.
 *
 * Displays a section header labeled "Earth" and a list of natural world
 * observation tools sourced from {@link EARTH_TOOLS}, wrapped within the
 * standard {@link ScreenBody} layout.
 *
 * @returns A React element representing the Earth module screen.
 */
export default function EarthModule() {
  return (
    <ScreenBody>
      <SectionHeader>Earth</SectionHeader>
      <ToolList tools={EARTH_TOOLS} />
    </ScreenBody>
  );
}
