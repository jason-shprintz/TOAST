import React from 'react';
import ScreenContainer from '../../components/ScreenContainer';
import LogoHeader from '../../components/LogoHeader';
import SectionHeader from '../../components/SectionHeader';
import Grid from '../../components/Grid';
import PlaceholderCard from '../../components/PlaceholderCard';
import { useNavigation } from '@react-navigation/native';

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
