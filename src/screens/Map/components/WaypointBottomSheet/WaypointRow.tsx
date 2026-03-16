import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../../hooks/useTheme';
import { Waypoint } from '../../../../stores/WaypointStore';
import {
  bearingDegrees,
  formatBearing,
  formatDistance,
  haversineMeters,
} from './waypointGeometry';
import type { MeasurementSystem } from '../../../../stores/SettingsStore';

interface Coords {
  latitude: number;
  longitude: number;
}

interface WaypointRowProps {
  waypoint: Waypoint;
  currentCoords: Coords | null;
  measurementSystem: MeasurementSystem;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function WaypointRow({
  waypoint,
  currentCoords,
  measurementSystem,
  onNavigate,
  onDelete,
}: WaypointRowProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const distanceLabel = currentCoords
    ? formatDistance(
        haversineMeters(
          currentCoords.latitude,
          currentCoords.longitude,
          waypoint.latitude,
          waypoint.longitude,
        ),
        measurementSystem,
      )
    : '—';

  const bearingLabel = currentCoords
    ? formatBearing(
        bearingDegrees(
          currentCoords.latitude,
          currentCoords.longitude,
          waypoint.latitude,
          waypoint.longitude,
        ),
      )
    : '—';

  const confirmDelete = () => {
    Alert.alert(
      'Delete Waypoint',
      `Are you sure you want to delete "${waypoint.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(waypoint.id),
        },
      ],
    );
  };

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {waypoint.name}
        </Text>
        <Text style={styles.meta}>
          {distanceLabel} · {bearingLabel}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => onNavigate(waypoint.id)}
        accessibilityLabel={`Navigate to ${waypoint.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.actionBtnText}>Navigate</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, styles.deleteBtn]}
        onPress={confirmDelete}
        accessibilityLabel={`Delete ${waypoint.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.deleteBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.SECONDARY_ACCENT,
    },
    info: {
      flex: 1,
      marginRight: 8,
    },
    name: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.PRIMARY_DARK,
    },
    meta: {
      fontSize: 12,
      color: colors.SECONDARY_ACCENT,
      marginTop: 2,
    },
    actionBtn: {
      backgroundColor: colors.SECONDARY_ACCENT,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginLeft: 6,
    },
    actionBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.PRIMARY_LIGHT,
    },
    deleteBtn: {
      backgroundColor: colors.ERROR,
    },
    deleteBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.PRIMARY_LIGHT,
    },
  });
}
