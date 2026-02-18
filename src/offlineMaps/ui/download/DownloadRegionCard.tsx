/**
 * Download Region Card Component
 * Shows region info and download controls
 * @format
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../../components/ScaledText';
import { COLORS } from '../../../theme';
import type { OfflineRegionDraft } from '../../types';
import type { DownloadRegionEstimate } from './types';

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
  return (
    <View style={styles.container}>
      {/* Region Info */}
      {draft && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Region Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Center:</Text>
            <Text style={styles.value}>
              {draft.centerLat.toFixed(4)}, {draft.centerLng.toFixed(4)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Radius:</Text>
            <Text style={styles.value}>{draft.radiusMiles} miles</Text>
          </View>
        </View>
      )}

      {/* Size Estimate */}
      {estimate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Estimate</Text>
          <View style={styles.estimateCard}>
            <Text style={styles.totalSize}>
              ~{estimate.estimatedTotalMB} MB
            </Text>
            <View style={styles.breakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Map tiles:</Text>
                <Text style={styles.breakdownValue}>
                  {estimate.estimatedTilesMB} MB ({estimate.tileCount} tiles)
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Elevation:</Text>
                <Text style={styles.breakdownValue}>
                  {estimate.estimatedDemMB} MB
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Metadata:</Text>
                <Text style={styles.breakdownValue}>
                  {estimate.estimatedMetaMB} MB
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.disclaimer}>
            * This is an estimate. Actual size may vary.
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {showStartButton && onStartDownload && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onStartDownload}
          activeOpacity={0.7}
        >
          <Text style={styles.primaryButtonText}>Start Download</Text>
        </TouchableOpacity>
      )}

      {showCompleteButton && onViewOfflineMap && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onViewOfflineMap}
          activeOpacity={0.7}
        >
          <Text style={styles.primaryButtonText}>View Offline Map</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
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
    color: COLORS.PRIMARY_DARK,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
  },
  value: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    fontWeight: '600',
  },
  estimateCard: {
    backgroundColor: COLORS.BACKGROUND,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  totalSize: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.SECONDARY_ACCENT,
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
    color: COLORS.PRIMARY_DARK,
  },
  breakdownValue: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.PRIMARY_DARK,
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: COLORS.SECONDARY_ACCENT,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
});
