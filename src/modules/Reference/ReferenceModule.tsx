import React from 'react';
import { View, StyleSheet } from 'react-native';
import PlaceholderCard from '../../components/PlaceholderCard';
import { COLORS } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import SectionHeader from '../../components/SectionHeader';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';

export default function ReferenceModule() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <LogoHeader />
      <SectionHeader>Reference</SectionHeader>
      <Grid style={styles.gridSpacing}>
        <PlaceholderCard
          title="Book"
          icon="book-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Book',
              icon: 'book-outline',
            })
          }
        />
        <PlaceholderCard
          title="Bookmark"
          icon="bookmark-outline"
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Bookmark',
              icon: 'bookmark-outline',
            })
          }
        />
      </Grid>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  // grid replaced by shared Grid component
  gridSpacing: {
    paddingTop: 20,
  },
});
