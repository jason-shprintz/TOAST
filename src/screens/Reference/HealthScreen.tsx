import { useNavigation } from '@react-navigation/native';
import React from 'react';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import PlaceholderCard from '../../components/PlaceholderCard';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';

export default function HealthScreen() {
  const navigation = useNavigation<any>();
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Health</SectionHeader>
      <Grid>
        <PlaceholderCard
          title="Emergency"
          icon="alert-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Emergency',
              icon: 'alert-outline',
            })
          }
        />
        <PlaceholderCard
          title="Illness"
          icon="medkit-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Illness',
              icon: 'medkit-outline',
            })
          }
        />
        <PlaceholderCard
          title="Injury"
          icon="bandage-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Injury',
              icon: 'bandage-outline',
            })
          }
        />
        <PlaceholderCard
          title="Preventative"
          icon="shield-checkmark-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Preventative',
              icon: 'shield-checkmark-outline',
            })
          }
        />
      </Grid>
    </ScreenContainer>
  );
}
