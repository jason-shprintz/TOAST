/**
 * Download Region Screen
 * Main screen for downloading offline regions
 * @format
 */

import React, { useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../../components/ScaledText';
import ScreenBody from '../../../components/ScreenBody';
import { COLORS } from '../../../theme';
import DownloadProgressView from './DownloadProgressView';
import DownloadRegionCard from './DownloadRegionCard';
import { useDownloadRegion } from './useDownloadRegion';
import type { UseDownloadRegionOptions } from './useDownloadRegion';

export interface DownloadRegionScreenProps extends Omit<
  UseDownloadRegionOptions,
  'defaultRadiusMiles'
> {
  /**
   * Callback when user wants to view the offline map
   */
  onViewOfflineMap?: () => void;
  /**
   * Callback when user wants to go back
   */
  onBack?: () => void;
}

/**
 * DownloadRegionScreen - Main screen for downloading offline regions
 */
export default function DownloadRegionScreen({
  regionRepo,
  downloadManager,
  getCurrentLocation,
  onViewOfflineMap,
  onBack,
  regionStorage,
}: DownloadRegionScreenProps) {
  const {
    draft,
    estimate,
    jobId,
    phase,
    percent,
    message,
    status,
    error,
    initDraft,
    runEstimate,
    startDownload,
    pause,
    resume,
    cancel,
    deleteTemp,
  } = useDownloadRegion({
    regionRepo,
    downloadManager,
    getCurrentLocation,
    defaultRadiusMiles: 25,
    regionStorage,
  });

  // Initialize draft on mount if idle
  useEffect(() => {
    if (status === 'idle') {
      initDraft();
    }
  }, [status, initDraft]);

  // Run estimate after draft is ready (only once)
  useEffect(() => {
    if (draft && !estimate && status === 'estimating') {
      runEstimate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, status]); // Intentionally omit estimate to prevent re-runs

  const handleStartDownload = useCallback(() => {
    startDownload();
  }, [startDownload]);

  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  const handleResume = useCallback(() => {
    resume();
  }, [resume]);

  const handleCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  const handleRetry = useCallback(() => {
    resume();
  }, [resume]);

  const handleDeleteTemp = useCallback(() => {
    deleteTemp();
  }, [deleteTemp]);

  const handleViewOfflineMap = useCallback(() => {
    if (onViewOfflineMap) {
      onViewOfflineMap();
    }
  }, [onViewOfflineMap]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  // Render loading state
  if (status === 'estimating' && !estimate) {
    return (
      <ScreenBody>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.SECONDARY_ACCENT} />
          <Text style={styles.loadingText}>Preparing download...</Text>
        </View>
      </ScreenBody>
    );
  }

  // Render error state (before download starts)
  if (status === 'error' && !jobId) {
    return (
      <ScreenBody>
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenBody>
    );
  }

  // Render complete state
  if (status === 'complete') {
    return (
      <ScreenBody>
        <View style={styles.centerContainer}>
          <Text style={styles.successTitle}>Region Ready!</Text>
          <Text style={styles.successMessage}>
            Your offline region has been downloaded successfully.
          </Text>
          <DownloadRegionCard
            draft={draft}
            estimate={estimate}
            onViewOfflineMap={handleViewOfflineMap}
            showCompleteButton={true}
          />
          {onBack && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScreenBody>
    );
  }

  // Render main download UI
  return (
    <ScreenBody>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Download Offline Region</Text>
          {onBack && (
            <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
              <Text style={styles.backLink}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Region Card - Show when ready to download */}
        {status === 'readyToDownload' && (
          <DownloadRegionCard
            draft={draft}
            estimate={estimate}
            onStartDownload={handleStartDownload}
            showStartButton={true}
          />
        )}

        {/* Progress View - Show when downloading/paused/error */}
        {(status === 'downloading' ||
          status === 'paused' ||
          (status === 'error' && jobId)) && (
          <>
            <DownloadRegionCard draft={draft} estimate={estimate} />
            <View style={styles.spacer} />
            <DownloadProgressView
              phase={phase}
              percent={percent}
              message={message}
              status={status}
              error={error}
              onPause={status === 'downloading' ? handlePause : undefined}
              onResume={status === 'paused' ? handleResume : undefined}
              onCancel={handleCancel}
              onRetry={status === 'error' ? handleRetry : undefined}
            />
            {status === 'error' && (
              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={handleDeleteTemp}
                activeOpacity={0.7}
              >
                <Text style={styles.dangerButtonText}>
                  Delete Temporary Files
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 8,
  },
  backLink: {
    fontSize: 14,
    color: COLORS.SECONDARY_ACCENT,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.ERROR,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.SECONDARY_ACCENT,
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  spacer: {
    height: 16,
  },
  button: {
    backgroundColor: COLORS.SECONDARY_ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: COLORS.BACKGROUND,
  },
  secondaryButtonText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  dangerButton: {
    backgroundColor: COLORS.ERROR,
  },
  dangerButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
