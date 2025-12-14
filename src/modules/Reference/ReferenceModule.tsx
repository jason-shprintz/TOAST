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
          title="Survival Field"
          icon="leaf-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Survival Field',
              icon: 'leaf-outline',
            })
          }
        />
        <CardTopic
          title="Weather"
          icon="cloud-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Weather',
              icon: 'cloud-outline',
            })
          }
        />
        <CardTopic
          title="Tool & Knots"
          icon="hammer-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Tool & Knots',
              icon: 'hammer-outline',
            })
          }
        />
        <CardTopic
          title="Emergency"
          icon="warning-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Emergency',
              icon: 'warning-outline',
            })
          }
        />
      </Grid>
    </ScreenContainer>
  );
}
