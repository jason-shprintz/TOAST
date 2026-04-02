import { observer } from 'mobx-react-lite';
import React, { JSX, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScreenBody from '../../components/ScreenBody';
import { Text } from '../../components/ScaledText';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { useInventoryStore, usePantryStore } from '../../stores/StoreContext';
import { calculate, readinessLabel } from './depletionCalculatorUtils';

/**
 * DepletionCalculatorScreen
 *
 * Estimates how long a household's pantry and inventory will last given a
 * configurable number of people. All math is approximate and for entertainment
 * purposes only.
 */
export default observer(function DepletionCalculatorScreen(): JSX.Element {
  const COLORS = useTheme();
  const pantryStore = usePantryStore();
  const inventoryStore = useInventoryStore();

  const [peopleInput, setPeopleInput] = useState('1');
  const [hasCalculated, setHasCalculated] = useState(false);

  const people = Math.max(1, parseInt(peopleInput, 10) || 1);
  const hasItems =
    pantryStore.items.length > 0 || inventoryStore.items.length > 0;

  // Derive result inline so MobX observer always keeps it fresh after Calculate is pressed
  const calculated = hasCalculated
    ? calculate(pantryStore.items, inventoryStore.items, people)
    : null;

  function handleCalculate() {
    setHasCalculated(true);
  }

  function formatDays(days: number): string {
    if (days < 1) return 'Less than 1 day';
    const rounded = Math.round(days);
    if (rounded === 1) return '1 day';
    if (rounded < 7) return `${rounded} days`;
    const weeks = Math.floor(rounded / 7);
    const rem = rounded % 7;
    const weekStr = weeks === 1 ? '1 week' : `${weeks} weeks`;
    if (rem === 0) return weekStr;
    return `${weekStr}, ${rem} day${rem > 1 ? 's' : ''}`;
  }

  const styles = makeStyles(COLORS);

  return (
    <ScreenBody>
      <SectionHeader>Depletion Calculator</SectionHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={COLORS.TOAST_BROWN}
          />
          <Text style={styles.disclaimerText}>
            Estimates are rough and for entertainment only. Actual consumption
            depends on diet, activity level, and item types.
          </Text>
        </View>

        {/* People input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Household Size</Text>
          <Text style={styles.cardSubtitle}>
            How many people are you planning for?
          </Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() =>
                setPeopleInput(String(Math.max(1, people - 1)))
              }
              accessibilityLabel="Decrease people count"
            >
              <Ionicons name="remove" size={22} color={COLORS.PRIMARY_DARK} />
            </TouchableOpacity>
            <TextInput
              style={styles.stepInput}
              value={peopleInput}
              onChangeText={setPeopleInput}
              keyboardType="number-pad"
              maxLength={3}
              accessibilityLabel="Number of people"
            />
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setPeopleInput(String(people + 1))}
              accessibilityLabel="Increase people count"
            >
              <Ionicons name="add" size={22} color={COLORS.PRIMARY_DARK} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stock summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Stock</Text>
          <View style={styles.statRow}>
            <Ionicons
              name="nutrition-outline"
              size={18}
              color={COLORS.TOAST_BROWN}
            />
            <Text style={styles.statLabel}>
              Pantry items: {pantryStore.items.length}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Ionicons
              name="cube-outline"
              size={18}
              color={COLORS.TOAST_BROWN}
            />
            <Text style={styles.statLabel}>
              Inventory items: {inventoryStore.items.length}
            </Text>
          </View>
          {!hasItems && (
            <Text style={styles.emptyNote}>
              Add items to your Pantry and Inventory to get an estimate.
            </Text>
          )}
        </View>

        {/* Calculate button */}
        <TouchableOpacity
          style={[styles.calcBtn, !hasItems && styles.calcBtnDisabled]}
          onPress={handleCalculate}
          disabled={!hasItems}
          accessibilityLabel="Calculate depletion estimate"
          accessibilityRole="button"
        >
          <Ionicons name="calculator-outline" size={20} color="#fff" />
          <Text style={styles.calcBtnText}>Calculate</Text>
        </TouchableOpacity>

        {/* Results */}
        {calculated !== null && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Estimate</Text>

            {/* Readiness badge */}
            {(() => {
              const { label, icon } = readinessLabel(calculated.totalDays);
              return (
                <View style={styles.badgeRow}>
                  <Ionicons
                    name={icon}
                    size={20}
                    color={COLORS.ACCENT}
                  />
                  <Text style={styles.badgeText}>{label}</Text>
                </View>
              );
            })()}

            <View style={styles.divider} />

            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Food supply (pantry)</Text>
              <Text style={styles.resultVal}>
                {formatDays(calculated.pantryDays)}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultKey}>Gear & supply bonus</Text>
              <Text style={styles.resultVal}>
                +{formatDays(calculated.inventoryBonus)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultRow}>
              <Text style={[styles.resultKey, styles.totalKey]}>
                Total estimated runway
              </Text>
              <Text style={[styles.resultVal, styles.totalVal]}>
                {formatDays(calculated.totalDays)}
              </Text>
            </View>

            <Text style={styles.forPeople}>
              For {people} {people === 1 ? 'person' : 'people'}, based on{' '}
              {calculated.itemCount} tracked items
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenBody>
  );
});

function makeStyles(COLORS: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 40, gap: 16 },
    disclaimerBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: COLORS.BACKGROUND,
      borderRadius: 10,
      padding: 12,
    },
    disclaimerText: {
      flex: 1,
      fontSize: 12,
      color: COLORS.PRIMARY_DARK,
      opacity: 0.75,
      lineHeight: 18,
    },
    card: {
      backgroundColor: COLORS.PRIMARY_LIGHT,
      borderRadius: 12,
      padding: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: COLORS.TOAST_BROWN + '40',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.PRIMARY_DARK,
    },
    cardSubtitle: {
      fontSize: 13,
      color: COLORS.PRIMARY_DARK,
      opacity: 0.7,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginTop: 4,
    },
    stepBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.BACKGROUND,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepInput: {
      width: 60,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '700',
      color: COLORS.PRIMARY_DARK,
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statLabel: {
      fontSize: 14,
      color: COLORS.PRIMARY_DARK,
    },
    emptyNote: {
      fontSize: 13,
      color: COLORS.PRIMARY_DARK,
      opacity: 0.6,
      fontStyle: 'italic',
      marginTop: 4,
    },
    calcBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: COLORS.ACCENT,
      borderRadius: 12,
      paddingVertical: 14,
    },
    calcBtnDisabled: {
      opacity: 0.4,
    },
    calcBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    resultsCard: {
      backgroundColor: COLORS.PRIMARY_LIGHT,
      borderRadius: 12,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: COLORS.TOAST_BROWN + '40',
    },
    resultsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.PRIMARY_DARK,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badgeText: {
      fontSize: 15,
      fontWeight: '600',
      color: COLORS.ACCENT,
    },
    divider: {
      height: 1,
      backgroundColor: COLORS.TOAST_BROWN + '30',
    },
    resultRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    resultKey: {
      fontSize: 14,
      color: COLORS.PRIMARY_DARK,
      opacity: 0.8,
    },
    resultVal: {
      fontSize: 14,
      fontWeight: '500',
      color: COLORS.PRIMARY_DARK,
    },
    totalKey: {
      fontWeight: '600',
      opacity: 1,
    },
    totalVal: {
      fontWeight: '700',
      fontSize: 16,
      color: COLORS.ACCENT,
    },
    forPeople: {
      fontSize: 12,
      color: COLORS.PRIMARY_DARK,
      opacity: 0.55,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 4,
    },
  });
}
