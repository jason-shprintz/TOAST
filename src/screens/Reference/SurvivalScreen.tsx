import { useNavigation } from '@react-navigation/native';
import React, { JSX } from 'react';
import { ScrollView } from 'react-native';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import data from '../../data/survival.json';

const categoryMap: Record<string, string> = {
  Firecraft: 'Firecraft',
  Water: 'Water',
  Shelter: 'Shelter',
  FoodAndForaging: 'Food & Foraging',
  TrackingAndAwareness: 'Tracking & Awareness',
};

/**
 * Renders the Survival Guide screen, providing quick access to essential survival topics.
 * Displays a header, section title, and a grid of topic cards (Fire, Water, Shelter, Food & Foraging, Tracking & Awareness).
 * Each card navigates to a detailed category screen with relevant data when pressed.
 *
 * @returns {JSX.Element} The rendered Survival Guide screen component.
 */
export default function SurvivalScreen(): JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Survival Guide</SectionHeader>
      <ScrollView>
        <Grid>
          <CardTopic
            title="Fire"
            icon="flame-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.Firecraft,
                title: 'Fire',
                data: data,
              })
            }
          />
          <CardTopic
            title="Water"
            icon="rainy-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.Water,
                title: 'Water',
                data: data,
              })
            }
          />
          <CardTopic
            title="Shelter"
            icon="alert-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.Shelter,
                title: 'Shelter',
                data: data,
              })
            }
          />
          <CardTopic
            title="Food & Foraging"
            icon="water-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.FoodAndForaging,
                title: 'Food & Foraging',
                data: data,
              })
            }
          />
          <CardTopic
            title="Tracking & Awareness"
            icon="map-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.TrackingAndAwareness,
                title: 'Tracking & Awareness',
                data: data,
              })
            }
          />
        </Grid>
      </ScrollView>
    </ScreenContainer>
  );
}
