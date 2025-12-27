import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { COLORS } from '../../theme';
import {
  conversionCategories,
  ConversionUnit,
} from '../../utils/unitConversions';

type RouteParams = {
  ConversionCategory: {
    categoryId: string;
  };
};

/**
 * ConversionCategoryScreen displays unit conversions for a specific category.
 *
 * Features:
 * - Dropdown to select conversion type within the category
 * - Two-way conversion display
 * - Large numeric keypad for easy input with gloves
 * - Real-time conversion as user types
 *
 * @returns A React element rendering the conversion interface.
 */
export default function ConversionCategoryScreen() {
  const route = useRoute<RouteProp<RouteParams, 'ConversionCategory'>>();
  const { categoryId } = route.params;

  const category = conversionCategories.find((cat) => cat.id === categoryId);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);
  const [inputValue, setInputValue] = useState('0');
  const [isReversed, setIsReversed] = useState(false);

  if (!category) {
    return (
      <ScreenBody>
        <SectionHeader>Error</SectionHeader>
        <Text style={styles.errorText}>Category not found</Text>
      </ScreenBody>
    );
  }

  const selectedUnit: ConversionUnit = category.units[selectedUnitIndex];

  const handleNumberPress = (num: string) => {
    setInputValue((prev) => {
      if (prev === '0') {
        return num;
      }
      return prev + num;
    });
  };

  const handleDecimalPress = () => {
    if (!inputValue.includes('.')) {
      setInputValue((prev) => prev + '.');
    }
  };

  const handleClear = () => {
    setInputValue('0');
  };

  const handleBackspace = () => {
    setInputValue((prev) => {
      if (prev.length === 1) {
        return '0';
      }
      return prev.slice(0, -1);
    });
  };

  const handleSwap = () => {
    setIsReversed((prev) => !prev);
  };

  const getConvertedValue = (): string => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      return '0';
    }

    const result = isReversed
      ? selectedUnit.reverseConvert(numValue)
      : selectedUnit.convert(numValue);

    // Format to 6 significant digits max
    if (Math.abs(result) < 0.0001 && result !== 0) {
      return result.toExponential(4);
    }
    return result.toFixed(6).replace(/\.?0+$/, '');
  };

  const fromUnit = isReversed ? selectedUnit.toName : selectedUnit.fromName;
  const toUnit = isReversed ? selectedUnit.fromName : selectedUnit.toName;

  return (
    <ScreenBody>
      <SectionHeader>{category.name}</SectionHeader>

      {/* Unit Selection */}
      <ScrollView horizontal style={styles.unitSelector}>
        {category.units.map((unit, index) => (
          <TouchableOpacity
            key={unit.id}
            style={[
              styles.unitButton,
              selectedUnitIndex === index && styles.unitButtonActive,
            ]}
            onPress={() => setSelectedUnitIndex(index)}
          >
            <Text
              style={[
                styles.unitButtonText,
                selectedUnitIndex === index && styles.unitButtonTextActive,
              ]}
            >
              {unit.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Conversion Display */}
      <View style={styles.conversionContainer}>
        <View style={styles.valueContainer}>
          <Text style={styles.valueLabel}>{fromUnit}</Text>
          <Text style={styles.valueText}>{inputValue}</Text>
        </View>

        <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
          <Ionicons
            name="swap-vertical-outline"
            size={32}
            color={COLORS.ACCENT}
          />
        </TouchableOpacity>

        <View style={styles.valueContainer}>
          <Text style={styles.valueLabel}>{toUnit}</Text>
          <Text style={styles.valueText}>{getConvertedValue()}</Text>
        </View>
      </View>

      {/* Numeric Keypad */}
      <View style={styles.keypad}>
        <View style={styles.keypadRow}>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress('7')}
          >
            <Text style={styles.keypadButtonText}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress('8')}
          >
            <Text style={styles.keypadButtonText}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress('9')}
          >
            <Text style={styles.keypadButtonText}>9</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress('4')}
          >
            <Text style={styles.keypadButtonText}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress('5')}
          >
            <Text style={styles.keypadButtonText}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress('6')}
          >
            <Text style={styles.keypadButtonText}>6</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress('1')}
          >
            <Text style={styles.keypadButtonText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress('2')}
          >
            <Text style={styles.keypadButtonText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress('3')}
          >
            <Text style={styles.keypadButtonText}>3</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={handleDecimalPress}
          >
            <Text style={styles.keypadButtonText}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress('0')}
          >
            <Text style={styles.keypadButtonText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={handleBackspace}
          >
            <Ionicons
              name="backspace-outline"
              size={28}
              color={COLORS.PRIMARY_DARK}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity
            style={[styles.keypadButton, styles.clearButton]}
            onPress={handleClear}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  errorText: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
    textAlign: 'center',
    marginTop: 20,
  },
  unitSelector: {
    width: '100%',
    maxHeight: 50,
    marginTop: 10,
    marginBottom: 10,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.TOAST_BROWN,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
  },
  unitButtonActive: {
    backgroundColor: COLORS.ACCENT,
    borderColor: COLORS.ACCENT,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
  },
  unitButtonTextActive: {
    color: COLORS.PRIMARY_LIGHT,
  },
  conversionContainer: {
    width: '90%',
    marginVertical: 20,
  },
  valueContainer: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  valueLabel: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
    marginBottom: 4,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
  },
  swapButton: {
    alignSelf: 'center',
    padding: 8,
  },
  keypad: {
    width: '90%',
    marginTop: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 12,
  },
  keypadButton: {
    width: '30%',
    aspectRatio: 1.5,
    borderRadius: 12,
    backgroundColor: COLORS.TOAST_BROWN,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadButtonText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
  },
  clearButton: {
    width: '96%',
    backgroundColor: COLORS.ACCENT,
    borderColor: COLORS.ACCENT,
  },
  clearButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.PRIMARY_LIGHT,
  },
});
