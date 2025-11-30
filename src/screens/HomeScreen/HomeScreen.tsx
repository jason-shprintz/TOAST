import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../theme';
import { HomeScreenProps } from './types/homeScreenTypes';

const MODULES = [
  { name: 'Core', screen: 'CoreModule', color: COLORS.TOAST_BROWN },
  { name: 'Navigation', screen: 'NavigationModule', color: COLORS.ACCENT },
  {
    name: 'Reference',
    screen: 'ReferenceModule',
    color: COLORS.SECONDARY_ACCENT,
  },
  { name: 'Signals', screen: 'SignalsModule', color: COLORS.PRIMARY_LIGHT },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>TOAST</Text>

      <View style={styles.grid}>
        {MODULES.map(mod => (
          <TouchableOpacity
            key={mod.name}
            style={[styles.tile, { backgroundColor: mod.color }]}
            onPress={() => navigation.navigate(mod.screen)}
          >
            <Text style={styles.tileText}>{mod.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.PRIMARY_DARK,
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  tileText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
  },
});
