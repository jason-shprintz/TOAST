import { useNavigation } from '@react-navigation/native';
import React from 'react';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';

/**
 * Notepad landing screen.
 *
 * @remarks
 * Presents a simple dashboard of note-related actions and routes:
 * - **New Note** → navigates to the `NewNote` screen
 * - **Recent Notes** → navigates to the `RecentNotes` screen
 * - **Saved Notes** → navigates to the `SavedNotes` screen
 *
 * Uses React Navigation to perform screen transitions from card taps.
 *
 * @returns A screen layout containing a header and a grid of navigation cards.
 */
export default function NotepadScreen() {
  const navigation = useNavigation<any>();
  return (
    <ScreenBody>
      <SectionHeader>Notepad</SectionHeader>

      <Grid>
        <CardTopic
          title="New Note"
          icon="create-outline"
          onPress={() => navigation.navigate('NewNote')}
        />
        <CardTopic
          title="Recent Notes"
          icon="time-outline"
          onPress={() => navigation.navigate('RecentNotes')}
        />
        <CardTopic
          title="Saved Notes"
          icon="save-outline"
          onPress={() => navigation.navigate('SavedNotes')}
        />
      </Grid>
    </ScreenBody>
  );
}
