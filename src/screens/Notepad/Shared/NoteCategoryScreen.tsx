import { useRoute, useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useMemo } from 'react';
import { Text, StyleSheet, ScrollView, View } from 'react-native';
import CardTopic from '../../../components/CardTopic';
import Grid from '../../../components/Grid';
import ScreenBody from '../../../components/ScreenBody';
import SectionHeader from '../../../components/SectionHeader';
import { useCoreStore } from '../../../stores';
import { NoteCategory } from '../../../stores/CoreStore';
import { FOOTER_HEIGHT } from '../../../theme';

/**
 * Displays all notes for a specific category.
 *
 * This screen retrieves the category name from the navigation route parameters
 * and displays all notes belonging to that category in a grid layout using CardTopic components.
 * If no notes are found for the category, a helper message is shown.
 *
 * @returns {JSX.Element} The rendered note category screen component.
 *
 * @remarks
 * - Reads notes from the CoreStore grouped by category.
 * - Navigates back to NotepadScreen when category has no notes.
 * - Similar UI/UX pattern to the Reference module's CategoryScreen.
 */
export default observer(function NoteCategoryScreen(): React.JSX.Element {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const core = useCoreStore();

  const { category } = route.params || {};
  const notes = useMemo(
    () => core.notesByCategory[category as NoteCategory] ?? [],
    [category, core.notesByCategory],
  );

  const sortedNotes = useMemo(
    () =>
      notes.slice().sort(
        (a, b) => b.createdAt - a.createdAt, // Most recent first
      ),
    [notes],
  );

  return (
    <ScreenBody>
      <SectionHeader>{category}</SectionHeader>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {sortedNotes.length === 0 && (
            <Text style={styles.helperText}>
              No notes in this category yet.
            </Text>
          )}
          <Grid>
            {sortedNotes.map(note => {
              const titleText = note.title || '(Untitled)';
              return (
                <CardTopic
                  key={note.id}
                  title={titleText}
                  icon="document-text-outline"
                  onPress={() => {
                    navigation.navigate('NoteEntry', { note });
                  }}
                />
              );
            })}
          </Grid>
        </ScrollView>
      </View>
    </ScreenBody>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    paddingBottom: FOOTER_HEIGHT,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    paddingBottom: 24,
    alignItems: 'center',
  },
  helperText: {
    fontSize: 16,
    opacity: 0.8,
    marginHorizontal: 6,
    marginBottom: 12,
  },
});
