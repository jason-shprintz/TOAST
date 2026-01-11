import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { COLORS, FOOTER_HEIGHT } from '../../theme';

type MorseItem = {
  char: string;
  morse: string;
  spellOut: string;
};

const morseCodeData: MorseItem[] = [
  // Alphabet
  { char: 'A', morse: '.-', spellOut: 'dot dash' },
  { char: 'B', morse: '-...', spellOut: 'dash dot dot dot' },
  { char: 'C', morse: '-.-.', spellOut: 'dash dot dash dot' },
  { char: 'D', morse: '-..', spellOut: 'dash dot dot' },
  { char: 'E', morse: '.', spellOut: 'dot' },
  { char: 'F', morse: '..-.', spellOut: 'dot dot dash dot' },
  { char: 'G', morse: '--.', spellOut: 'dash dash dot' },
  { char: 'H', morse: '....', spellOut: 'dot dot dot dot' },
  { char: 'I', morse: '..', spellOut: 'dot dot' },
  { char: 'J', morse: '.---', spellOut: 'dot dash dash dash' },
  { char: 'K', morse: '-.-', spellOut: 'dash dot dash' },
  { char: 'L', morse: '.-..', spellOut: 'dot dash dot dot' },
  { char: 'M', morse: '--', spellOut: 'dash dash' },
  { char: 'N', morse: '-.', spellOut: 'dash dot' },
  { char: 'O', morse: '---', spellOut: 'dash dash dash' },
  { char: 'P', morse: '.--.', spellOut: 'dot dash dash dot' },
  { char: 'Q', morse: '--.-', spellOut: 'dash dash dot dash' },
  { char: 'R', morse: '.-.', spellOut: 'dot dash dot' },
  { char: 'S', morse: '...', spellOut: 'dot dot dot' },
  { char: 'T', morse: '-', spellOut: 'dash' },
  { char: 'U', morse: '..-', spellOut: 'dot dot dash' },
  { char: 'V', morse: '...-', spellOut: 'dot dot dot dash' },
  { char: 'W', morse: '.--', spellOut: 'dot dash dash' },
  { char: 'X', morse: '-..-', spellOut: 'dash dot dot dash' },
  { char: 'Y', morse: '-.--', spellOut: 'dash dot dash dash' },
  { char: 'Z', morse: '--..', spellOut: 'dash dash dot dot' },
  // Numbers
  { char: '0', morse: '-----', spellOut: 'dash dash dash dash dash' },
  { char: '1', morse: '.----', spellOut: 'dot dash dash dash dash' },
  { char: '2', morse: '..---', spellOut: 'dot dot dash dash dash' },
  { char: '3', morse: '...--', spellOut: 'dot dot dot dash dash' },
  { char: '4', morse: '....-', spellOut: 'dot dot dot dot dash' },
  { char: '5', morse: '.....', spellOut: 'dot dot dot dot dot' },
  { char: '6', morse: '-....', spellOut: 'dash dot dot dot dot' },
  { char: '7', morse: '--...', spellOut: 'dash dash dot dot dot' },
  { char: '8', morse: '---..', spellOut: 'dash dash dash dot dot' },
  { char: '9', morse: '----.', spellOut: 'dash dash dash dash dot' },
];

type SortType = 'alphabetical' | 'morse';

/**
 * Displays the Morse Code Cheat Sheet with all letters (A-Z) and numbers (0-9).
 *
 * Each character is shown with its corresponding Morse code pattern.
 * Users can toggle between alphabetical sorting (A-Z, then 0-9) and Morse pattern sorting (shortest to longest).
 * The content is scrollable to accommodate all entries and ensure visibility past the footer.
 *
 * @returns A React element containing the Morse Code Cheat Sheet screen.
 */
export default function MorseCodeCheatSheet() {
  const [sortType, setSortType] = useState<SortType>('alphabetical');

  const getSortedData = (): MorseItem[] => {
    if (sortType === 'alphabetical') {
      // Already sorted alphabetically in the data array (A-Z, then 0-9)
      return morseCodeData;
    } else {
      // Sort by morse code pattern length (shortest to longest), then alphabetically for same length
      return [...morseCodeData].sort((a, b) => {
        const lengthDiff = a.morse.length - b.morse.length;
        if (lengthDiff !== 0) return lengthDiff;
        return a.char.localeCompare(b.char);
      });
    }
  };

  const toggleSort = () => {
    setSortType(sortType === 'alphabetical' ? 'morse' : 'alphabetical');
  };

  const sortedData = getSortedData();

  return (
    <ScreenBody>
      <SectionHeader>Morse Code Cheat Sheet</SectionHeader>
      <View style={styles.container}>
        <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
          <Text style={styles.sortButtonText}>
            Sort: {sortType === 'alphabetical' ? 'Alphabetical' : 'By Pattern'}
          </Text>
        </TouchableOpacity>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {sortedData.map(item => (
            <View key={item.char} style={styles.card}>
              <Text style={styles.char}>{item.char}</Text>
              <Text style={styles.separator}>➡️</Text>
              <Text style={styles.morse}>{item.morse}</Text>
              <Text style={styles.separator}>➡️</Text>
              <Text style={styles.spellOut}>{item.spellOut}</Text>
            </View>
          ))}
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
  sortButton: {
    backgroundColor: COLORS.TOAST_BROWN,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY_LIGHT,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.TOAST_BROWN,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  char: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
    width: 40,
  },
  separator: {
    fontSize: 20,
    color: COLORS.PRIMARY_DARK,
    marginHorizontal: 5,
  },
  morse: {
    fontSize: 30,
    fontFamily: 'monospace',
    color: COLORS.PRIMARY_DARK,
    marginHorizontal: 5,
    minWidth: 90,
  },
  spellOut: {
    fontSize: 18,
    color: COLORS.PRIMARY_DARK,
    flex: 1,
  },
});
