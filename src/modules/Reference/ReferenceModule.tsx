import { useNavigation } from '@react-navigation/native';
import React from 'react';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';

export default function ReferenceModule() {
  const navigation = useNavigation<any>();
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Reference</SectionHeader>
      <Grid>
        <CardTopic
          title="Bookmark"
          icon="bookmark-outline"
          onPress={() => navigation.navigate('Bookmark')}
        />
        <CardTopic
          title="Health"
          icon="medkit-outline"
          onPress={() => navigation.navigate('Health')}
        />
        <CardTopic
          title="Flora"
          icon="leaf-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Flora',
              icon: 'leaf-outline',
            })
          }
        />
        <CardTopic
          title="Fauna"
          icon="paw-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Fauna',
              icon: 'paw-outline',
            })
          }
        />
        <CardTopic
          title="Gardening"
          icon="flower-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Gardening',
              icon: 'flower-outline',
            })
          }
        />
        <CardTopic
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
