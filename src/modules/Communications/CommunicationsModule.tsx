import { useNavigation } from '@react-navigation/native';
import React from 'react';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import PlaceholderCard from '../../components/PlaceholderCard';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';

export default function CommunicationsModule() {
  const navigation = useNavigation<any>();
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Communications</SectionHeader>
      <Grid>
        <PlaceholderCard
          title="Ham Radio"
          icon="radio-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Ham Radio',
              icon: 'radio-outline',
            })
          }
        />
        <PlaceholderCard
          title="Morse Code"
          icon="code-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Morse Code',
              icon: 'code-outline',
            })
          }
        />
        <PlaceholderCard
          title="Bluetooth"
          icon="bluetooth-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Bluetooth',
              icon: 'bluetooth-outline',
            })
          }
        />
      </Grid>
    </ScreenContainer>
  );
}
