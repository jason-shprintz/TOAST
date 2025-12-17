import React, { JSX } from 'react';
import CategoryList from '../../components/CategoryList';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import data from '../../data/health.json';
import { CategoryType } from '../../types/common-types';

const healthCategories: CategoryType[] = [
  {
    title: 'Emergency',
    icon: 'alert-outline',
    id: 'health_emergency',
    category: 'Emergency',
    data: data.entries,
  },
  {
    title: 'Illness',
    icon: 'medkit-outline',
    id: 'health_illness',
    category: 'Illness',
    data: data.entries,
  },
  {
    title: 'Injury',
    icon: 'bandage-outline',
    id: 'health_injury',
    category: 'Injury',
    data: data.entries,
  },
  {
    title: 'Preventive',
    icon: 'shield-checkmark-outline',
    id: 'health_preventive',
    category: 'Preventive',
    data: data.entries,
  },
];

/**
 * Displays the Health reference screen, providing navigation to various health-related categories.
 *
 * This screen presents a grid of topics including Emergency, Illness, Injury, and Preventive,
 * each represented by a `CardTopic` component. Selecting a topic navigates to the 'Category' screen
 * with the corresponding category data.
 *
 * @returns {JSX.Element} The rendered HealthScreen component.
 */
export default function HealthScreen(): JSX.Element {
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Health</SectionHeader>
      <CategoryList categories={healthCategories} />
    </ScreenContainer>
  );
}
