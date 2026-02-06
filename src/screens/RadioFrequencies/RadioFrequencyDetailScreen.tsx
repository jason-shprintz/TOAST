import { RouteProp, useRoute } from '@react-navigation/native';
import React, { JSX } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { FOOTER_HEIGHT } from '../../theme';

type Channel = {
  name: string;
  frequency: string;
  mode: string;
  notes: string;
};

type FrequencyData = {
  id: string;
  title: string;
  requiresLicense: boolean;
  licenseInfo: string;
  description: string;
  channels: Channel[];
};

type RadioFrequencyDetailScreenRouteProp = RouteProp<
  { RadioFrequencyDetail: { frequencyData: FrequencyData } },
  'RadioFrequencyDetail'
>;

/**
 * Displays detailed information about a specific radio frequency type.
 *
 * Shows a list of national channels/frequencies in an easy-to-read table format,
 * includes licensing information and disclaimers, and is fully dark mode compliant.
 *
 * @component
 * @returns {JSX.Element} The rendered radio frequency detail screen.
 */
export default function RadioFrequencyDetailScreen(): JSX.Element {
  const route = useRoute<RadioFrequencyDetailScreenRouteProp>();
  const COLORS = useTheme();
  const { frequencyData } = route.params || {};

  if (!frequencyData) {
    return (
      <ScreenBody>
        <SectionHeader>Frequency Not Found</SectionHeader>
        <View style={styles.missingWrap}>
          <Text style={styles.helperText}>
            No data available for this frequency type.
          </Text>
        </View>
      </ScreenBody>
    );
  }

  return (
    <ScreenBody>
      <SectionHeader>{frequencyData.title}</SectionHeader>

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* License Information */}
          <View
            style={[
              styles.licenseCard,
              {
                backgroundColor: frequencyData.requiresLicense
                  ? COLORS.ERROR_LIGHT
                  : COLORS.SUCCESS_LIGHT,
                borderColor: frequencyData.requiresLicense
                  ? COLORS.ERROR
                  : COLORS.SUCCESS,
              },
            ]}
          >
            <Text style={[styles.licenseText, { color: COLORS.PRIMARY_DARK }]}>
              {frequencyData.licenseInfo}
            </Text>
          </View>

          {/* Description */}
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
              About
            </Text>
            <Text style={[styles.cardBody, { color: COLORS.PRIMARY_DARK }]}>
              {frequencyData.description}
            </Text>
          </View>

          {/* Frequency Table */}
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
              National Frequencies
            </Text>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.tableCell}>
                <Text
                  style={[styles.headerText, { color: COLORS.PRIMARY_DARK }]}
                >
                  Channel
                </Text>
              </View>
              <View style={styles.tableCell}>
                <Text
                  style={[styles.headerText, { color: COLORS.PRIMARY_DARK }]}
                >
                  Frequency
                </Text>
              </View>
              <View style={styles.tableCell}>
                <Text
                  style={[styles.headerText, { color: COLORS.PRIMARY_DARK }]}
                >
                  Mode
                </Text>
              </View>
            </View>

            {/* Table Rows */}
            {frequencyData.channels.map((channel, index) => (
              <View key={index}>
                <View
                  style={[
                    styles.tableRow,
                    index % 2 === 1 && {
                      backgroundColor: COLORS.BACKGROUND,
                    },
                  ]}
                >
                  <View style={styles.tableCell}>
                    <Text
                      style={[styles.cellText, { color: COLORS.PRIMARY_DARK }]}
                    >
                      {channel.name}
                    </Text>
                  </View>
                  <View style={styles.tableCell}>
                    <Text
                      style={[
                        styles.cellText,
                        styles.frequencyText,
                        { color: COLORS.PRIMARY_DARK },
                      ]}
                    >
                      {channel.frequency}
                    </Text>
                  </View>
                  <View style={styles.tableCell}>
                    <Text
                      style={[styles.cellText, { color: COLORS.PRIMARY_DARK }]}
                    >
                      {channel.mode}
                    </Text>
                  </View>
                </View>
                {channel.notes && (
                  <View
                    style={[
                      styles.notesRow,
                      index % 2 === 1 && {
                        backgroundColor: COLORS.BACKGROUND,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.notesText, { color: COLORS.PRIMARY_DARK }]}
                    >
                      {channel.notes}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
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
    paddingTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  missingWrap: {
    paddingHorizontal: 14,
    paddingVertical: 20,
  },
  helperText: {
    fontSize: 16,
    opacity: 0.8,
  },
  licenseCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  licenseText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#C09A6B',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cellText: {
    fontSize: 13,
    lineHeight: 18,
  },
  frequencyText: {
    fontWeight: '600',
  },
  notesRow: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: 4,
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
    lineHeight: 16,
  },
});
