import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../theme';
import { HomeScreenProps } from './types/homeScreenTypes';

// Assign icons for each module
const MODULES = [
  { name: 'Core', screen: 'CoreModule', icon: 'apps-outline' },
  { name: 'Navigation', screen: 'NavigationModule', icon: 'compass-outline' },
  { name: 'Reference', screen: 'ReferenceModule', icon: 'book-outline' },
  { name: 'Signals', screen: 'SignalsModule', icon: 'radio-outline' },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  // Hero fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Tile bounce animation handler (per-tile)
  const createBounce = () => {
    const anim = new Animated.Value(1);
    return {
      anim,
      bounce: (callback?: () => void) => {
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.92,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 90,
            useNativeDriver: true,
          }),
        ]).start(() => callback && callback());
      },
    };
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Settings icon */}
      <TouchableWithoutFeedback>
        <View style={styles.settingsButton}>
          <Ionicons
            name="settings-outline"
            size={26}
            color={COLORS.PRIMARY_DARK}
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Hero Logo (fade-in) */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={require('../../../assets/toast-logo.png')}
          style={styles.logo}
        />
      </Animated.View>

      {/* Tagline */}
      <Text style={styles.tagline}>Tech-Offline And Survival Tools</Text>

      {/* Module Grid */}
      <View style={styles.grid}>
        {MODULES.map(mod => {
          const { anim, bounce } = createBounce();

          return (
            <TouchableWithoutFeedback
              key={mod.name}
              onPress={() => bounce(() => navigation.navigate(mod.screen))}
            >
              <Animated.View
                style={[styles.tile, { transform: [{ scale: anim }] }]}
              >
                <Ionicons
                  name={mod.icon}
                  size={40}
                  color={COLORS.PRIMARY_DARK}
                  style={{ marginBottom: 8 }}
                />
                <Text style={styles.tileText}>{mod.name}</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          );
        })}
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

  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 6,
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
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
  },
});
