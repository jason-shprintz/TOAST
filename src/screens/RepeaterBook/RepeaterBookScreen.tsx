import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { JSX, useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { Repeater } from '../../stores/RepeaterBookStore';
import { useRepeaterBookStore } from '../../stores/StoreContext';
import { FOOTER_HEIGHT } from '../../theme';

/**
 * Displays the list of local ham radio repeaters fetched from RepeaterBook.
 *
 * On mount the store fetches (or reuses cached) repeater data for the user's
 * current location.  A new fetch is triggered automatically whenever the user
 * has moved more than 50 miles from the previous query point.
 *
 * @returns {JSX.Element} The rendered local repeaters screen.
 */
const RepeaterBookScreen = observer((): JSX.Element => {
  const COLORS = useTheme();
  const navigation = useNavigation<any>();
  const store = useRepeaterBookStore();

  useEffect(() => {
    store.initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModePress = (mode: string) => {
    store.setSelectedMode(mode);
  };

  const handleRepeaterPress = (repeater: Repeater) => {
    navigation.navigate('RepeaterDetail', { repeater });
  };

  const formatLastUpdated = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <ScreenBody>
      <SectionHeader>Local Repeaters</SectionHeader>

      <View style={styles.container}>
        {/* Status bar */}
        {(store.lastUpdated || store.isCachedData) && (
          <View
            style={[
              styles.statusBar,
              {
                backgroundColor: store.isCachedData
                  ? COLORS.BACKGROUND
                  : COLORS.SUCCESS_LIGHT,
                borderColor: store.isCachedData
                  ? COLORS.TOAST_BROWN
                  : COLORS.SUCCESS,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: COLORS.PRIMARY_DARK }]}>
              {store.isCachedData ? '📦 Cached data' : '✅ Live data'}
              {store.lastUpdated
                ? `  ·  Updated ${formatLastUpdated(store.lastUpdated)}`
                : ''}
            </Text>
          </View>
        )}

        {/* Mode filter chips */}
        {store.modes.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterRowContent}
          >
            {store.modes.map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => handleModePress(mode)}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      store.selectedMode === mode
                        ? COLORS.ACCENT
                        : COLORS.PRIMARY_LIGHT,
                    borderColor:
                      store.selectedMode === mode
                        ? COLORS.ACCENT
                        : COLORS.TOAST_BROWN,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        store.selectedMode === mode
                          ? '#fff'
                          : COLORS.PRIMARY_DARK,
                    },
                  ]}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Loading spinner */}
          {store.isLoading && store.repeaters.length === 0 && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLORS.ACCENT} />
              <Text style={[styles.helperText, { color: COLORS.PRIMARY_DARK }]}>
                Loading repeaters…
              </Text>
            </View>
          )}

          {/* Error message */}
          {store.error && store.repeaters.length === 0 && (
            <View
              style={[
                styles.errorCard,
                {
                  backgroundColor: COLORS.ERROR_LIGHT,
                  borderColor: COLORS.ERROR,
                },
              ]}
            >
              <Text style={[styles.errorText, { color: COLORS.PRIMARY_DARK }]}>
                {store.error}
              </Text>
              <Text style={[styles.helperText, { color: COLORS.PRIMARY_DARK }]}>
                Connect to the internet to load repeater data.
              </Text>
            </View>
          )}

          {/* Empty state */}
          {!store.isLoading && !store.error && store.repeaters.length === 0 && (
            <View style={styles.centered}>
              <Text style={[styles.helperText, { color: COLORS.PRIMARY_DARK }]}>
                No repeaters found nearby.
              </Text>
            </View>
          )}

          {/* Repeater list */}
          {store.filteredRepeaters.map((repeater, index) => (
            <TouchableOpacity
              key={repeater.id || index}
              onPress={() => handleRepeaterPress(repeater)}
              style={[
                styles.row,
                {
                  backgroundColor: COLORS.PRIMARY_LIGHT,
                  borderColor: COLORS.TOAST_BROWN,
                },
              ]}
            >
              {/* Operational status dot */}
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      repeater.operationalStatus === 'On-air'
                        ? COLORS.SUCCESS
                        : COLORS.TOAST_BROWN,
                  },
                ]}
              />

              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text
                    style={[styles.callSign, { color: COLORS.PRIMARY_DARK }]}
                  >
                    {repeater.callSign}
                  </Text>
                  <Text
                    style={[styles.distance, { color: COLORS.PRIMARY_DARK }]}
                  >
                    {repeater.distance} mi
                  </Text>
                </View>

                <View style={styles.rowMeta}>
                  <Text
                    style={[styles.metaText, { color: COLORS.PRIMARY_DARK }]}
                  >
                    {repeater.frequency} MHz
                  </Text>
                  {repeater.offset ? (
                    <Text
                      style={[styles.metaText, { color: COLORS.PRIMARY_DARK }]}
                    >
                      {' '}
                      · {repeater.offset}
                    </Text>
                  ) : null}
                  {repeater.tone ? (
                    <Text
                      style={[styles.metaText, { color: COLORS.PRIMARY_DARK }]}
                    >
                      {' '}
                      · PL {repeater.tone}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.rowBottom}>
                  <View
                    style={[styles.modeBadge, { borderColor: COLORS.ACCENT }]}
                  >
                    <Text style={[styles.modeText, { color: COLORS.ACCENT }]}>
                      {repeater.mode}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.locationText,
                      { color: COLORS.PRIMARY_DARK },
                    ]}
                  >
                    {repeater.city}
                    {repeater.state ? `, ${repeater.state}` : ''}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Background refresh indicator */}
          {store.isLoading && store.repeaters.length > 0 && (
            <View style={styles.refreshRow}>
              <ActivityIndicator size="small" color={COLORS.ACCENT} />
              <Text
                style={[styles.refreshText, { color: COLORS.PRIMARY_DARK }]}
              >
                Refreshing…
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenBody>
  );
});

export default RepeaterBookScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    paddingBottom: FOOTER_HEIGHT,
  },
  statusBar: {
    marginHorizontal: 14,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterRow: {
    maxHeight: 48,
    marginTop: 8,
  },
  filterRowContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  centered: {
    paddingTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  helperText: {
    fontSize: 15,
    opacity: 0.8,
    textAlign: 'center',
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callSign: {
    fontSize: 16,
    fontWeight: '700',
  },
  distance: {
    fontSize: 13,
    opacity: 0.7,
  },
  rowMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  modeBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  locationText: {
    fontSize: 12,
    opacity: 0.7,
    flex: 1,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  refreshText: {
    fontSize: 13,
    opacity: 0.7,
  },
});

// Re-export route param type for AppNavigator
export type RepeaterBookScreenParams = undefined;
