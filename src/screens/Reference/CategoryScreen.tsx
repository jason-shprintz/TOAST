import { useRoute, useNavigation } from '@react-navigation/native';
import React, { JSX, useMemo } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import ReferenceEntryType from '../../types/data-type';

/**
 * Displays a list of reference entries filtered by category.
 *
 * This screen retrieves the `category`, `title`, and `data` from the navigation route parameters,
 * filters the entries to only those matching the selected category, and displays them in a grid layout.
 * If no entries are found for the category, a helper message is shown.
 *
 * @returns {JSX.Element} The rendered category screen component.
 *
 * @remarks
 * - Navigates to the 'Entry' screen when a topic card is pressed, passing the selected entry as a parameter.
 * - Expects `route.params` to contain `category`, `title`, and `data.entries`.
 */
export default function CategoryScreen(): JSX.Element {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { category, title, data } = route.params || {};

  const entries = useMemo(() => {
    return (data.entries || []).filter(
      (e: ReferenceEntryType) => e.category === category,
    );
  }, [category, data.entries]);

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>{title || category}</SectionHeader>
      <ScrollView contentContainerStyle={styles.container}>
        {entries.length === 0 && (
          <Text style={styles.helperText}>No topics found.</Text>
        )}
        <Grid>
          {entries
            .slice()
            .sort((a: ReferenceEntryType, b: ReferenceEntryType) =>
              a.title.localeCompare(b.title),
            )
            .map((item: ReferenceEntryType) => (
              <CardTopic
                key={item.id}
                title={item.title}
                icon="document-text-outline"
                onPress={() => navigation.navigate('Entry', { entry: item })}
              />
            ))}
        </Grid>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  helperText: {
    fontSize: 16,
    opacity: 0.8,
    marginHorizontal: 6,
    marginBottom: 12,
  },
});
