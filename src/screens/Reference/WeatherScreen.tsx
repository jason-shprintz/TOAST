import React, { JSX } from 'react';
import CategoryList from '../../components/CategoryList';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import data from '../../data/weather.json';
import { CategoryType } from '../../types/common-types';

const categoryMap: Record<string, Record<string, string>> = {
  ColdWeather: { type: 'Cold Weather' },
  HeatAndSun: { type: 'Heat & Sun' },
  RainAndFlooding: { type: 'Rain & Flooding' },
  WindAndStorms: { type: 'Wind & Storms' },
  SnowAndIce: { type: 'Snow & Ice' },
};

const weatherCategories: CategoryType[] = [
  {
    title: 'Cold Weather',
    icon: 'snow-outline',
    id: 'weather_cold_weather',
    category: categoryMap.ColdWeather,
    data: data.entries,
  },
  {
    title: 'Heat & Sun',
    icon: 'sunny-outline',
    id: 'weather_heat_and_sun',
    category: categoryMap.HeatAndSun,
    data: data.entries,
  },
  {
    title: 'Rain & Flooding',
    icon: 'rainy-outline',
    id: 'weather_rain_and_flooding',
    category: categoryMap.RainAndFlooding,
    data: data.entries,
  },
  {
    title: 'Wind & Storms',
    icon: 'thunderstorm-outline',
    id: 'weather_wind_and_storms',
    category: categoryMap.WindAndStorms,
    data: data.entries,
  },
  {
    title: 'Snow & Ice',
    icon: 'snow-sharp',
    id: 'weather_snow_and_ice',
    category: categoryMap.SnowAndIce,
    data: data.entries,
  },
];

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
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Weather</SectionHeader>
      <CategoryList categories={weatherCategories} />
    </ScreenContainer>
  );
}
