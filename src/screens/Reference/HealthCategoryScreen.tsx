import { useRoute, useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import PlaceholderCard from '../../components/PlaceholderCard';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import data from '../../data/health.json';

export default function HealthCategoryScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { category, title } = route.params || {};

  const entries = useMemo(() => {
    return (data.entries || []).filter(e => e.category === category);
  }, [category]);

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>{title || category}</SectionHeader>
      <ScrollView contentContainerStyle={styles.container}>
        {entries.length === 0 && (
          <Text style={styles.helperText}>No topics found.</Text>
        )}
        <Grid>
            {entries
            .slice()
            .sort((a, b) => a.title.localeCompare(b.title))
            .map(item => (
              <PlaceholderCard
              key={item.id}
              title={item.title}
              icon="document-text-outline"
              onPress={() =>
                navigation.navigate('HealthEntry', { id: item.id })
              }
              />
            ))}
        </Grid>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  helperText: {
    fontSize: 16,
    opacity: 0.8,
    marginHorizontal: 6,
    marginBottom: 12,
  },
});
