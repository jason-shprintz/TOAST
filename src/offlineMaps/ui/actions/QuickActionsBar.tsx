/**
 * Quick Actions Bar component
 * @format
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../../components/ScaledText';
import { COLORS } from '../../../theme';

export interface QuickActionsBarProps {
  onFindNearestWater: () => void;
  onFindHighestElevation: () => void;
  isRunning: boolean;
  error?: string;
}

/**
 * QuickActionsBar - Renders quick action buttons for offline map
 */
export default function QuickActionsBar({
  onFindNearestWater,
  onFindHighestElevation,
  isRunning,
  error,
}: QuickActionsBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={onFindNearestWater}
          disabled={isRunning}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Find Nearest Water</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={onFindHighestElevation}
          disabled={isRunning}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Find Highest Elevation (5 mi)</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fee',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: '#c00',
    fontSize: 11,
    textAlign: 'center',
  },
});
