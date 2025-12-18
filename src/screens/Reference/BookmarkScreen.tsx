import { useNavigation } from '@react-navigation/native';
import React, { JSX, useEffect, useMemo, useState } from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import healthData from '../../data/health.json';
import survivalData from '../../data/survival.json';
import weatherData from '../../data/weather.json';
import {
  getBookmarks,
  BookmarkItem,
  clearBookmarks,
} from '../../stores/BookmarksStore';
import ReferenceEntryType from '../../types/data-type';

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

  // Create a Map for O(1) lookup performance instead of O(n) for each find operation
  // Using useMemo to lazily initialize only when component mounts
  const entryMap = useMemo(() => {
    const allEntries = [
      ...healthData.entries,
      ...survivalData.entries,
      ...weatherData.entries,
    ];

    // Development-time check for duplicate IDs
    if (__DEV__) {
      const ids = allEntries.map(entry => entry.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        console.error(
          'Duplicate entry IDs detected across data sources. This may cause entries to be overwritten.'
        );
      }
    }

    return new Map<string, ReferenceEntryType>(
      allEntries.map(entry => [entry.id, entry])
    );
  }, []);

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
    const entry = entryMap.get(item.id);

    if (!entry) {
      console.warn('Bookmark entry not found for id:', item.id);
      return;
    }

    navigation.navigate('Entry', { entry });
  };

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Bookmarks</SectionHeader>
      {/* DEV ONLY */}
      {__DEV__ && (
        <Text
          onPress={async () => {
            await clearBookmarks();
            await load();
          }}
          style={styles.dev}
        >
          Clear all bookmarks (dev)
        </Text>
      )}
      {/* END DEV ONLY */}
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
  dev: { marginBottom: 8, opacity: 0.7 },
});
