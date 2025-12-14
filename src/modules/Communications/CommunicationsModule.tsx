import { useNavigation } from '@react-navigation/native';
import React from 'react';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';

export default function CommunicationsModule() {
  const navigation = useNavigation<any>();
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Communications</SectionHeader>
      <Grid>
        <CardTopic
          title="Ham Radio"
          icon="radio-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Ham Radio',
              icon: 'radio-outline',
            })
          }
        />
        <CardTopic
          title="Morse Code"
          icon="code-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Morse Code',
              icon: 'code-outline',
            })
          }
        />
        <CardTopic
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
