import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
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
            byCat[cat].map(n => (
              <View key={n.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>
                  {n.text?.slice(0, MAX_TITLE_LENGTH) || '(Untitled)'}
                </Text>
                <Text style={styles.itemMeta}>
                  {new Date(n.createdAt).toLocaleString()}
                </Text>
              </View>
            ))
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
});
