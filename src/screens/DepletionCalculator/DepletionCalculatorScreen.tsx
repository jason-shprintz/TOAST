import { observer } from 'mobx-react-lite';
import React, { JSX, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { useInventoryStore } from '../../stores/StoreContext';
import { usePantryStore } from '../../stores/StoreContext';

/**
 * Category-level estimates for how many person-days a single unit provides.
 * These are intentionally rough — the feature is for entertainment.
 */
const PANTRY_DAYS_PER_UNIT: Record<string, number> = {
  'Canned Goods': 1.5,
  'Dry Goods': 3,
  Frozen: 2,
  Fresh: 0.5,
};
const DEFAULT_PANTRY_DAYS_PER_UNIT = 1;

/** Non-food inventory contributes to a generic "supply readiness" score (days). */
const INVENTORY_DAYS_PER_UNIT: Record<string, number> = {
  'Home Base': 0.5,
  'Main Vehicle': 0.25,
};
const DEFAULT_INVENTORY_DAYS_PER_UNIT = 0.3;

interface ResultBreakdown {
  pantryDays: number;
  inventoryBonus: number;
  totalDays: number;
  itemCount: number;
}

function calculate(
  pantryItems: ReturnType<typeof usePantryStore>['items'],
  inventoryItems: ReturnType<typeof useInventoryStore>['items'],
  people: number,
): ResultBreakdown {
  const safepeople = Math.max(1, people);

  // Food supply estimate
  let rawFoodPersonDays = 0;
  for (const item of pantryItems) {
    const rate =
      PANTRY_DAYS_PER_UNIT[item.category] ?? DEFAULT_PANTRY_DAYS_PER_UNIT;
    rawFoodPersonDays += item.quantity * rate;
  }
  const pantryDays = rawFoodPersonDays / safepeople;

  // Inventory "bonus" days (water, gear, medical adds resilience)
  let rawInventoryPersonDays = 0;
  for (const item of inventoryItems) {
    const rate =
      INVENTORY_DAYS_PER_UNIT[item.category] ?? DEFAULT_INVENTORY_DAYS_PER_UNIT;
    rawInventoryPersonDays += item.quantity * rate;
  }
  const inventoryBonus = rawInventoryPersonDays / safepeople;

  return {
    pantryDays,
    inventoryBonus,
    totalDays: pantryDays + inventoryBonus,
    itemCount: pantryItems.length + inventoryItems.length,
  };
}

function readinessLabel(days: number): { label: string; icon: string } {
  if (days < 3) return { label: 'Critical — less than 72 hours', icon: 'warning-outline' };
  if (days < 7) return { label: 'Low — under a week', icon: 'alert-circle-outline' };
  if (days < 30) return { label: 'Moderate — a few weeks', icon: 'checkmark-circle-outline' };
  if (days < 90) return { label: 'Good — over a month', icon: 'shield-checkmark-outline' };
  return { label: 'Excellent — 3+ months', icon: 'star-outline' };
}

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
  const [calculated, setCalculated] = useState<ResultBreakdown | null>(null);

  const people = Math.max(1, parseInt(peopleInput, 10) || 1);
  const hasItems =
    pantryStore.items.length > 0 || inventoryStore.items.length > 0;

  function handleCalculate() {
    const result = calculate(pantryStore.items, inventoryStore.items, people);
    setCalculated(result);
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
