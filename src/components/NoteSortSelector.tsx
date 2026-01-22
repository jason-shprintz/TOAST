import { observer } from 'mobx-react-lite';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../stores';
import { NoteSortOrder } from '../stores/SettingsStore';
import { COLORS } from '../theme';
import { Text } from './ScaledText';

/**
 * A component that displays the current sort order and allows users to change it.
 * The sort order is persisted in the SettingsStore and affects all note lists globally.
 */
export const NoteSortSelector = observer(() => {
  const settingsStore = useSettingsStore();

  const sortOptions: { value: NoteSortOrder; label: string; icon: string }[] = [
    { value: 'newest-oldest', label: 'Newest', icon: 'arrow-down-outline' },
    { value: 'oldest-newest', label: 'Oldest', icon: 'arrow-up-outline' },
    { value: 'a-z', label: 'A-Z', icon: 'text-outline' },
    { value: 'z-a', label: 'Z-A', icon: 'text-outline' },
  ];

  const currentOption = sortOptions.find(
    opt => opt.value === settingsStore.noteSortOrder,
  );

  const cycleSort = () => {
    const currentIndex = sortOptions.findIndex(
      opt => opt.value === settingsStore.noteSortOrder,
    );
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    settingsStore.setNoteSortOrder(sortOptions[nextIndex].value);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={cycleSort}
      accessibilityLabel={`Sort by: ${
        currentOption?.label || 'Unknown'
      }. Tap to change.`}
      accessibilityRole="button"
      accessibilityHint="Cycles through sorting options"
    >
      <Ionicons
        name={currentOption?.icon || 'funnel-outline'}
        size={18}
        color={COLORS.PRIMARY_DARK}
      />
      <Text style={styles.label}>{currentOption?.label || 'Unknown'}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-end',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    width: '25%',
    textAlign: 'left',
    color: COLORS.PRIMARY_DARK,
  },
});
