/**
 * Download Region Card Component
 * Shows region info and download controls
 * @format
 */

import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../../components/ScaledText';
import { useTheme } from '../../../hooks/useTheme';
import type { DownloadRegionEstimate } from './types';
import type { OfflineRegionDraft } from '../../types';

interface DownloadRegionCardProps {
  draft?: OfflineRegionDraft;
  estimate?: DownloadRegionEstimate;
  onStartDownload?: () => void;
  onViewOfflineMap?: () => void;
  showStartButton?: boolean;
  showCompleteButton?: boolean;
}

/**
 * DownloadRegionCard - Shows region summary and actions
 */
export default function DownloadRegionCard({
  draft,
  estimate,
  onStartDownload,
  onViewOfflineMap,
  showStartButton = false,
  showCompleteButton = false,
}: DownloadRegionCardProps) {
  const COLORS = useTheme();

  // Create dynamic styles using theme colors
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          ...styles.container,
          backgroundColor: COLORS.PRIMARY_LIGHT,
        },
        sectionTitle: {
          ...styles.sectionTitle,
          color: COLORS.PRIMARY_DARK,
        },
        label: {
          ...styles.label,
          color: COLORS.PRIMARY_DARK,
        },
        value: {
          ...styles.value,
          color: COLORS.PRIMARY_DARK,
        },
        estimateCard: {
          ...styles.estimateCard,
          backgroundColor: COLORS.BACKGROUND,
        },
        totalSize: {
          ...styles.totalSize,
          color: COLORS.SECONDARY_ACCENT,
        },
        breakdownLabel: {
          ...styles.breakdownLabel,
          color: COLORS.PRIMARY_DARK,
        },
        breakdownValue: {
          ...styles.breakdownValue,
          color: COLORS.PRIMARY_DARK,
        },
        disclaimer: {
          ...styles.disclaimer,
          color: COLORS.PRIMARY_DARK,
        },
        primaryButton: {
          ...styles.primaryButton,
          backgroundColor: COLORS.SECONDARY_ACCENT,
        },
        primaryButtonText: {
          ...styles.primaryButtonText,
          color: COLORS.PRIMARY_LIGHT,
        },
      }),
    [COLORS],
  );

  return (
    <View style={dynamicStyles.container}>
      {/* Region Info */}
      {draft && (
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Region Details</Text>
          <View style={styles.infoRow}>
            <Text style={dynamicStyles.label}>Center:</Text>
            <Text style={dynamicStyles.value}>
              {draft.centerLat.toFixed(4)}, {draft.centerLng.toFixed(4)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={dynamicStyles.label}>Radius:</Text>
            <Text style={dynamicStyles.value}>{draft.radiusMiles} miles</Text>
          </View>
        </View>
      )}

      {/* Size Estimate */}
      {estimate && (
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Storage Estimate</Text>
          <View style={dynamicStyles.estimateCard}>
            <Text style={dynamicStyles.totalSize}>
              ~{estimate.estimatedTotalMB} MB
            </Text>
            <View style={styles.breakdown}>
              <View style={styles.breakdownRow}>
                <Text style={dynamicStyles.breakdownLabel}>Map tiles:</Text>
                <Text style={dynamicStyles.breakdownValue}>
                  {estimate.estimatedTilesMB} MB ({estimate.tileCount} tiles)
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={dynamicStyles.breakdownLabel}>Elevation:</Text>
                <Text style={dynamicStyles.breakdownValue}>
                  {estimate.estimatedDemMB} MB
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={dynamicStyles.breakdownLabel}>Metadata:</Text>
                <Text style={dynamicStyles.breakdownValue}>
                  {estimate.estimatedMetaMB} MB
                </Text>
              </View>
            </View>
          </View>
          <Text style={dynamicStyles.disclaimer}>
            * This is an estimate. Actual size may vary.
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {showStartButton && onStartDownload && (
        <TouchableOpacity
          style={dynamicStyles.primaryButton}
          onPress={onStartDownload}
          activeOpacity={0.7}
        >
          <Text style={dynamicStyles.primaryButtonText}>Start Download</Text>
        </TouchableOpacity>
      )}

      {showCompleteButton && onViewOfflineMap && (
        <TouchableOpacity
          style={dynamicStyles.primaryButton}
          onPress={onViewOfflineMap}
          activeOpacity={0.7}
        >
          <Text style={dynamicStyles.primaryButtonText}>View Offline Map</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  estimateCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  totalSize: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  breakdown: {
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 12,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
