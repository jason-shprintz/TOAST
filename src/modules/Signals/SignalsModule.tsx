import React from 'react';
import { View, StyleSheet } from 'react-native';
import PlaceholderCard from '../../components/PlaceholderCard';
import { COLORS } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import SectionHeader from '../../components/SectionHeader';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';

export default function SignalsModule() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <LogoHeader />
      <SectionHeader>Signals</SectionHeader>
      <Grid style={styles.gridSpacing}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  // grid replaced by shared Grid component
  gridSpacing: {
    paddingTop: 20,
  },
});
