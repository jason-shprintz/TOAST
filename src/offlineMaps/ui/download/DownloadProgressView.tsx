/**
 * Download Progress View Component
 * Shows real-time download progress with phase and controls
 * @format
 */

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../../components/ScaledText';
import { useTheme } from '../../../hooks/useTheme';
import type { DownloadStatus } from './types';

interface DownloadProgressViewProps {
  phase?: string;
  percent?: number;
  message?: string;
  status: DownloadStatus;
  error?: string;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
}

/**
 * Map internal phase names to human-readable labels
 */
function getPhaseLabel(phase?: string): string {
  if (!phase) {
    return 'Preparing...';
  }

  const phaseLabels: Record<string, string> = {
    estimating: 'Estimating...',
    tiles: 'Downloading map tiles...',
    dem: 'Downloading elevation data...',
    overlays: 'Downloading overlays...',
    index: 'Building offline index...',
    finalise: 'Finalizing offline package...',
  };

  return phaseLabels[phase] || phase;
}

/**
 * DownloadProgressView - Shows download progress with controls
 */
export default function DownloadProgressView({
  phase,
  percent,
  message,
  status,
  error,
  onPause,
  onResume,
  onCancel,
  onRetry,
}: DownloadProgressViewProps) {
  const COLORS = useTheme();

  // Create dynamic styles using theme colors
  const dynamicStyles = useMemo(
    () => ({
      container: [styles.container, { backgroundColor: COLORS.PRIMARY_LIGHT }],
      phaseLabel: [styles.phaseLabel, { color: COLORS.PRIMARY_DARK }],
      progressBarBackground: [
        styles.progressBarBackground,
        { backgroundColor: COLORS.BACKGROUND },
      ],
      progressBarFill: [
        styles.progressBarFill,
        { backgroundColor: COLORS.SECONDARY_ACCENT },
      ],
      percentText: [styles.percentText, { color: COLORS.PRIMARY_DARK }],
      message: [styles.message, { color: COLORS.PRIMARY_DARK }],
      errorText: [styles.errorText, { color: COLORS.ERROR }],
      primaryButton: [
        styles.primaryButton,
        { backgroundColor: COLORS.SECONDARY_ACCENT },
      ],
      primaryButtonText: [
        styles.primaryButtonText,
        { color: COLORS.PRIMARY_LIGHT },
      ],
      secondaryButton: [
        styles.secondaryButton,
        { backgroundColor: COLORS.BACKGROUND },
      ],
      secondaryButtonText: [
        styles.secondaryButtonText,
        { color: COLORS.PRIMARY_DARK },
      ],
      dangerButton: [styles.dangerButton, { backgroundColor: COLORS.ERROR }],
      dangerButtonText: [
        styles.dangerButtonText,
        { color: COLORS.PRIMARY_LIGHT },
      ],
    }),
    [COLORS],
  );

  const showPauseButton = status === 'downloading' && onPause;
  const showResumeButton =
    (status === 'paused' || status === 'error') && onResume;
  const showRetryButton = status === 'error' && onRetry;

  return (
    <View style={dynamicStyles.container}>
      {/* Phase Label */}
      <Text style={dynamicStyles.phaseLabel}>{getPhaseLabel(phase)}</Text>

      {/* Progress Bar */}
      {percent !== undefined ? (
        <View style={styles.progressContainer}>
          <View style={dynamicStyles.progressBarBackground}>
            <View
              style={[
                dynamicStyles.progressBarFill,
                {
                  width: `${Math.max(0, Math.min(100, isFinite(percent) ? percent : 0))}%`,
                },
              ]}
            />
          </View>
          <Text style={dynamicStyles.percentText}>
            {Math.round(
              Math.max(0, Math.min(100, isFinite(percent) ? percent : 0)),
            )}
            %
          </Text>
        </View>
      ) : (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="small" color={COLORS.SECONDARY_ACCENT} />
        </View>
      )}

      {/* Message */}
      {message && <Text style={dynamicStyles.message}>{message}</Text>}

      {/* Error */}
      {error && <Text style={dynamicStyles.errorText}>{error}</Text>}

      {/* Controls */}
      <View style={styles.controls}>
        {showPauseButton && (
          <TouchableOpacity
            style={[styles.button, dynamicStyles.secondaryButton]}
            onPress={onPause}
            activeOpacity={0.7}
          >
            <Text style={dynamicStyles.secondaryButtonText}>Pause</Text>
          </TouchableOpacity>
        )}

        {showResumeButton && (
          <TouchableOpacity
            style={[styles.button, dynamicStyles.primaryButton]}
            onPress={onResume}
            activeOpacity={0.7}
          >
            <Text style={dynamicStyles.primaryButtonText}>Resume</Text>
          </TouchableOpacity>
        )}

        {showRetryButton && (
          <TouchableOpacity
            style={[styles.button, dynamicStyles.primaryButton]}
            onPress={onRetry}
            activeOpacity={0.7}
          >
            <Text style={dynamicStyles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}

        {onCancel && (
          <TouchableOpacity
            style={[styles.button, dynamicStyles.dangerButton]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={dynamicStyles.dangerButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  phaseLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  spinnerContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  message: {
    fontSize: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {},
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {},
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {},
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
