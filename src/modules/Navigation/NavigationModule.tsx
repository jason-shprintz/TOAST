import { useNavigation } from '@react-navigation/native';
import React from 'react';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import PlaceholderCard from '../../components/PlaceholderCard';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';

export default function NavigationModule() {
  const navigation = useNavigation<any>();
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Navigation</SectionHeader>
      <Grid>
        <PlaceholderCard
          title="Map"
          icon="map-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Map',
              icon: 'map-outline',
            })
          }
        />
        <PlaceholderCard
          title="Compass"
          icon="compass-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Compass',
              icon: 'compass-outline',
            })
          }
        />
      </Grid>
    </ScreenContainer>
  );
}
