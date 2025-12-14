import { useRoute, useNavigation } from '@react-navigation/native';
import React, { JSX, useMemo } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import data from '../../data/survival.json';

export default function SurvivalCategoryScreen(): JSX.Element {
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
              <CardTopic
                key={item.id}
                title={item.title}
                icon="document-text-outline"
                onPress={() =>
                  navigation.navigate('SurvivalEntry', { entry: item })
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
