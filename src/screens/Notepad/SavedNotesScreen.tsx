import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LogoHeader from '../../components/LogoHeader';
import SectionHeader from '../../components/SectionHeader';
import { COLORS } from '../../theme';
import { observer } from 'mobx-react-lite';
import { useCoreStore } from '../../stores';
import { MAX_TITLE_LENGTH } from './constants';
import ScreenScrollContainer from '../../components/ScreenScrollContainer';

export default observer(function SavedNotesScreen() {
  const core = useCoreStore();
  const byCat = core.notesByCategory;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <ScreenScrollContainer>
      <LogoHeader />
      <SectionHeader>Saved Notes</SectionHeader>
      {core.categories.map(cat => (
        <View key={cat} style={styles.card}>
          <Text style={styles.label}>{cat}</Text>
          {byCat[cat].length === 0 ? (
            <Text style={styles.value}>No notes in this category.</Text>
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
                  <View style={styles.itemRow}>
                    <Text
                      style={styles.itemTitle}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {previewText
                        ? previewText.slice(0, MAX_TITLE_LENGTH)
                        : '(Untitled)'}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {new Date(n.createdAt).toLocaleString()}
                    </Text>
                    {isExpanded ? (
                      <Text style={styles.itemBodyExpanded}>
                        {previewText || ''}
                      </Text>
                    ) : (
                      <Text
                        style={styles.itemBody}
                        numberOfLines={3}
                        ellipsizeMode="tail"
                      >
                        {previewText || ''}
                      </Text>
                    )}
                    {!isExpanded &&
                      previewText &&
                      previewText.length > MAX_TITLE_LENGTH && (
                        <Text style={styles.moreHint}>Show more…</Text>
                      )}
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        accessibilityLabel="Delete note"
                        accessibilityRole="button"
                        style={styles.trashButton}
                        onPress={() => {
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
    </ScreenScrollContainer>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: COLORS.TOAST_BROWN,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.9,
    marginBottom: 6,
    fontWeight: '700',
  },
  value: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
  },
  itemRow: {
    paddingVertical: 8,
    borderBottomColor: COLORS.SECONDARY_ACCENT,
    borderBottomWidth: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
    fontWeight: '600',
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.8,
    marginTop: 2,
  },
  itemBody: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginTop: 6,
  },
  itemBodyExpanded: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginTop: 6,
  },
  moreHint: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  trashButton: {
    padding: 4,
  },
});
