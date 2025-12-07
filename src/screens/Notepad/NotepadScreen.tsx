import { useNavigation } from '@react-navigation/native';
import React from 'react';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import PlaceholderCard from '../../components/PlaceholderCard';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';

export default function NotepadScreen() {
  const navigation = useNavigation<any>();
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Notepad</SectionHeader>

      <Grid>
        <PlaceholderCard
          title="New Note"
          icon="create-outline"
          onPress={() => navigation.navigate('NewNote')}
        />
        <PlaceholderCard
          title="Recent Notes"
          icon="time-outline"
          onPress={() => navigation.navigate('RecentNotes')}
        />
        <PlaceholderCard
          title="Saved Notes"
          icon="save-outline"
          onPress={() => navigation.navigate('SavedNotes')}
        />
      </Grid>
    </ScreenContainer>
  );
}
