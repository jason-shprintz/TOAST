/**
 * Quick Actions Bar component
 * @format
 */

import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../../components/ScaledText';
import { useTheme } from '../../../hooks/useTheme';

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
  const COLORS = useTheme();

  // Create dynamic styles using theme colors
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          ...styles.container,
          backgroundColor: COLORS.PRIMARY_LIGHT,
        },
        button: {
          ...styles.button,
          backgroundColor: COLORS.SECONDARY_ACCENT,
        },
        buttonDisabled: {
          ...styles.buttonDisabled,
          backgroundColor: COLORS.PRIMARY_DARK,
        },
        buttonText: {
          ...styles.buttonText,
          color: COLORS.PRIMARY_LIGHT,
        },
        errorContainer: {
          ...styles.errorContainer,
          backgroundColor: COLORS.ERROR_LIGHT,
          borderColor: COLORS.ERROR,
        },
        errorText: {
          ...styles.errorText,
          color: COLORS.ERROR,
        },
      }),
    [COLORS],
  );

  return (
    <View style={dynamicStyles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            dynamicStyles.button,
            isRunning && dynamicStyles.buttonDisabled,
          ]}
          onPress={onFindNearestWater}
          disabled={isRunning}
          activeOpacity={0.7}
        >
          <Text style={dynamicStyles.buttonText}>Find Nearest Water</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            dynamicStyles.button,
            isRunning && dynamicStyles.buttonDisabled,
          ]}
          onPress={onFindHighestElevation}
          disabled={isRunning}
          activeOpacity={0.7}
        >
          <Text style={dynamicStyles.buttonText}>
            Find Highest Elevation (5 mi)
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={dynamicStyles.errorContainer}>
          <Text style={dynamicStyles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 11,
    textAlign: 'center',
  },
});
