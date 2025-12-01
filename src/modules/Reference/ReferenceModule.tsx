import React from 'react';
import { View, StyleSheet } from 'react-native';
import PlaceholderCard from '../../components/PlaceholderCard';
import { COLORS } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import SectionHeader from '../../components/SectionHeader';

export default function ReferenceModule() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <SectionHeader>Reference</SectionHeader>
      <View style={styles.grid}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
});
