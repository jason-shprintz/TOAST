/**
 * Tap Inspector Sheet component
 * Displays elevation, slope, and nearby features for a tapped location
 * @format
 */

import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Text } from '../../../components/ScaledText';
import { COLORS } from '../../../theme';
import {
  formatLatLng,
  formatElevation,
  formatSlope,
  formatDistance,
} from './formatters';
import type { UseTapInspectorReturn } from './useTapInspector';
import type { TapInspectorFeature } from './types';

interface TapInspectorSheetProps {
  inspector: UseTapInspectorReturn;
}

/**
 * Bottom sheet that displays tap details
 */
export default function TapInspectorSheet({
  inspector,
}: TapInspectorSheetProps) {
  const { isOpen, isLoading, error, result, close } = inspector;

  if (!isOpen) {
    return null;
  }

  const handleBackdropPress = () => {
    close();
  };

  // Prevent backdrop close when tapping inside the sheet
  const preventClose = () => {};

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={preventClose}>
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Tap Details</Text>
                <TouchableOpacity
                  onPress={close}
                  style={styles.closeButton}
                  accessibilityLabel="Close tap inspector"
                  accessibilityRole="button"
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                {/* Loading State */}
                {isLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator
                      size="large"
                      color={COLORS.SECONDARY_ACCENT}
                    />
                    <Text style={styles.loadingText}>Loading details…</Text>
                  </View>
                )}

                {/* Error State */}
                {error && !isLoading && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                      style={styles.closeButtonOutlined}
                      onPress={close}
                    >
                      <Text style={styles.closeButtonOutlinedText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Result State */}
                {result && !isLoading && !error && (
                  <>
                    {/* Location */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Location</Text>
                      <Text style={styles.coordinateText}>
                        {formatLatLng(result.location.lat, result.location.lng)}
                      </Text>
                    </View>

                    {/* Terrain */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Terrain</Text>
                      <View style={styles.terrainRow}>
                        <Text style={styles.terrainLabel}>Elevation:</Text>
                        <Text style={styles.terrainValue}>
                          {result.elevationM !== null
                            ? formatElevation(result.elevationM)
                            : '—'}
                        </Text>
                      </View>
                      <View style={styles.terrainRow}>
                        <Text style={styles.terrainLabel}>Slope:</Text>
                        <Text style={styles.terrainValue}>
                          {result.slopePercent !== null
                            ? formatSlope(result.slopePercent)
                            : '—'}
                        </Text>
                      </View>
                    </View>

                    {/* Features */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Nearby Features</Text>
                      {result.features.length === 0 ? (
                        <Text style={styles.emptyText}>
                          No nearby features found
                        </Text>
                      ) : (
                        result.features.map((feature) => (
                          <FeatureItem key={feature.id} feature={feature} />
                        ))
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/**
 * Individual feature item in the list
 */
function FeatureItem({ feature }: { feature: TapInspectorFeature }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureHeader}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        {feature.subtitle && (
          <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
        )}
      </View>
      <Text style={styles.featureDistance}>
        {formatDistance(feature.distanceMeters)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.PRIMARY_DARK,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.ERROR,
    textAlign: 'center',
    marginBottom: 16,
  },
  closeButtonOutlined: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_DARK,
    borderRadius: 8,
  },
  closeButtonOutlinedText: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 8,
  },
  coordinateText: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    fontFamily: 'monospace',
  },
  terrainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  terrainLabel: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
  },
  terrainValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.PRIMARY_DARK,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  featureItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureHeader: {
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.PRIMARY_DARK,
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  featureDistance: {
    fontSize: 12,
    color: '#999',
  },
});
