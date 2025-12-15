import { useNavigation } from '@react-navigation/native';
import React, { JSX } from 'react';
import { ScrollView } from 'react-native';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import data from '../../data/weather.json';

const categoryMap: Record<string, string> = {
  ColdWeather: 'Cold Weather',
  HeatAndSun: 'Heat & Sun',
  RainAndFlooding: 'Rain & Flooding',
  WindAndStorms: 'Wind & Storms',
  SnowAndIce: 'Snow & Ice',
};

/**
 * Displays the Weather screen, providing navigation to various weather-related categories.
 *
 * This screen presents a grid of `CardTopic` components, each representing a different weather condition
 * (e.g., Cold Weather, Heat & Sun, Rain & Flooding, Wind & Storms, Snow & Ice). When a card is pressed,
 * the user is navigated to the corresponding category screen with relevant data.
 *
 * @returns {JSX.Element} The rendered WeatherScreen component.
 */
export default function WeatherScreen(): JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Weather</SectionHeader>
      <ScrollView>
        <Grid>
          <CardTopic
            title="Cold Weather"
            icon="snow-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.ColdWeather,
                title: 'Cold Weather',
                data: data,
              })
            }
          />
          <CardTopic
            title="Heat & Sun"
            icon="sunny-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.HeatAndSun,
                title: 'Heat & Sun',
                data: data,
              })
            }
          />
          <CardTopic
            title="Rain & Flooding"
            icon="rainy-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.RainAndFlooding,
                title: 'Rain & Flooding',
                data: data,
              })
            }
          />
          <CardTopic
            title="Wind & Storms"
            icon="thunderstorm-outline"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.WindAndStorms,
                title: 'Wind & Storms',
                data: data,
              })
            }
          />
          <CardTopic
            title="Snow & Ice"
            icon="snow-sharp"
            onPress={() =>
              navigation.navigate('Category', {
                category: categoryMap.SnowAndIce,
                title: 'Snow & Ice',
                data: data,
              })
            }
          />
        </Grid>
      </ScrollView>
    </ScreenContainer>
  );
}
