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
          title="Survival Guide"
          icon="leaf-outline"
          onPress={() => navigation.navigate('Survival')}
        />
        <CardTopic
          title="Weather"
          icon="rainy-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Weather',
              icon: 'rainy-outline',
            })
          }
        />
        <CardTopic
          title="Tools & Knots"
          icon="hammer-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Tools & Knots',
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
