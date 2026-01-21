import React from 'react';
import { NAVIGATION_TOOLS } from '../../../constants';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';

/**
 * Renders the Navigation screen module.
 *
 * Displays a section header and a list of navigation-related tools within the
 * standard screen layout.
 *
 * @returns The Navigation module UI.
 */
export default function NavigationModule() {
  return (
    <ScreenBody>
      <SectionHeader>Navigation</SectionHeader>
      <ToolList tools={NAVIGATION_TOOLS} />
    </ScreenBody>
  );
}
