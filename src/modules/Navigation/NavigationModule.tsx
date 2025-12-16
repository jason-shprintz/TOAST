import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView } from 'react-native';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';

export default function NavigationModule() {
  const navigation = useNavigation<any>();
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Navigation</SectionHeader>
      <ScrollView>
        <Grid>
          <CardTopic
            title="Map"
            icon="map-outline"
            onPress={() =>
              navigation.navigate('ComingSoon', {
                title: 'Map',
                icon: 'map-outline',
              })
            }
          />
          <CardTopic
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
      </ScrollView>
    </ScreenContainer>
  );
}
