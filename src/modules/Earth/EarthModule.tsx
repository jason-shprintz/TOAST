import React from 'react';
import { EARTH_TOOLS } from '../../../constants';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';

export default function EarthModule() {
  return (
    <ScreenBody>
      <SectionHeader>Earth</SectionHeader>
      <ToolList tools={EARTH_TOOLS} />
    </ScreenBody>
  );
}
