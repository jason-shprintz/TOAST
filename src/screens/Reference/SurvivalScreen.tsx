import { useNavigation } from '@react-navigation/native';
import React, { JSX } from 'react';
import { ScrollView } from 'react-native';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import survivalData from '../../data/survival.json';
export default function SurvivalScreen(): JSX.Element {
  const navigation = useNavigation<any>();

  const getEntryById = (id: string) =>
    survivalData.entries.find(e => e.id === id);

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Survival Guide</SectionHeader>
      <ScrollView>
        <Grid>
          <CardTopic
            title="Fire Starting (Basics)"
            icon="flame-outline"
            onPress={() =>
              navigation.navigate('SurvivalEntry', {
                entry: getEntryById('fire_starting_basics'),
              })
            }
          />
          <CardTopic
            title="Fire Starting in Wet Conditions"
            icon="rainy-outline"
            onPress={() =>
              navigation.navigate('SurvivalEntry', {
                entry: getEntryById('fire_starting_wet_conditions'),
              })
            }
          />
          <CardTopic
            title="Fire Safety and Extinguishing"
            icon="alert-outline"
            onPress={() =>
              navigation.navigate('SurvivalEntry', {
                entry: getEntryById('fire_safety_and_extinguishing'),
              })
            }
          />
          <CardTopic
            title="Water Purification"
            icon="water-outline"
            onPress={() =>
              navigation.navigate('SurvivalEntry', {
                entry: getEntryById('water_purification'),
              })
            }
          />
          <CardTopic
            title="Finding Water Sources"
            icon="map-outline"
            onPress={() =>
              navigation.navigate('SurvivalEntry', {
                entry: getEntryById('water_finding_sources'),
              })
            }
          />
          <CardTopic
            title="Shelter Building (Basic Debris Shelter)"
            icon="home-outline"
            onPress={() =>
              navigation.navigate('SurvivalEntry', {
                entry: getEntryById('shelter_building_basic_debris_shelter'),
              })
            }
          />
          <CardTopic
            title="Tarp Shelter Configurations"
            icon="trail-sign-outline"
            onPress={() =>
              navigation.navigate('SurvivalEntry', {
                entry: getEntryById('shelter_tarp_configurations'),
              })
            }
          />
          <CardTopic
            title="Animal Tracks (Identification Basics)"
            icon="footsteps"
            onPress={() =>
              navigation.navigate('SurvivalEntry', {
                entry: getEntryById('animal_tracks_identification_basics'),
              })
            }
          />
          <CardTopic
            title="Trail Sign and Navigation Awareness"
            icon="navigate-outline"
            onPress={() =>
              navigation.navigate('SurvivalEntry', {
                entry: getEntryById('tracking_trail_sign_navigation'),
              })
            }
          />
        </Grid>
      </ScrollView>
    </ScreenContainer>
  );
}
