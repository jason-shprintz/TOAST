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
import { noteListSharedStyles as shared } from './noteListStyles';

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
                    <Text style={shared.itemMeta}>
                      {new Date(n.createdAt).toLocaleString()}
                    </Text>
                    {isExpanded ? (
                      <Text style={shared.itemBody}>{previewText || ''}</Text>
                    ) : (
                      <Text
                        style={shared.itemBody}
                        numberOfLines={3}
                        ellipsizeMode="tail"
                      >
                        {previewText || ''}
                      </Text>
                    )}
                    {!isExpanded &&
                      previewText &&
                      previewText.length > MAX_TITLE_LENGTH && (
                        <Text style={shared.moreHint}>Show more…</Text>
                      )}
                    <View style={shared.actionsRow}>
                      <TouchableOpacity
                        accessibilityLabel="Delete note"
                        accessibilityRole="button"
                        style={shared.trashButton}
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
});
