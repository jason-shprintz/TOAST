import { useRoute, useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text } from 'react-native';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import data from '../../data/health.json';
import { COLORS } from '../../theme';

export default function HealthEntryScreen() {
  const route = useRoute<any>();
  useNavigation<any>();
  const { id } = route.params || {};

  const entry = useMemo(() => {
    return (data.entries || []).find(e => e.id === id);
  }, [id]);

  if (!entry) {
    return (
      <ScreenContainer>
        <LogoHeader />
        <SectionHeader>Topic Not Found</SectionHeader>
        <View style={styles.missingWrap}>
          <Text style={styles.helperText}>
            No data available for this topic.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>{entry.title}</SectionHeader>
      <ScrollView contentContainerStyle={styles.container}>
        {!!entry.summary && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Summary</Text>
            <Text style={styles.cardBody}>{entry.summary}</Text>
          </View>
        )}

        {!!entry.steps?.length && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Steps</Text>
            {entry.steps.map((s: string, idx: number) => (
              <Text key={idx} style={styles.listItem}>{`• ${s}`}</Text>
            ))}
          </View>
        )}

        {!!entry.do_not?.length && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Do Not</Text>
            {entry.do_not.map((s: string, idx: number) => (
              <Text key={idx} style={styles.listItem}>{`• ${s}`}</Text>
            ))}
          </View>
        )}

        {!!entry.watch_for?.length && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Watch For</Text>
            {entry.watch_for.map((s: string, idx: number) => (
              <Text key={idx} style={styles.listItem}>{`• ${s}`}</Text>
            ))}
          </View>
        )}

        {!!entry.notes?.length && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            {entry.notes.map((s: string, idx: number) => (
              <Text key={idx} style={styles.listItem}>{`• ${s}`}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
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
  card: {
    borderWidth: 1,
    borderColor: COLORS.TOAST_BROWN,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: COLORS.PRIMARY_LIGHT,
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
  listItem: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 6,
  },
});
