/**
 * Tap Inspector Sheet component
 * Displays elevation, slope, and nearby features for a tapped location
 * @format
 */

import React, { useMemo } from 'react';
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
import { useTheme } from '../../../hooks/useTheme';
import {
  formatLatLng,
  formatElevation,
  formatSlope,
  formatDistance,
} from './formatters';
import type { TapInspectorFeature } from './types';
import type { UseTapInspectorReturn } from './useTapInspector';

interface TapInspectorSheetProps {
  inspector: UseTapInspectorReturn;
}

/**
 * Bottom sheet that displays tap details
 */
export default function TapInspectorSheet({
  inspector,
}: TapInspectorSheetProps) {
  const COLORS = useTheme();
  const { isOpen, isLoading, error, result, close } = inspector;

  // Create dynamic styles using theme colors
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        sheet: {
          ...styles.sheet,
          backgroundColor: COLORS.PRIMARY_LIGHT,
        },
        header: {
          ...styles.header,
          borderBottomColor: COLORS.PRIMARY_DARK,
        },
        headerTitle: {
          ...styles.headerTitle,
          color: COLORS.PRIMARY_DARK,
        },
        closeButtonText: {
          ...styles.closeButtonText,
          color: COLORS.PRIMARY_DARK,
        },
        loadingText: {
          ...styles.loadingText,
          color: COLORS.PRIMARY_DARK,
        },
        errorText: {
          ...styles.errorText,
          color: COLORS.ERROR,
        },
        closeButtonOutlined: {
          ...styles.closeButtonOutlined,
          borderColor: COLORS.PRIMARY_DARK,
        },
        closeButtonOutlinedText: {
          ...styles.closeButtonOutlinedText,
          color: COLORS.PRIMARY_DARK,
        },
        sectionTitle: {
          ...styles.sectionTitle,
          color: COLORS.PRIMARY_DARK,
        },
        coordinateText: {
          ...styles.coordinateText,
          color: COLORS.PRIMARY_DARK,
        },
        terrainLabel: {
          ...styles.terrainLabel,
          color: COLORS.PRIMARY_DARK,
        },
        terrainValue: {
          ...styles.terrainValue,
          color: COLORS.PRIMARY_DARK,
        },
        emptyText: {
          ...styles.emptyText,
          color: COLORS.PRIMARY_DARK,
        },
        featureItem: {
          ...styles.featureItem,
          borderBottomColor: COLORS.PRIMARY_DARK,
        },
        featureTitle: {
          ...styles.featureTitle,
          color: COLORS.PRIMARY_DARK,
        },
        featureSubtitle: {
          ...styles.featureSubtitle,
          color: COLORS.PRIMARY_DARK,
        },
        featureDistance: {
          ...styles.featureDistance,
          color: COLORS.PRIMARY_DARK,
        },
      }),
    [COLORS],
  );

  if (!isOpen) {
    return null;
  }

  const handleBackdropPress = () => {
    close();
  };

  // No-op handler to prevent backdrop TouchableWithoutFeedback from closing
  // the modal when user taps inside the sheet content area
  const stopPropagation = () => {};

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <TouchableWithoutFeedback
        onPress={handleBackdropPress}
        accessibilityLabel="Dismiss tap details"
        accessibilityRole="button"
        accessibilityHint="Dismisses the tap details sheet and returns to the map"
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={stopPropagation}>
            <View style={dynamicStyles.sheet}>
              {/* Header */}
              <View style={dynamicStyles.header}>
                <Text style={dynamicStyles.headerTitle}>Tap Details</Text>
                <TouchableOpacity
                  onPress={close}
                  style={styles.closeButton}
                  accessibilityLabel="Close tap inspector"
                  accessibilityRole="button"
                >
                  <Text style={dynamicStyles.closeButtonText}>✕</Text>
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
                    <Text style={dynamicStyles.loadingText}>
                      Loading details…
                    </Text>
                  </View>
                )}

                {/* Error State */}
                {error && !isLoading && (
                  <View style={styles.errorContainer}>
                    <Text style={dynamicStyles.errorText}>{error}</Text>
                    <TouchableOpacity
                      style={dynamicStyles.closeButtonOutlined}
                      onPress={close}
                    >
                      <Text style={dynamicStyles.closeButtonOutlinedText}>
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Result State */}
                {result && !isLoading && !error && (
                  <>
                    {/* Location */}
                    <View style={styles.section}>
                      <Text style={dynamicStyles.sectionTitle}>Location</Text>
                      <Text style={dynamicStyles.coordinateText}>
                        {formatLatLng(result.location.lat, result.location.lng)}
                      </Text>
                    </View>

                    {/* Terrain */}
                    <View style={styles.section}>
                      <Text style={dynamicStyles.sectionTitle}>Terrain</Text>
                      <View style={styles.terrainRow}>
                        <Text style={dynamicStyles.terrainLabel}>
                          Elevation:
                        </Text>
                        <Text style={dynamicStyles.terrainValue}>
                          {result.elevationM !== null
                            ? formatElevation(result.elevationM)
                            : '—'}
                        </Text>
                      </View>
                      <View style={styles.terrainRow}>
                        <Text style={dynamicStyles.terrainLabel}>Slope:</Text>
                        <Text style={dynamicStyles.terrainValue}>
                          {result.slopePercent !== null
                            ? formatSlope(result.slopePercent)
                            : '—'}
                        </Text>
                      </View>
                    </View>

                    {/* Features */}
                    <View style={styles.section}>
                      <Text style={dynamicStyles.sectionTitle}>
                        Nearby Features
                      </Text>
                      {result.features.length === 0 ? (
                        <Text style={dynamicStyles.emptyText}>
                          No nearby features found
                        </Text>
                      ) : (
                        result.features.map((feature) => (
                          <FeatureItem
                            key={feature.id}
                            feature={feature}
                            styles={dynamicStyles}
                          />
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
function FeatureItem({
  feature,
  styles: dynamicItemStyles,
}: {
  feature: TapInspectorFeature;
  styles: any;
}) {
  return (
    <View style={dynamicItemStyles.featureItem}>
      <View style={styles.featureHeader}>
        <Text style={dynamicItemStyles.featureTitle}>{feature.title}</Text>
        {feature.subtitle && (
          <Text style={dynamicItemStyles.featureSubtitle}>
            {feature.subtitle}
          </Text>
        )}
      </View>
      <Text style={dynamicItemStyles.featureDistance}>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
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
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  closeButtonOutlined: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  closeButtonOutlinedText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  coordinateText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  terrainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  terrainLabel: {
    fontSize: 14,
  },
  terrainValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  featureItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  featureHeader: {
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  featureSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  featureDistance: {
    fontSize: 12,
    opacity: 0.7,
  },
});
