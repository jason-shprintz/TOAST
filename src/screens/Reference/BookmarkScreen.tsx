import { useNavigation } from '@react-navigation/native';
import React, { JSX, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import { getBookmarks, BookmarkItem } from '../../stores/BookmarksStore';

/**
 * Displays a list of bookmarked health entries for the user.
 *
 * - Fetches bookmarks using `getBookmarks` and displays them in a grid.
 * - Navigates to the detailed view of a health entry when a bookmark is selected.
 * - Shows a helper message if there are no bookmarks.
 * - Reloads bookmarks whenever the screen gains focus.
 *
 * @component
 * @returns {JSX.Element} The rendered bookmark screen.
 */
export default function BookmarkScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<BookmarkItem[]>([]);

  const load = async () => {
    const list = await getBookmarks();
    setItems(list);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    load();
    return unsubscribe;
  }, [navigation]);

  const handleOpen = (item: BookmarkItem) => {
    navigation.navigate('HealthEntry', { id: item.id });
  };

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Bookmarks</SectionHeader>
      <ScrollView contentContainerStyle={styles.container}>
        {items.length === 0 && (
          <Text style={styles.helperText}>No bookmarks yet.</Text>
        )}
        {items.length > 0 && (
          <Grid>
            {items
              .slice()
              .sort((a, b) => a.title.localeCompare(b.title))
              .map(item => (
                <CardTopic
                  key={item.id}
                  title={item.title}
                  icon="document-text-outline"
                  onPress={() => handleOpen(item)}
                />
              ))}
          </Grid>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  helperText: {
    fontSize: 16,
    opacity: 0.8,
    marginHorizontal: 6,
    marginTop: 12,
  },
});
