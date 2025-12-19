import { useNavigation } from '@react-navigation/native';
import { JSX } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { CategoryType } from '../types/common-types';
import CardTopic from './CardTopic';
import Grid from './Grid';
import SectionSubHeader from './SectionSubHeader';

type CategoryListProps = {
  categories: CategoryType[];
  disclaimer?: string;
};

/**
 * Renders a scrollable list of category cards using the provided categories.
 * Each card displays the category's title and icon, and navigates to the
 * 'Category' screen with the selected category's data when pressed.
 *
 * @param categories - An array of category objects to display in the list.
 * @returns A JSX element containing the scrollable grid of category cards.
 */
export default function CategoryList({
  categories,
  disclaimer = '',
}: CategoryListProps): JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionSubHeader>{disclaimer}</SectionSubHeader>
      <Grid>
        {categories.map(category => {
          return (
            <CardTopic
              key={category.id}
              title={category.title}
              icon={category.icon}
              onPress={() =>
                navigation.navigate('Category', {
                  title: category.title,
                  data: category.data,
                  disclaimer: disclaimer,
                })
              }
            />
          );
        })}
      </Grid>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
