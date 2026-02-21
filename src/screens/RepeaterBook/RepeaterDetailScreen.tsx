import { RouteProp, useRoute } from '@react-navigation/native';
import React, { JSX } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { Repeater } from '../../stores/RepeaterBookStore';
import { FOOTER_HEIGHT } from '../../theme';

type RepeaterDetailRouteProp = RouteProp<
  { RepeaterDetail: { repeater: Repeater } },
  'RepeaterDetail'
>;

type DetailRow = { label: string; value: string };

/**
 * Displays full details for a single ham radio repeater from RepeaterBook.
 *
 * @returns {JSX.Element} The rendered repeater detail screen.
 */
export default function RepeaterDetailScreen(): JSX.Element {
  const COLORS = useTheme();
  const route = useRoute<RepeaterDetailRouteProp>();
  const { repeater } = route.params ?? {};

  if (!repeater) {
    return (
      <ScreenBody>
        <SectionHeader>Repeater</SectionHeader>
        <View style={styles.missing}>
          <Text style={[styles.helperText, { color: COLORS.PRIMARY_DARK }]}>
            No repeater data available.
          </Text>
        </View>
      </ScreenBody>
    );
  }

  const isOnAir = repeater.operationalStatus === 'On-air';

  const rows: DetailRow[] = [
    { label: 'Frequency', value: `${repeater.frequency} MHz` },
    { label: 'Offset', value: repeater.offset || '—' },
    { label: 'PL / Tone', value: repeater.tone || '—' },
    { label: 'Mode', value: repeater.mode },
    { label: 'Use', value: repeater.use || '—' },
    { label: 'Status', value: repeater.operationalStatus || 'Unknown' },
    {
      label: 'Location',
      value: [repeater.city, repeater.state].filter(Boolean).join(', ') || '—',
    },
    { label: 'Distance', value: `${repeater.distance} miles` },
    {
      label: 'Coordinates',
      value:
        repeater.lat && repeater.lng
          ? `${repeater.lat.toFixed(4)}, ${repeater.lng.toFixed(4)}`
          : '—',
    },
    { label: 'Last Edited', value: repeater.lastEdited || '—' },
  ];

  return (
    <ScreenBody>
      <SectionHeader>{repeater.callSign}</SectionHeader>

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Status badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isOnAir
                  ? COLORS.SUCCESS_LIGHT
                  : COLORS.BACKGROUND,
                borderColor: isOnAir ? COLORS.SUCCESS : COLORS.TOAST_BROWN,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isOnAir
                    ? COLORS.SUCCESS
                    : COLORS.TOAST_BROWN,
                },
              ]}
            />
            <Text style={[styles.statusText, { color: COLORS.PRIMARY_DARK }]}>
              {repeater.operationalStatus || 'Status unknown'}
            </Text>
          </View>

          {/* Detail card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: COLORS.PRIMARY_LIGHT,
                borderColor: COLORS.TOAST_BROWN,
              },
            ]}
          >
            {rows.map((row, i) => (
              <View
                key={row.label}
                style={[
                  styles.tableRow,
                  i % 2 === 1 && { backgroundColor: COLORS.BACKGROUND },
                ]}
              >
                <Text
                  style={[styles.labelText, { color: COLORS.PRIMARY_DARK }]}
                >
                  {row.label}
                </Text>
                <Text
                  style={[styles.valueText, { color: COLORS.PRIMARY_DARK }]}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Notes */}
          {repeater.notes ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: COLORS.PRIMARY_LIGHT,
                  borderColor: COLORS.TOAST_BROWN,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: COLORS.PRIMARY_DARK }]}>
                Notes
              </Text>
              <Text style={[styles.notesText, { color: COLORS.PRIMARY_DARK }]}>
                {repeater.notes}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    paddingBottom: FOOTER_HEIGHT,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 24,
  },
  missing: {
    paddingHorizontal: 14,
    paddingVertical: 20,
  },
  helperText: {
    fontSize: 16,
    opacity: 0.8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  labelText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  valueText: {
    flex: 2,
    fontSize: 14,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
