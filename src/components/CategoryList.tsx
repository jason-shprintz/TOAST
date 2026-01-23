import { useNavigation } from '@react-navigation/native';
import { JSX, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FOOTER_HEIGHT } from '../theme';
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

  // Sort categories alphabetically by title
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.title.localeCompare(b.title)),
    [categories],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {disclaimer.trim().length > 0 && (
          <SectionSubHeader>{disclaimer}</SectionSubHeader>
        )}
        <Grid>
          {sortedCategories.map((category) => {
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingBottom: FOOTER_HEIGHT,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 24,
  },
});
