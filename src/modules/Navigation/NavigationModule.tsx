import React from 'react';
import { View, StyleSheet } from 'react-native';
import PlaceholderCard from '../../components/PlaceholderCard';
import { COLORS } from '../../theme';

export default function NavigationModule() {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <PlaceholderCard title="Map" icon="map-outline" />
        <PlaceholderCard title="Compass" icon="compass-outline" />
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
