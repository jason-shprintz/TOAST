/**
 * Map Markers component
 * @format
 */

import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../../components/ScaledText';
import { useTheme } from '../../../hooks/useTheme';
import { formatDistance, formatElevation } from './markerFormatters';
import type { MapMarker } from './types';

export interface MapMarkersProps {
  markers: MapMarker[];
  selectedMarker?: MapMarker;
  onMarkerPress: (markerId: string) => void;
  onCloseDetails: () => void;
}

/**
 * MapMarkers - Renders markers and details panel
 * Note: This is a visual representation since the stub adapter doesn't support real markers yet.
 * When a real map SDK is integrated, markers should be rendered directly on the map.
 */
export default function MapMarkers({
  markers,
  selectedMarker,
  onMarkerPress,
  onCloseDetails,
}: MapMarkersProps) {
  const COLORS = useTheme();

  // Create dynamic styles using theme colors
  const dynamicStyles = useMemo(
    () => ({
      markerList: [styles.markerList, { backgroundColor: COLORS.PRIMARY_LIGHT }],
      markerListTitle: [styles.markerListTitle, { color: COLORS.PRIMARY_DARK }],
      markerItem: [styles.markerItem, { backgroundColor: COLORS.BACKGROUND }],
      markerItemSelected: [styles.markerItemSelected, { backgroundColor: COLORS.SECONDARY_ACCENT }],
      markerItemTitle: [styles.markerItemTitle, { color: COLORS.PRIMARY_DARK }],
      markerItemCoords: [styles.markerItemCoords, { color: COLORS.PRIMARY_DARK }],
      detailsPanel: [styles.detailsPanel, { backgroundColor: COLORS.PRIMARY_LIGHT }],
      detailsTitle: [styles.detailsTitle, { color: COLORS.PRIMARY_DARK }],
      closeButton: [styles.closeButton, { backgroundColor: COLORS.BACKGROUND }],
      closeButtonText: [styles.closeButtonText, { color: COLORS.PRIMARY_DARK }],
      detailLabel: [styles.detailLabel, { color: COLORS.PRIMARY_DARK }],
      detailValue: [styles.detailValue, { color: COLORS.PRIMARY_DARK }],
    }),
    [COLORS],
  );
  // Render marker list (for stub adapter visualization)
  const renderMarkerList = () => {
    if (markers.length === 0) {
      return null;
    }

    return (
      <View style={dynamicStyles.markerList}>
        <Text style={dynamicStyles.markerListTitle}>Active Markers:</Text>
        {markers.map((marker) => (
          <TouchableOpacity
            key={marker.id}
            style={[
              dynamicStyles.markerItem,
              selectedMarker?.id === marker.id &&
                dynamicStyles.markerItemSelected,
            ]}
            onPress={() => onMarkerPress(marker.id)}
            activeOpacity={0.7}
          >
            <Text style={dynamicStyles.markerItemTitle}>{marker.title}</Text>
            <Text style={dynamicStyles.markerItemCoords}>
              {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render details panel
  const renderDetailsPanel = () => {
    if (!selectedMarker) {
      return null;
    }

    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
        onRequestClose={onCloseDetails}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onCloseDetails}
        >
          <Pressable
            style={dynamicStyles.detailsPanel}
            onPress={(e) => {
              // Prevent tap from propagating to overlay
              e.stopPropagation();
            }}
          >
            <View style={styles.detailsHeader}>
              <Text style={dynamicStyles.detailsTitle}>
                {selectedMarker.title}
              </Text>
              <TouchableOpacity
                style={dynamicStyles.closeButton}
                onPress={onCloseDetails}
              >
                <Text style={dynamicStyles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailsContent}>
              {selectedMarker.subtitle && (
                <View style={styles.detailRow}>
                  <Text style={dynamicStyles.detailLabel}>Type:</Text>
                  <Text style={dynamicStyles.detailValue}>
                    {selectedMarker.subtitle}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Location:</Text>
                <Text style={dynamicStyles.detailValue}>
                  {selectedMarker.lat.toFixed(5)},{' '}
                  {selectedMarker.lng.toFixed(5)}
                </Text>
              </View>

              {selectedMarker.distanceMeters !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={dynamicStyles.detailLabel}>Distance:</Text>
                  <Text style={dynamicStyles.detailValue}>
                    {formatDistance(selectedMarker.distanceMeters)}
                  </Text>
                </View>
              )}

              {selectedMarker.elevationM !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={dynamicStyles.detailLabel}>Elevation:</Text>
                  <Text style={dynamicStyles.detailValue}>
                    {formatElevation(selectedMarker.elevationM)}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <>
      {renderMarkerList()}
      {renderDetailsPanel()}
    </>
  );
}

const styles = StyleSheet.create({
  markerList: {
    position: 'absolute',
    top: 60,
    right: 12,
    padding: 8,
    borderRadius: 8,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerListTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  markerItem: {
    padding: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  markerItemSelected: {},
  markerItemTitle: {
    fontSize: 10,
    fontWeight: '500',
  },
  markerItemCoords: {
    fontSize: 8,
    marginTop: 2,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailsPanel: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
  },
  detailsContent: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
