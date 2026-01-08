import React from 'react';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';
import { ToolType } from '../../types/common-types';

const navigationTools: ToolType[] = [
  {
    name: 'Offline Map Tiles',
    screen: 'ComingSoon',
    icon: 'map-outline',
    id: 'nav_offline_map_tiles',
  },
  {
    name: 'Compass & Gyro Orientation',
    screen: 'ComingSoon',
    icon: 'compass-outline',
    id: 'nav_compass_gyro',
  },
  {
    name: 'Waypoints & Breadcrumbs',
    screen: 'ComingSoon',
    icon: 'location-outline',
    id: 'nav_waypoints_breadcrumbs',
  },
  {
    name: 'Return to Start',
    screen: 'ComingSoon',
    icon: 'arrow-undo-outline',
    id: 'nav_return_to_start',
  },
  {
    name: 'Elevation Graphs',
    screen: 'ComingSoon',
    icon: 'trending-up-outline',
    id: 'nav_elevation_graphs',
  },
  {
    name: 'Downloadable Trail Packs',
    screen: 'ComingSoon',
    icon: 'download-outline',
    id: 'nav_trail_packs',
  },
];

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
      <ToolList tools={navigationTools} />
    </ScreenBody>
  );
}
