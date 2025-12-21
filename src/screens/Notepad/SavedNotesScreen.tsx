import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { HorizontalRule } from '../../components/HorizontalRule';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useCoreStore } from '../../stores';
import { COLORS } from '../../theme';
import { MAX_TITLE_LENGTH } from './constants';
import { noteListSharedStyles as shared } from './noteListStyles';

export default observer(function SavedNotesScreen() {
  const core = useCoreStore();
  const byCat = core.notesByCategory;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <ScreenBody>
      <SectionHeader>Saved Notes</SectionHeader>
      <HorizontalRule />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {core.categories.map(cat => (
          <View key={cat} style={styles.card}>
            <Text style={styles.label}>{cat}</Text>
            {byCat[cat].length === 0 ? (
              <Text style={shared.value}>No notes in this category.</Text>
            ) : (
              byCat[cat].map(n => {
                const isExpanded = expandedId === n.id;
                const previewText = n.text || '';
                return (
                  <TouchableOpacity
                    key={n.id}
                    accessibilityRole="button"
                    onPress={() =>
                      setExpandedId(prev => (prev === n.id ? null : n.id))
                    }
                  >
                    <View style={shared.itemRow}>
                      <Text
                        style={shared.itemTitle}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {previewText
                          ? previewText.slice(0, MAX_TITLE_LENGTH)
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
                          {new Date(n.createdAt).toLocaleString()}
                        </Text>
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
                                  onPress: () => core.deleteNote(n.id),
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
              })
            )}
          </View>
        ))}
      </ScrollView>
      <HorizontalRule />
    </ScreenBody>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  scrollContent: {
    width: '100%',
    paddingBottom: 24,
  },
  card: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    marginTop: 12,
  },
  label: {
    fontSize: 18,
    color: COLORS.PRIMARY_DARK,
    marginBottom: 6,
    fontWeight: '700',
    padding: 10,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    borderRadius: 10,
  },
});
