import { useNavigation } from '@react-navigation/native';
import React, { JSX } from 'react';
import { ScrollView } from 'react-native';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import data from '../../data/health.json';

const categoryMap: Record<string, string> = {
  Emergency: 'Emergency',
  Illness: 'Illness',
  Injury: 'Injury',
  Preventative: 'Preventive',
};

/**
 * Displays the Health reference screen, providing navigation to various health-related categories.
 *
 * This screen presents a grid of topics including Emergency, Illness, Injury, and Preventive,
 * each represented by a `CardTopic` component. Selecting a topic navigates to the 'Category' screen
 * with the corresponding category data.
 *
 * @returns {JSX.Element} The rendered HealthScreen component.
 */
export default function HealthScreen(): JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Health</SectionHeader>
      <ScrollView>
        <Grid>
          <CardTopic
            title="Emergency"
            icon="alert-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.Emergency,
                title: 'Emergency',
                data: data,
              })
            }
          />
          <CardTopic
            title="Illness"
            icon="medkit-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.Illness,
                title: 'Illness',
                data: data,
              })
            }
          />
          <CardTopic
            title="Injury"
            icon="bandage-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.Injury,
                title: 'Injury',
                data: data,
              })
            }
          />
          <CardTopic
            title="Preventive"
            icon="shield-checkmark-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.Preventative,
                title: 'Preventive',
                data: data,
              })
            }
          />
        </Grid>
      </ScrollView>
    </ScreenContainer>
  );
}
