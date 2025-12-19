import React, { JSX } from 'react';
import CategoryList from '../../components/CategoryList';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import data from '../../data/survival.json';
import { CategoryType } from '../../types/common-types';

const categoryMap: Record<string, string> = {
  Firecraft: 'Firecraft',
  Water: 'Water',
  Shelter: 'Shelter',
  FoodAndForaging: 'Food & Foraging',
  TrackingAndAwareness: 'Tracking & Awareness',
};

const survivalCategories: CategoryType[] = [
  {
    title: 'Firecraft',
    icon: 'flame-outline',
    id: 'survival_firecraft',
    category: categoryMap.Firecraft,
    data: data.entries,
  },
  {
    title: 'Water',
    icon: 'water-outline',
    id: 'survival_water',
    category: categoryMap.Water,
    data: data.entries,
  },
  {
    title: 'Shelter',
    icon: 'home-outline',
    id: 'survival_shelter',
    category: categoryMap.Shelter,
    data: data.entries,
  },
  {
    title: 'Food & Foraging',
    icon: 'nutrition-outline',
    id: 'survival_food_foraging',
    category: categoryMap.FoodAndForaging,
    data: data.entries,
  },
  {
    title: 'Tracking & Awareness',
    icon: 'map-outline',
    id: 'survival_tracking_awareness',
    category: categoryMap.TrackingAndAwareness,
    data: data.entries,
  },
];

/**
 * Renders the Survival Guide screen, providing quick access to essential survival topics.
 * Displays a header, section title, and a grid of topic cards (Fire, Water, Shelter, Food & Foraging, Tracking & Awareness).
 * Each card navigates to a detailed category screen with relevant data when pressed.
 *
 * @returns {JSX.Element} The rendered Survival Guide screen component.
 */
export default function SurvivalScreen(): JSX.Element {
  const disclaimer: string = data.metadata?.disclaimer ?? '';

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Survival Guide</SectionHeader>
      <CategoryList disclaimer={disclaimer} categories={survivalCategories} />
    </ScreenContainer>
  );
}
