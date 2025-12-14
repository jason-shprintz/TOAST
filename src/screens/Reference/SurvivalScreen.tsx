import { useNavigation } from '@react-navigation/native';
import React, { JSX } from 'react';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
export default function SurvivalScreen(): JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Survival Guide</SectionHeader>
      <Grid>
        <CardTopic
          title="Fire Starting (Basics)"
          icon="flame-outline"
          onPress={() =>
            navigation.navigate('SurvivalEntry', {
              id: 'fire_starting_basics',
              source: 'survival',
            })
          }
        />
        <CardTopic
          title="Fire Starting in Wet Conditions"
          icon="rainy-outline"
          onPress={() =>
            navigation.navigate('SurvivalEntry', {
              id: 'fire_starting_wet_conditions',
              source: 'survival',
            })
          }
        />
        <CardTopic
          title="Fire Safety and Extinguishing"
          icon="alert-outline"
          onPress={() =>
            navigation.navigate('SurvivalEntry', {
              id: 'fire_safety_and_extinguishing',
              source: 'survival',
            })
          }
        />
        <CardTopic
          title="Water Purification (Field Methods)"
          icon="water-outline"
          onPress={() =>
            navigation.navigate('SurvivalEntry', {
              id: 'water_purification_field_methods',
              source: 'survival',
            })
          }
        />
        <CardTopic
          title="Finding Water Sources"
          icon="map-outline"
          onPress={() =>
            navigation.navigate('SurvivalEntry', {
              id: 'water_finding_sources',
              source: 'survival',
            })
          }
        />
        <CardTopic
          title="Shelter Building (Basic Debris Shelter)"
          icon="home-outline"
          onPress={() =>
            navigation.navigate('SurvivalEntry', {
              id: 'shelter_building_basic_debris_shelter',
              source: 'survival',
            })
          }
        />
        <CardTopic
          title="Tarp Shelter Configurations"
          icon="trail-sign-outline"
          onPress={() =>
            navigation.navigate('SurvivalEntry', {
              id: 'shelter_tarp_configurations',
              source: 'survival',
            })
          }
        />
        <CardTopic
          title="Animal Tracks (Identification Basics)"
          icon="footsteps"
          onPress={() =>
            navigation.navigate('SurvivalEntry', {
              id: 'animal_tracks_identification_basics',
              source: 'survival',
            })
          }
        />
        <CardTopic
          title="Trail Sign and Navigation Awareness"
          icon="navigate-outline"
          onPress={() =>
            navigation.navigate('SurvivalEntry', {
              id: 'tracking_trail_sign_navigation',
              source: 'survival',
            })
          }
        />
      </Grid>
    </ScreenContainer>
  );
}
