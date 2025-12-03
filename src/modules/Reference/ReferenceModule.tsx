import React from 'react';
import PlaceholderCard from '../../components/PlaceholderCard';
import { useNavigation } from '@react-navigation/native';
import SectionHeader from '../../components/SectionHeader';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';

export default function ReferenceModule() {
  const navigation = useNavigation<any>();
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Reference</SectionHeader>
      <Grid>
        <PlaceholderCard
          title="Book"
          icon="book-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Book',
              icon: 'book-outline',
            })
          }
        />
        <PlaceholderCard
          title="Bookmark"
          icon="bookmark-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Bookmark',
              icon: 'bookmark-outline',
            })
          }
        />
      </Grid>
    </ScreenContainer>
  );
}
