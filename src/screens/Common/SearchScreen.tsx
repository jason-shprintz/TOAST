import { useNavigation } from '@react-navigation/native';
import React, { JSX, useState, useCallback } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import { COLORS, FOOTER_HEIGHT } from '../../theme';
import { searchItems, SearchableItem } from '../../utils/searchData';

/**
 * SearchScreen component allows users to search across all app content.
 * Features:
 * - Real-time search as user types
 * - Results displayed in grid with card layout
 * - Shows appropriate message when no results found
 * - Results sorted alphabetically
 * - Swipe back navigation supported
 */
export default function SearchScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableItem[]>([]);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    const searchResults = searchItems(text);
    setResults(searchResults);
  }, []);

  const handleItemPress = useCallback(
    (item: SearchableItem) => {
      if (item.screen === 'ComingSoon') {
        navigation.navigate('ComingSoon', {
          title: item.title,
          icon: item.icon,
        });
      } else if (item.screen === 'Entry') {
        // For reference entries, pass the entry data
        navigation.navigate('Entry', item.data);
      } else {
        navigation.navigate(item.screen);
      }
    },
    [navigation],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return (
    <ScreenBody>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.PRIMARY_DARK}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search TOAST..."
            placeholderTextColor={COLORS.PRIMARY_DARK + '80'}
            value={query}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
            accessibilityLabel="Search input"
          />
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            disabled={query.length === 0}
          >
            {query.length > 0 && (
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.PRIMARY_DARK}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resultsContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {query.trim() === '' && (
            <Text style={styles.helperText}>
              Start typing to search across all TOAST content
            </Text>
          )}

          {query.trim() !== '' && results.length === 0 && (
            <Text style={styles.helperText}>
              No results found for "{query}"
            </Text>
          )}

          {results.length > 0 && (
            <Grid>
              {results.map(item => (
                <CardTopic
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  onPress={() => handleItemPress(item)}
                />
              ))}
            </Grid>
          )}
        </ScrollView>
      </View>
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    backgroundColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    padding: 0,
  },
  clearButton: {
    padding: 4,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsContainer: {
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
    width: '100%',
    paddingBottom: 24,
    alignItems: 'center',
  },
  helperText: {
    fontSize: 16,
    opacity: 0.8,
    marginHorizontal: 20,
    marginTop: 20,
    textAlign: 'center',
    color: COLORS.PRIMARY_DARK,
  },
});
