/**
 * Map Markers component
 * @format
 */

import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../../components/ScaledText';
import { COLORS } from '../../../theme';
import { formatDistance } from './markerFormatters';
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
  // Render marker list (for stub adapter visualization)
  const renderMarkerList = () => {
    if (markers.length === 0) {
      return null;
    }

    return (
      <View style={styles.markerList}>
        <Text style={styles.markerListTitle}>Active Markers:</Text>
        {markers.map((marker) => (
          <TouchableOpacity
            key={marker.id}
            style={[
              styles.markerItem,
              selectedMarker?.id === marker.id && styles.markerItemSelected,
            ]}
            onPress={() => onMarkerPress(marker.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.markerItemTitle}>{marker.title}</Text>
            <Text style={styles.markerItemCoords}>
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
          <View style={styles.detailsPanel}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>{selectedMarker.title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onCloseDetails}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailsContent}>
              {selectedMarker.subtitle && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {selectedMarker.subtitle}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>
                  {selectedMarker.lat.toFixed(5)},{' '}
                  {selectedMarker.lng.toFixed(5)}
                </Text>
              </View>

              {selectedMarker.distanceMeters !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Distance:</Text>
                  <Text style={styles.detailValue}>
                    {formatDistance(selectedMarker.distanceMeters)}
                  </Text>
                </View>
              )}

              {selectedMarker.elevationM !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Elevation:</Text>
                  <Text style={styles.detailValue}>
                    {selectedMarker.elevationM.toFixed(0)} m
                  </Text>
                </View>
              )}
            </View>
          </View>
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
    backgroundColor: COLORS.PRIMARY_LIGHT,
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
    color: COLORS.PRIMARY_DARK,
    marginBottom: 4,
  },
  markerItem: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    marginTop: 4,
  },
  markerItemSelected: {
    backgroundColor: COLORS.SECONDARY_ACCENT,
  },
  markerItemTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.PRIMARY_DARK,
  },
  markerItemCoords: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailsPanel: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
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
    color: COLORS.PRIMARY_DARK,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.PRIMARY_DARK,
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
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
  },
});
