/**
 * Overlay toggle controls component
 * @format
 */

import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Text } from '../../components/ScaledText';
import { useTheme } from '../../hooks/useTheme';
import type { OverlayState } from './mapAdapters/mapAdapter';

interface OverlayTogglesProps {
  overlays: OverlayState;
  onToggle: (key: keyof OverlayState, value: boolean) => void;
}

/**
 * Component rendering toggle switches for map overlays
 * Controlled component - state is managed by parent
 */
export default function OverlayToggles({
  overlays,
  onToggle,
}: OverlayTogglesProps) {
  const COLORS = useTheme();

  // Create dynamic styles using theme colors
  const dynamicStyles = StyleSheet.create({
    container: {
      ...styles.container,
      backgroundColor: COLORS.PRIMARY_LIGHT,
    },
    title: {
      ...styles.title,
      color: COLORS.PRIMARY_DARK,
    },
    label: {
      ...styles.label,
      color: COLORS.PRIMARY_DARK,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.title}>Overlays</Text>

      <View style={styles.toggleRow}>
        <Text style={dynamicStyles.label}>Water</Text>
        <Switch
          value={overlays.water}
          onValueChange={(value) => onToggle('water', value)}
          trackColor={{ false: '#999', true: COLORS.SECONDARY_ACCENT }}
          thumbColor={COLORS.PRIMARY_LIGHT}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text style={dynamicStyles.label}>Cities</Text>
        <Switch
          value={overlays.cities}
          onValueChange={(value) => onToggle('cities', value)}
          trackColor={{ false: '#999', true: COLORS.SECONDARY_ACCENT }}
          thumbColor={COLORS.PRIMARY_LIGHT}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text style={dynamicStyles.label}>Terrain</Text>
        <Switch
          value={overlays.terrain}
          onValueChange={(value) => onToggle('terrain', value)}
          trackColor={{ false: '#999', true: COLORS.SECONDARY_ACCENT }}
          thumbColor={COLORS.PRIMARY_LIGHT}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
  },
});
