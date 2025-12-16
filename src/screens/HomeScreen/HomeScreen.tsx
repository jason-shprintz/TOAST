import React from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenScrollContainer';
import SectionHeader from '../../components/SectionHeader';
import { COLORS } from '../../theme';
import { HomeScreenProps } from './types/homeScreenTypes';

const MODULES = [
  { name: 'Core', screen: 'CoreModule', icon: 'apps-outline' },
  { name: 'Navigation', screen: 'NavigationModule', icon: 'compass-outline' },
  { name: 'Reference', screen: 'ReferenceModule', icon: 'book-outline' },
  {
    name: 'Comms',
    screen: 'CommunicationsModule',
    icon: 'call-outline',
  },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <ScreenContainer>
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

      {/* Hero Logo */}
      <LogoHeader />

      {/* Tagline */}
      <SectionHeader>Tech-Offline And Survival Tools</SectionHeader>

      {/* Module Grid */}
      <ScrollView>
        <Grid>
          {MODULES.map(mod => {
            return (
              <CardTopic
                key={mod.name}
                icon={mod.icon}
                title={mod.name}
                onPress={() => navigation.navigate(mod.screen)}
              />
            );
          })}
        </Grid>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 6,
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
