import React, { JSX } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { FOOTER_HEIGHT } from '../../theme';

/**
 * Displays radio frequency categories for different communication systems.
 *
 * Shows categories for HAM, CB, GMRS, FRS, and MURS radio frequencies
 * in a grid layout using standard cards. Content includes proper bottom
 * padding to prevent overflow into the footer.
 *
 * @component
 * @returns {JSX.Element} The rendered radio frequencies screen.
 */
export default function RadioFrequenciesScreen(): JSX.Element {
  const radioCategories = [
    { id: 'ham', title: 'HAM', icon: 'radio-outline' },
    { id: 'cb', title: 'CB', icon: 'chatbubbles-outline' },
    { id: 'gmrs', title: 'GMRS', icon: 'wifi-outline' },
    { id: 'frs', title: 'FRS', icon: 'phone-portrait-outline' },
    { id: 'murs', title: 'MURS', icon: 'headset-outline' },
  ];

  const handleCategoryPress = (categoryId: string) => {
    // Placeholder - will be implemented in future
    console.log(`Selected category: ${categoryId}`);
  };

  return (
    <ScreenBody>
      <SectionHeader>Radio Frequencies</SectionHeader>

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Grid>
            {radioCategories.map((category) => (
              <CardTopic
                key={category.id}
                title={category.title}
                icon={category.icon}
                onPress={() => handleCategoryPress(category.id)}
              />
            ))}
          </Grid>
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
    paddingHorizontal: 2,
    paddingBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
});
