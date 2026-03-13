/**
 * WaypointBottomSheet — Animated bottom sheet that slides up over the map.
 * Uses Animated + PanResponder (no Modal) so the map remains visible above.
 *
 * Sheet states:
 *   closed  — off-screen below
 *   open    — at SHEET_HEIGHT, showing full waypoint list
 *   active  — collapsed to STRIP_HEIGHT showing live bearing/distance strip
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { Waypoint } from '../../../stores/WaypointStore';

// ---------- geometry helpers ------------------------------------------------

/** Haversine distance in metres between two lat/lng points. */
export function haversineMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Compass bearing (0–360°) from point 1 to point 2. */
export function bearingDegrees(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Formats metres as "X.X km" or "X m". */
function formatDistance(metres: number): string {
  if (metres >= 1000) {
    return `${(metres / 1000).toFixed(1)} km`;
  }
  return `${Math.round(metres)} m`;
}

/** Formats a bearing as "NNE 47°". */
function formatBearing(deg: number): string {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(deg / 22.5) % 16;
  return `${cardinals[idx]} ${Math.round(deg)}°`;
}

// ---------- constants -------------------------------------------------------

const WINDOW_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = Math.round(WINDOW_HEIGHT * 0.45);
const STRIP_HEIGHT = 72;
const HANDLE_HEIGHT = 28;

// ---------- types -----------------------------------------------------------

type SheetState = 'closed' | 'open' | 'active';

interface Coords {
  latitude: number;
  longitude: number;
}

export interface WaypointBottomSheetProps {
  /** All saved waypoints. */
  waypoints: Waypoint[];
  /** Currently active waypoint ID, or null. */
  activeWaypointId: string | null;
  /** Current GPS coords of the device (used for live distance/bearing). */
  currentCoords: Coords | null;
  /** Current device heading in degrees (0–360). */
  currentHeading: number;
  /** Whether the sheet is open (controlled externally via the FAB). */
  isOpen: boolean;
  /** Called when the user closes the sheet via swipe/dismiss. */
  onClose: () => void;
  /** Called when user taps Navigate on a waypoint. */
  onNavigate: (id: string) => void;
  /** Called when user taps Delete on a waypoint. */
  onDelete: (id: string) => void;
  /** Called when user wants to add waypoint from current location. */
  onAddFromLocation: (name: string) => void;
  /** Called when user manually enters coordinates. */
  onAddManual: (name: string, latitude: number, longitude: number) => void;
  /** Called when user dismisses the active strip. */
  onDismissActive: () => void;
}

// ---------- sub-components --------------------------------------------------

function WaypointRow({
  waypoint,
  currentCoords,
  onNavigate,
  onDelete,
}: {
  waypoint: Waypoint;
  currentCoords: Coords | null;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeRowStyles(COLORS), [COLORS]);

  const distanceLabel = currentCoords
    ? formatDistance(
        haversineMetres(
          currentCoords.latitude,
          currentCoords.longitude,
          waypoint.latitude,
          waypoint.longitude,
        ),
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
        onPress={() => onDelete(waypoint.id)}
        accessibilityLabel={`Delete ${waypoint.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.deleteBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeRowStyles(colors: ReturnType<typeof useTheme>) {
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

// ---------- AddWaypointForm -------------------------------------------------

type AddMode = 'location' | 'manual';

function AddWaypointForm({
  hasLocation,
  onAddFromLocation,
  onAddManual,
  onCancel,
}: {
  hasLocation: boolean;
  onAddFromLocation: (name: string) => void;
  onAddManual: (name: string, latitude: number, longitude: number) => void;
  onCancel: () => void;
}) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeFormStyles(COLORS), [COLORS]);
  const [mode, setMode] = useState<AddMode>('location');
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a name.');
      return;
    }
    if (mode === 'location') {
      if (!hasLocation) {
        setError('GPS location not available yet.');
        return;
      }
      onAddFromLocation(trimmedName);
    } else {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        setError('Latitude must be between -90 and 90.');
        return;
      }
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        setError('Longitude must be between -180 and 180.');
        return;
      }
      onAddManual(trimmedName, latNum, lngNum);
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Add Waypoint</Text>

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'location' && styles.modeBtnActive]}
          onPress={() => setMode('location')}
          accessibilityLabel="Add from current location"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.modeBtnText,
              mode === 'location' && styles.modeBtnTextActive,
            ]}
          >
            Current Location
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
          onPress={() => setMode('manual')}
          accessibilityLabel="Enter coordinates manually"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.modeBtnText,
              mode === 'manual' && styles.modeBtnTextActive,
            ]}
          >
            Manual Entry
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor={COLORS.SECONDARY_ACCENT}
        value={name}
        onChangeText={(t) => {
          setName(t);
          setError(null);
        }}
        accessibilityLabel="Waypoint name"
      />

      {mode === 'manual' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Latitude (e.g. 37.7749)"
            placeholderTextColor={COLORS.SECONDARY_ACCENT}
            value={lat}
            onChangeText={(t) => {
              setLat(t);
              setError(null);
            }}
            keyboardType="decimal-pad"
            accessibilityLabel="Latitude"
          />
          <TextInput
            style={styles.input}
            placeholder="Longitude (e.g. -122.4194)"
            placeholderTextColor={COLORS.SECONDARY_ACCENT}
            value={lng}
            onChangeText={(t) => {
              setLng(t);
              setError(null);
            }}
            keyboardType="decimal-pad"
            accessibilityLabel="Longitude"
          />
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.formBtn, styles.cancelBtn]}
          onPress={onCancel}
          accessibilityLabel="Cancel adding waypoint"
          accessibilityRole="button"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.formBtn}
          onPress={handleSubmit}
          accessibilityLabel="Save waypoint"
          accessibilityRole="button"
        >
          <Text style={styles.formBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeFormStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    form: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    formTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.PRIMARY_DARK,
      marginBottom: 12,
    },
    modeRow: {
      flexDirection: 'row',
      marginBottom: 12,
      gap: 8,
    },
    modeBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.SECONDARY_ACCENT,
      alignItems: 'center',
    },
    modeBtnActive: {
      backgroundColor: colors.SECONDARY_ACCENT,
    },
    modeBtnText: {
      fontSize: 13,
      color: colors.SECONDARY_ACCENT,
    },
    modeBtnTextActive: {
      color: colors.PRIMARY_LIGHT,
      fontWeight: '600',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.SECONDARY_ACCENT,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 10,
      fontSize: 14,
      color: colors.PRIMARY_DARK,
      backgroundColor: colors.BACKGROUND,
    },
    error: {
      color: colors.ERROR,
      fontSize: 13,
      marginBottom: 8,
    },
    formActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    formBtn: {
      flex: 1,
      backgroundColor: colors.SECONDARY_ACCENT,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    formBtnText: {
      color: colors.PRIMARY_LIGHT,
      fontWeight: '700',
      fontSize: 14,
    },
    cancelBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.SECONDARY_ACCENT,
    },
    cancelBtnText: {
      color: colors.SECONDARY_ACCENT,
      fontWeight: '700',
      fontSize: 14,
    },
  });
}

// ---------- main export -----------------------------------------------------

/**
 * WaypointBottomSheet — animated bottom sheet over the map.
 * Does not use Modal; positioned absolutely within the map container.
 */
export default function WaypointBottomSheet({
  waypoints,
  activeWaypointId,
  currentCoords,
  currentHeading,
  isOpen,
  onClose,
  onNavigate,
  onDelete,
  onAddFromLocation,
  onAddManual,
  onDismissActive,
}: WaypointBottomSheetProps) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeSheetStyles(COLORS), [COLORS]);

  const [sheetState, setSheetState] = useState<SheetState>('closed');
  const [showAddForm, setShowAddForm] = useState(false);

  // translateY: 0 = fully visible at bottom, positive = hidden below screen
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const targetHeight =
    sheetState === 'active' ? STRIP_HEIGHT : SHEET_HEIGHT;

  // Animate sheet open/closed
  const animateTo = useCallback(
    (toValue: number) => {
      Animated.spring(translateY, {
        toValue,
        useNativeDriver: true,
        speed: 18,
        bounciness: 0,
      }).start();
    },
    [translateY],
  );

  // Sync sheetState with isOpen + activeWaypointId
  useEffect(() => {
    if (isOpen) {
      setSheetState('open');
      animateTo(0);
    } else if (activeWaypointId) {
      setSheetState('active');
      setShowAddForm(false);
      animateTo(SHEET_HEIGHT - STRIP_HEIGHT);
    } else {
      setSheetState('closed');
      setShowAddForm(false);
      animateTo(SHEET_HEIGHT);
    }
  }, [isOpen, activeWaypointId, animateTo]);

  // PanResponder for drag-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dy) > 8,
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          // User dragged down enough — close
          Animated.spring(translateY, {
            toValue: SHEET_HEIGHT,
            useNativeDriver: true,
            speed: 18,
            bounciness: 0,
          }).start(() => onClose());
        } else {
          // Snap back open
          animateTo(0);
        }
      },
    }),
  ).current;

  const handleAddFromLocation = (name: string) => {
    setShowAddForm(false);
    Keyboard.dismiss();
    onAddFromLocation(name);
  };

  const handleAddManual = (
    name: string,
    latitude: number,
    longitude: number,
  ) => {
    setShowAddForm(false);
    Keyboard.dismiss();
    onAddManual(name, latitude, longitude);
  };

  const activeWaypoint = waypoints.find((w) => w.id === activeWaypointId);

  // Live bearing and distance for the active strip
  const activeBearingLabel =
    activeWaypoint && currentCoords
      ? formatBearing(
          bearingDegrees(
            currentCoords.latitude,
            currentCoords.longitude,
            activeWaypoint.latitude,
            activeWaypoint.longitude,
          ),
        )
      : '—';

  const activeDistanceLabel =
    activeWaypoint && currentCoords
      ? formatDistance(
          haversineMetres(
            currentCoords.latitude,
            currentCoords.longitude,
            activeWaypoint.latitude,
            activeWaypoint.longitude,
          ),
        )
      : '—';

  if (sheetState === 'closed' && !activeWaypointId) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.sheet,
        { height: targetHeight, transform: [{ translateY }] },
      ]}
      accessibilityViewIsModal={false}
    >
      {/* --- Active strip (collapsed state) --- */}
      {sheetState === 'active' && activeWaypoint ? (
        <View style={styles.activeStrip}>
          <View style={styles.activeStripInfo}>
            <Text style={styles.activeStripName} numberOfLines={1}>
              ▶ {activeWaypoint.name}
            </Text>
            <Text style={styles.activeStripMeta}>
              {activeDistanceLabel} · {activeBearingLabel}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={onDismissActive}
            accessibilityLabel="Dismiss active waypoint"
            accessibilityRole="button"
          >
            <Text style={styles.dismissBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* --- Drag handle --- */}
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {/* --- Sheet header --- */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Waypoints</Text>
            <TouchableOpacity
              onPress={() => setShowAddForm((v) => !v)}
              style={styles.addButton}
              accessibilityLabel={showAddForm ? 'Cancel adding waypoint' : 'Add waypoint'}
              accessibilityRole="button"
            >
              <Text style={styles.addButtonText}>{showAddForm ? '✕' : '+'}</Text>
            </TouchableOpacity>
          </View>

          {/* --- Add form or waypoint list --- */}
          {showAddForm ? (
            <AddWaypointForm
              hasLocation={currentCoords !== null}
              onAddFromLocation={handleAddFromLocation}
              onAddManual={handleAddManual}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <ScrollView
              style={styles.list}
              keyboardShouldPersistTaps="handled"
            >
              {waypoints.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No waypoints saved. Add one to get started.
                  </Text>
                </View>
              ) : (
                waypoints.map((wp) => (
                  <WaypointRow
                    key={wp.id}
                    waypoint={wp}
                    currentCoords={currentCoords}
                    onNavigate={onNavigate}
                    onDelete={onDelete}
                  />
                ))
              )}
            </ScrollView>
          )}
        </>
      )}
    </Animated.View>
  );
}

function makeSheetStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.BACKGROUND,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.SECONDARY_ACCENT,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 8,
      overflow: 'hidden',
    },
    handleArea: {
      height: HANDLE_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.SECONDARY_ACCENT,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.PRIMARY_DARK,
    },
    addButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.SECONDARY_ACCENT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: 20,
      lineHeight: 24,
      color: colors.PRIMARY_LIGHT,
      fontWeight: '600',
    },
    list: {
      flex: 1,
    },
    emptyState: {
      paddingHorizontal: 24,
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.SECONDARY_ACCENT,
      textAlign: 'center',
    },
    activeStrip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    activeStripInfo: {
      flex: 1,
    },
    activeStripName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.PRIMARY_DARK,
    },
    activeStripMeta: {
      fontSize: 12,
      color: colors.SECONDARY_ACCENT,
      marginTop: 2,
    },
    dismissBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.SECONDARY_ACCENT,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
    dismissBtnText: {
      fontSize: 14,
      color: colors.PRIMARY_DARK,
    },
  });
}
