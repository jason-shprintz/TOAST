import { useNavigation } from '@react-navigation/native';
import React, { JSX } from 'react';
// no local React Native imports needed
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import PlaceholderCard from '../../components/PlaceholderCard';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';

const categoryMap: Record<string, string> = {
  Emergency: 'Emergency',
  Illness: 'Illness',
  Injury: 'Injury',
  Preventative: 'Preventive',
};

/**
 * Displays the main Health screen with navigation options for different health-related categories.
 *
 * This screen presents a grid of cards, each representing a health category such as Emergency, Illness, Injury, and Preventative.
 * Selecting a card navigates the user to the corresponding HealthCategory screen, passing the selected category and title as parameters.
 *
 * @component
 * @returns {JSX.Element} The rendered Health screen component.
 */
export default function HealthScreen(): JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Health</SectionHeader>
      <Grid>
        <PlaceholderCard
          title="Emergency"
          icon="alert-outline"
          onPress={() =>
            navigation.navigate('HealthCategory', {
              category: categoryMap.Emergency,
              title: 'Emergency',
            })
          }
        />
        <PlaceholderCard
          title="Illness"
          icon="medkit-outline"
          onPress={() =>
            navigation.navigate('HealthCategory', {
              category: categoryMap.Illness,
              title: 'Illness',
            })
          }
        />
        <PlaceholderCard
          title="Injury"
          icon="bandage-outline"
          onPress={() =>
            navigation.navigate('HealthCategory', {
              category: categoryMap.Injury,
              title: 'Injury',
            })
          }
        />
        <PlaceholderCard
          title="Preventive"
          icon="shield-checkmark-outline"
          onPress={() =>
            navigation.navigate('HealthCategory', {
              category: categoryMap.Preventative,
              title: 'Preventive',
            })
          }
        />
      </Grid>
    </ScreenContainer>
  );
}
