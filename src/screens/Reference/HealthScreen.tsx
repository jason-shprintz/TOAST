import React, { JSX } from 'react';
import CategoryList from '../../components/CategoryList';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import SectionSubHeader from '../../components/SectionSubHeader';
import data from '../../data/health.json';
import { CategoryType } from '../../types/common-types';

const categoryMap: Record<string, string> = {
  Emergency: 'Emergency',
  Illness: 'Illness',
  Injury: 'Injury',
  Preventative: 'Preventive',
};

const healthCategories: CategoryType[] = [
  {
    title: 'Emergency',
    icon: 'alert-outline',
    id: 'health_emergency',
    category: categoryMap.Emergency,
    data: data.entries,
  },
  {
    title: 'Illness',
    icon: 'medkit-outline',
    id: 'health_illness',
    category: categoryMap.Illness,
    data: data.entries,
  },
  {
    title: 'Injury',
    icon: 'bandage-outline',
    id: 'health_injury',
    category: categoryMap.Injury,
    data: data.entries,
  },
  {
    title: 'Preventive',
    icon: 'shield-checkmark-outline',
    id: 'health_preventive',
    category: categoryMap.Preventative,
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
  const disclaimer: string = data.metadata.disclaimer;

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Health</SectionHeader>
      <SectionSubHeader>{disclaimer}</SectionSubHeader>
      <CategoryList categories={healthCategories} />
    </ScreenContainer>
  );
}
