import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LogoHeader from '../../components/LogoHeader';
import SectionHeader from '../../components/SectionHeader';
import { COLORS } from '../../theme';
import { observer } from 'mobx-react-lite';
import { useCoreStore } from '../../stores';
import { MAX_TITLE_LENGTH } from './constants';
import ScreenContainer from '../../components/ScreenContainer';

export default observer(function RecentNotesScreen() {
  const core = useCoreStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const data = useMemo(() => core.recentNotesTop20, [core.recentNotesTop20]);
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Recent Notes</SectionHeader>
      <View style={styles.card}>
        <FlatList
          style={styles.list}
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isExpanded = expandedId === item.id;
            const previewText = item.text || '';
            return (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() =>
                  setExpandedId(prev => (prev === item.id ? null : item.id))
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
                    {new Date(item.createdAt).toLocaleString()} •{' '}
                    {item.category}
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
                      onPress={() => {
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
    marginBottom: 16,
    flex: 1,
  },
  list: {
    flex: 1,
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
});
