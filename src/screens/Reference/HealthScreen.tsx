import { useNavigation } from '@react-navigation/native';
import React from 'react';
// no local React Native imports needed
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import PlaceholderCard from '../../components/PlaceholderCard';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';

const categoryMap: Record<string, string> = {
  Emergency: 'Emergency',
  Illness: 'Illness',
  Injury: 'Injury',
  Preventative: 'Preventive',
};

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
            navigation.navigate('HealthCategory', {
              category: categoryMap.Emergency,
              title: 'Emergency',
            })
          }
        />
        <PlaceholderCard
          title="Illness"
          icon="medkit-outline"
          onPress={() =>
            navigation.navigate('HealthCategory', {
              category: categoryMap.Illness,
              title: 'Illness',
            })
          }
        />
        <PlaceholderCard
          title="Injury"
          icon="bandage-outline"
          onPress={() =>
            navigation.navigate('HealthCategory', {
              category: categoryMap.Injury,
              title: 'Injury',
            })
          }
        />
        <PlaceholderCard
          title="Preventative"
          icon="shield-checkmark-outline"
          onPress={() =>
            navigation.navigate('HealthCategory', {
              category: categoryMap.Preventative,
              title: 'Preventative',
            })
          }
        />
      </Grid>
    </ScreenContainer>
  );
}

