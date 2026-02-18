/**
 * Download Progress View Component
 * Shows real-time download progress with phase and controls
 * @format
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../../components/ScaledText';
import { COLORS } from '../../../theme';
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
    finalise: 'Finalising offline package...',
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
  const showPauseButton = status === 'downloading' && onPause;
  const showResumeButton =
    (status === 'paused' || status === 'error') && onResume;
  const showRetryButton = status === 'error' && onRetry;

  return (
    <View style={styles.container}>
      {/* Phase Label */}
      <Text style={styles.phaseLabel}>{getPhaseLabel(phase)}</Text>

      {/* Progress Bar */}
      {percent !== undefined ? (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[styles.progressBarFill, { width: `${percent}%` }]}
            />
          </View>
          <Text style={styles.percentText}>{Math.round(percent)}%</Text>
        </View>
      ) : (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="small" color={COLORS.SECONDARY_ACCENT} />
        </View>
      )}

      {/* Message */}
      {message && <Text style={styles.message}>{message}</Text>}

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Controls */}
      <View style={styles.controls}>
        {showPauseButton && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onPause}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Pause</Text>
          </TouchableOpacity>
        )}

        {showResumeButton && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onResume}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>Resume</Text>
          </TouchableOpacity>
        )}

        {showRetryButton && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onRetry}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}

        {onCancel && (
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.dangerButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: COLORS.PRIMARY_LIGHT,
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
    color: COLORS.PRIMARY_DARK,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.PRIMARY_MEDIUM,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.SECONDARY_ACCENT,
    borderRadius: 4,
  },
  percentText: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    fontWeight: '600',
    textAlign: 'right',
  },
  spinnerContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  message: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.ERROR,
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
  primaryButton: {
    backgroundColor: COLORS.SECONDARY_ACCENT,
  },
  primaryButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.PRIMARY_MEDIUM,
  },
  secondaryButtonText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: COLORS.ERROR,
  },
  dangerButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 14,
    fontWeight: '600',
  },
});
