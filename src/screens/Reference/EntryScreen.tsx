import { useRoute } from '@react-navigation/native';
import React, { JSX, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import {
  addBookmark,
  removeBookmark,
  isBookmarked,
} from '../../stores/BookmarksStore';
import { COLORS } from '../../theme';

export type ReferenceEntry = {
  id: string;
  title: string;
  summary?: string;
  steps?: string[];
  do_not?: string[];
  watch_for?: string[];
  notes?: string[];
};

type Props = {
  entry?: ReferenceEntry | null; // Optional direct entry; typically provided via route params by Category screens
};

/**
 * Shared screen to render a reference entry's details (summary, steps, do_not, watch_for, notes).
 * Accepts an optional `headerRight` element to render actions (e.g., bookmark toggle) beside the header.
 */
export default function EntryScreen({ entry }: Props): JSX.Element {
  const route = useRoute<any>();
  const { entry: routeEntry } = route.params || {};

  const resolvedEntry: ReferenceEntry | null = useMemo(() => {
    if (entry) return entry as ReferenceEntry;
    if (routeEntry) return routeEntry as ReferenceEntry;
    return null;
  }, [entry, routeEntry]);

  const [bookmarked, setBookmarked] = useState<boolean>(false);

  useEffect(() => {
    const check = async () => {
      const entryId = resolvedEntry?.id;
      if (entryId) setBookmarked(await isBookmarked(entryId));
    };
    check();
  }, [resolvedEntry?.id]);

  const toggleBookmark = async () => {
    if (!resolvedEntry) return;
    if (bookmarked) {
      await removeBookmark(resolvedEntry.id);
      setBookmarked(false);
    } else {
      await addBookmark({
        id: resolvedEntry.id,
        title: resolvedEntry.title,
        category: routeEntry?.category || '',
      });
      setBookmarked(true);
    }
  };

  if (!resolvedEntry) {
    return (
      <ScreenContainer>
        <LogoHeader />
        <SectionHeader>Topic Not Found</SectionHeader>
        <View style={styles.missingWrap}>
          <Text style={styles.helperText}>
            No data available for this topic.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>{resolvedEntry.title}</SectionHeader>
      <View style={styles.actions}>
        <TouchableOpacity onPress={toggleBookmark} style={styles.actionBtn}>
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={COLORS.PRIMARY_DARK}
          />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {!!resolvedEntry.summary && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Summary</Text>
            <Text style={styles.cardBody}>{resolvedEntry.summary}</Text>
          </View>
        )}

        {!!resolvedEntry.steps?.length && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Steps</Text>
            {resolvedEntry.steps.map((s: string, idx: number) => (
              <Text key={idx} style={styles.listItem}>{`• ${s}`}</Text>
            ))}
          </View>
        )}

        {!!resolvedEntry.do_not?.length && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Do Not</Text>
            {resolvedEntry.do_not.map((s: string, idx: number) => (
              <Text key={idx} style={styles.listItem}>{`• ${s}`}</Text>
            ))}
          </View>
        )}

        {!!resolvedEntry.watch_for?.length && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Watch For</Text>
            {resolvedEntry.watch_for.map((s: string, idx: number) => (
              <Text key={idx} style={styles.listItem}>{`• ${s}`}</Text>
            ))}
          </View>
        )}

        {!!resolvedEntry.notes?.length && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            {resolvedEntry.notes.map((s: string, idx: number) => (
              <Text key={idx} style={styles.listItem}>{`• ${s}`}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: COLORS.TOAST_BROWN,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  missingWrap: {
    paddingHorizontal: 14,
    paddingVertical: 20,
  },
  helperText: {
    fontSize: 16,
    opacity: 0.8,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.TOAST_BROWN,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 20,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 6,
  },
});
