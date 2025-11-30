import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../theme';
import { HomeScreenProps } from './types/homeScreenTypes';

const MODULES = [
  { name: 'Core', screen: 'CoreModule', color: COLORS.TOAST_BROWN },
  { name: 'Navigation', screen: 'NavigationModule', color: COLORS.TOAST_BROWN },
  {
    name: 'Reference',
    screen: 'ReferenceModule',
    color: COLORS.TOAST_BROWN,
  },
  { name: 'Signals', screen: 'SignalsModule', color: COLORS.TOAST_BROWN },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Settings icon */}
      <TouchableOpacity style={styles.settingsButton}>
        <Icon name="settings-outline" size={26} color={COLORS.PRIMARY_DARK} />
      </TouchableOpacity>

      {/* Hero Logo */}
      <Image
        source={require('../../../assets/toast-logo.png')}
        style={styles.logo}
      />

      {/* Tagline */}
      <Text style={styles.tagline}>Tech-Offline And Survival Tools</Text>

      {/* Module Grid */}
      <View style={styles.grid}>
        {MODULES.map(mod => (
          <TouchableOpacity
            key={mod.name}
            style={styles.tile}
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
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  // Settings
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 6,
  },

  // Toast Logo
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

  tagline: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '700',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
  },

  // Module Grid
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  tile: {
    width: '48%',
    height: 130,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    elevation: 2,
    backgroundColor: COLORS.TOAST_BROWN,
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 2,
  },

  tileText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
  },
});
