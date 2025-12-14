import { useNavigation } from '@react-navigation/native';
import React from 'react';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import CardTopic from '../../components/CardTopic';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';

export default function NotepadScreen() {
  const navigation = useNavigation<any>();
  return (
    <ScreenContainer>
      <LogoHeader />
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
    </ScreenContainer>
  );
}
