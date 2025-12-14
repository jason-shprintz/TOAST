import { useRoute } from '@react-navigation/native';
import React, { JSX, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import data from '../../data/health.json';
import {
  addBookmark,
  removeBookmark,
  isBookmarked,
} from '../../stores/BookmarksStore';
import { COLORS } from '../../theme';

/**
 * Displays detailed information for a specific health reference entry, including summary, steps, cautions, and notes.
 * 
 * This screen allows users to view the content of a health entry, bookmark or remove the bookmark for the entry,
 * and see categorized information such as steps to follow, things to avoid, warning signs, and additional notes.
 * 
 * - Fetches the entry by `id` from navigation route parameters.
 * - Checks and manages bookmark status for the entry.
 * - Renders entry details in categorized sections if available.
 * - Handles missing or invalid entry gracefully with a fallback message.
 * 
 * @returns {JSX.Element} The rendered health entry screen component.
 */
export default function HealthEntryScreen(): JSX.Element {
  const route = useRoute<any>();
  const { id } = route.params || {};
  const [bookmarked, setBookmarked] = useState<boolean>(false);

  const entry = useMemo(() => {
    return (data.entries || []).find(e => e.id === id);
  }, [id]);

  useEffect(() => {
    const check = async () => {
      if (id) setBookmarked(await isBookmarked(id));
    };
    check();
  }, [id]);

  const toggleBookmark = async () => {
    if (!entry) return;
    if (bookmarked) {
      await removeBookmark(entry.id);
      setBookmarked(false);
    } else {
      await addBookmark({
        id: entry.id,
        title: entry.title,
        category: entry.category,
      });
      setBookmarked(true);
    }
  };

  if (!entry) {
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
      <SectionHeader>{entry.title}</SectionHeader>
      <View style={styles.actions}>
        <TouchableOpacity onPress={toggleBookmark} style={styles.actionBtn}>
          <Text style={styles.actionText}>
            {bookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {!!entry.summary && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Summary</Text>
            <Text style={styles.cardBody}>{entry.summary}</Text>
          </View>
        )}

        {!!entry.steps?.length && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Steps</Text>
            {entry.steps.map((s: string, idx: number) => (
              <Text key={idx} style={styles.listItem}>{`• ${s}`}</Text>
            ))}
          </View>
        )}

        {!!entry.do_not?.length && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Do Not</Text>
            {entry.do_not.map((s: string, idx: number) => (
              <Text key={idx} style={styles.listItem}>{`• ${s}`}</Text>
            ))}
          </View>
        )}

        {!!entry.watch_for?.length && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Watch For</Text>
            {entry.watch_for.map((s: string, idx: number) => (
              <Text key={idx} style={styles.listItem}>{`• ${s}`}</Text>
            ))}
          </View>
        )}

        {!!entry.notes?.length && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            {entry.notes.map((s: string, idx: number) => (
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
  actionText: {
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
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
