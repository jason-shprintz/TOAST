import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import PlaceholderCard from '../../components/PlaceholderCard';
import { COLORS } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import SectionHeader from '../../components/SectionHeader';

export default function SignalsModule() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/toast-logo.png')}
        style={styles.logo}
      />
      <SectionHeader>Signals</SectionHeader>
      <View style={styles.grid}>
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
      </View>
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
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 10,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    borderRadius: 90,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
  },
});
