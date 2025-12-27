import { useNavigation } from '@react-navigation/native';
import React from 'react';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { conversionCategories } from '../../utils/unitConversions';

/**
 * UnitConversionScreen displays all available unit conversion categories.
 *
 * Users can select a category to navigate to the conversion screen for that category.
 * Categories include Length, Weight, Volume, Temperature, Area, Speed, Pressure,
 * Energy, Time, Compass/Angles, Fuel, and Light.
 *
 * @returns A React element rendering the unit conversion categories grid.
 */
export default function UnitConversionScreen() {
  const navigation = useNavigation<any>();

  const openCategory = (categoryId: string) => {
    navigation.navigate('ConversionCategory', { categoryId });
  };

  return (
    <ScreenBody>
      <SectionHeader>Unit Conversion</SectionHeader>
      <Grid>
        {conversionCategories.map((category) => (
          <CardTopic
            key={category.id}
            title={category.name}
            icon={category.icon}
            onPress={() => openCategory(category.id)}
          />
        ))}
      </Grid>
    </ScreenBody>
  );
}
