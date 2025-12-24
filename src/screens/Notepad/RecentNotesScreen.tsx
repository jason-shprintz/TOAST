import { observer } from 'mobx-react-lite';
import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useCoreStore } from '../../stores';
import { COLORS } from '../../theme';
import { MAX_TITLE_LENGTH } from './constants';
import { noteListSharedStyles as shared } from './noteListStyles';

/**
 * Displays the 20 most recently created notes in a scrollable list with expand/collapse behavior.
 *
 * @remarks
 * Notes are sourced from the core store (`core.recentNotesTop20`). Each list item shows:
 * - A single-line title derived from the note text (truncated to `MAX_TITLE_LENGTH`) or `(Untitled)`.
 * - A preview body truncated to 3 lines when collapsed, or the full text when expanded.
 * - A “Show more…” hint when collapsed and the note has text.
 * - Metadata including the localized creation timestamp and the note category.
 *
 * Tapping an item toggles its expanded state; only one note is expanded at a time (`expandedId`).
 * A trash action is provided per item, which stops event propagation to avoid toggling expansion,
 * then confirms deletion via an alert before calling `core.deleteNote`.
 *
 * When there are no notes, an empty state message is rendered.
 *
 * @returns The Recent Notes screen content.
 */
export default observer(function RecentNotesScreen() {
  const core = useCoreStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const data = useMemo(() => core.recentNotesTop20, [core.recentNotesTop20]);
  return (
    <ScreenBody>
      <SectionHeader>Recent Notes</SectionHeader>
      <View style={styles.card}>
        <FlatList
          style={styles.list}
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isExpanded = expandedId === item.id;
            const previewTitle = item.title || '(Untitled)';
            const previewText = item.text || '';
            return (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() =>
                  setExpandedId(prev => (prev === item.id ? null : item.id))
                }
              >
                <View style={shared.itemRow}>
                  <Text
                    style={shared.itemTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {previewTitle
                      ? previewTitle.slice(0, MAX_TITLE_LENGTH)
                      : '(Untitled)'}
                  </Text>

                  {isExpanded ? (
                    <Text style={shared.itemBodyExpanded}>
                      {previewText || ''}
                    </Text>
                  ) : (
                    <Text
                      style={shared.itemBody}
                      numberOfLines={3}
                      ellipsizeMode="tail"
                    >
                      {previewText || ''}
                    </Text>
                  )}
                  {!isExpanded && previewText && (
                    <Text style={shared.moreHint}>Show more…</Text>
                  )}
                  <View style={shared.actionsRow}>
                    <Text style={shared.itemMeta}>
                      {new Date(item.createdAt).toLocaleString()} •{' '}
                      {item.category}
                    </Text>
                    {/* DELETE */}
                    <TouchableOpacity
                      accessibilityLabel="Delete note"
                      accessibilityRole="button"
                      style={shared.trashButton}
                      onPress={e => {
                        e.stopPropagation();
                        Alert.alert(
                          'Delete Note',
                          'Are you sure you want to delete this note?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => core.deleteNote(item.id),
                            },
                          ],
                        );
                      }}
                    >
                      <Icon
                        name="trash-outline"
                        size={18}
                        color={COLORS.PRIMARY_DARK}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={shared.value}>No notes yet.</Text>}
        />
      </View>
    </ScreenBody>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 112,
    flex: 1,
  },
  list: {
    flex: 1,
  },
});
