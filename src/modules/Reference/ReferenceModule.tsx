import { useNavigation } from '@react-navigation/native';
import React from 'react';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import PlaceholderCard from '../../components/PlaceholderCard';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';

export default function ReferenceModule() {
  const navigation = useNavigation<any>();
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Reference</SectionHeader>
      <Grid>
        <PlaceholderCard
          title="Bookmark"
          icon="bookmark-outline"
          onPress={() => navigation.navigate('Bookmark')}
        />
        <PlaceholderCard
          title="Health"
          icon="medkit-outline"
          onPress={() => navigation.navigate('Health')}
        />
        <PlaceholderCard
          title="Flora"
          icon="leaf-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Flora',
              icon: 'leaf-outline',
            })
          }
        />
        <PlaceholderCard
          title="Fauna"
          icon="paw-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Fauna',
              icon: 'paw-outline',
            })
          }
        />
        <PlaceholderCard
          title="Gardening"
          icon="flower-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Gardening',
              icon: 'flower-outline',
            })
          }
        />
        <PlaceholderCard
          title="Hunting"
          icon="compass-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Hunting',
              icon: 'compass-outline',
            })
          }
        />
      </Grid>
    </ScreenContainer>
  );
}
