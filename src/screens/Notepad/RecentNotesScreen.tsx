import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import LogoHeader from '../../components/LogoHeader';
import SectionHeader from '../../components/SectionHeader';
import { COLORS } from '../../theme';
import { observer } from 'mobx-react-lite';
import { useCoreStore } from '../../stores';
import { MAX_TITLE_LENGTH } from './constants';

export default observer(function RecentNotesScreen() {
  const core = useCoreStore();
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Recent Notes</SectionHeader>
      <View style={styles.card}>
        <FlatList
          data={core.recentNotesTop20}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <Text style={styles.itemTitle}>
                {item.text?.slice(0, MAX_TITLE_LENGTH) || '(Untitled)'}
              </Text>
              <Text style={styles.itemMeta}>
                {new Date(item.createdAt).toLocaleString()} • {item.category}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.value}>No notes yet.</Text>}
        />
      </View>
    </ScreenContainer>
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
