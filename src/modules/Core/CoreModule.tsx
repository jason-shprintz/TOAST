import React from 'react';
import { View, StyleSheet } from 'react-native';
import PlaceholderCard from '../../components/PlaceholderCard';
import { COLORS } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import SectionHeader from '../../components/SectionHeader';

export default function CoreModule() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <SectionHeader>Core</SectionHeader>
      <View style={styles.grid}>
        <PlaceholderCard
          title="Flashlight"
          icon="flashlight-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Flashlight',
              icon: 'flashlight-outline',
            })
          }
        />
        <PlaceholderCard
          title="Notepad"
          icon="document-text-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Notepad',
              icon: 'document-text-outline',
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
    paddingTop: 20,
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
});
