import { observer } from 'mobx-react-lite';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { COLORS } from '../../theme';
import { morseToText } from '../../utils/morseCodeMapping';

/**
 * Morse to Alpha screen allows users to input morse code and see real-time translation.
 *
 * Features:
 * - Buttons for dot, dash, space (word separator), and backspace
 * - Real-time translation as user types
 * - No submit button - translation happens automatically
 * - Shows both morse code input and translated text output
 */
const MorseToAlphaScreenImpl = () => {
  const [morseInput, setMorseInput] = useState('');
  const [translatedText, setTranslatedText] = useState('');

  // Update translation whenever morse input changes
  useEffect(() => {
    setTranslatedText(morseToText(morseInput));
  }, [morseInput]);

  const handleDot = () => {
    setMorseInput(prev => prev + '.');
  };

  const handleDash = () => {
    setMorseInput(prev => prev + '-');
  };

  const handleSpace = () => {
    // Only add space if the last character isn't already a space
    if (morseInput.length > 0 && morseInput[morseInput.length - 1] !== ' ') {
      setMorseInput(prev => prev + ' ');
    }
  };

  const handleBackspace = () => {
    setMorseInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setMorseInput('');
  };

  return (
    <ScreenBody>
      <SectionHeader>Morse to Alpha</SectionHeader>

      <View style={styles.container}>
        {/* Morse Code Input Display */}
        <View style={styles.displayContainer}>
          <Text style={styles.displayLabel}>Morse Code:</Text>
          <View style={styles.displayBox}>
            <Text style={styles.displayText}>
              {morseInput || 'Enter morse code...'}
            </Text>
          </View>
        </View>

        {/* Translated Text Display */}
        <View style={styles.displayContainer}>
          <Text style={styles.displayLabel}>Translation:</Text>
          <View style={styles.displayBox}>
            <Text style={styles.translatedText}>
              {translatedText || '-'}
            </Text>
          </View>
        </View>

        {/* Input Buttons */}
        <View style={styles.buttonGrid}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleDot}
            >
              <Text style={styles.primaryButtonText}>.</Text>
              <Text style={styles.buttonLabel}>DOT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleDash}
            >
              <Text style={styles.primaryButtonText}>-</Text>
              <Text style={styles.buttonLabel}>DASH</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSpace}
            >
              <Text style={styles.secondaryButtonText}>⎵</Text>
              <Text style={styles.buttonLabel}>SPACE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleBackspace}
            >
              <Text style={styles.secondaryButtonText}>⌫</Text>
              <Text style={styles.buttonLabel}>BACK</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Tip: Use dot and dash to build characters. Press space between characters and use / for word breaks.
          </Text>
        </View>
      </View>
    </ScreenBody>
  );
};

export default observer(MorseToAlphaScreenImpl);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  displayContainer: {
    width: '100%',
    marginBottom: 20,
  },
  displayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 8,
  },
  displayBox: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
    justifyContent: 'center',
  },
  displayText: {
    fontSize: 20,
    color: COLORS.PRIMARY_DARK,
    fontFamily: 'monospace',
  },
  translatedText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.ACCENT,
  },
  buttonGrid: {
    width: '100%',
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.ACCENT,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
  },
  primaryButtonText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.PRIMARY_LIGHT,
  },
  secondaryButton: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
  },
  secondaryButtonText: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    marginTop: 4,
  },
  clearButton: {
    backgroundColor: COLORS.TOAST_BROWN,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.PRIMARY_LIGHT,
  },
  helpContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY_ACCENT,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.SECONDARY_ACCENT,
    textAlign: 'center',
  },
});
