import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import ToolList from '../../components/ToolList';
import { COLORS } from '../../theme';
import { ToolType } from '../../types/common-types';

const modules: ToolType[] = [
  { name: 'Core', screen: 'CoreModule', icon: 'apps-outline', id: 'home_core' },
  {
    name: 'Navigation',
    screen: 'NavigationModule',
    icon: 'compass-outline',
    id: 'home_navigation',
  },
  {
    name: 'Reference',
    screen: 'ReferenceModule',
    icon: 'book-outline',
    id: 'home_reference',
  },
  {
    name: 'Comms',
    screen: 'CommunicationsModule',
    icon: 'call-outline',
    id: 'home_communications',
  },
];

export default function HomeScreen() {
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
      <LogoHeader />
      <SectionHeader>Tech-Offline And Survival Tools</SectionHeader>

      <ToolList tools={modules} />
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
});
