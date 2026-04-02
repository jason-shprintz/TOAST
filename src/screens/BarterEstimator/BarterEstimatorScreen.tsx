import { observer } from 'mobx-react-lite';
import React, { JSX, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { useInventoryStore, usePantryStore } from '../../stores/StoreContext';

// ─────────────────────────────────────────────────────────────────────────────
// Barter value weights: how desirable is each unit in a post-grid economy?
// Higher = more trade value per unit.
// These are intentionally opinionated and for entertainment only.
// ─────────────────────────────────────────────────────────────────────────────

const PANTRY_BARTER_WEIGHT: Record<string, number> = {
  'Canned Goods': 3,
  'Dry Goods': 4,
  Frozen: 1, // freezers don't last in a grid-down situation
  Fresh: 2,
};
const DEFAULT_PANTRY_BARTER_WEIGHT = 2;

const INVENTORY_BARTER_WEIGHT: Record<string, number> = {
  'Home Base': 3,
  'Main Vehicle': 2,
};
const DEFAULT_INVENTORY_BARTER_WEIGHT = 2;

// Threshold: fraction of total score below which a category is "scarce"
const SCARCITY_THRESHOLD = 0.15; // bottom 15%
const SURPLUS_THRESHOLD = 0.35; // top 35%

type StockStatus = 'scarce' | 'balanced' | 'surplus';

interface CategoryScore {
  name: string;
  source: 'pantry' | 'inventory';
  rawScore: number;
  status: StockStatus;
  itemCount: number;
  totalQuantity: number;
}

interface BarterSummary {
  categories: CategoryScore[];
  offerItems: CategoryScore[];   // surplus — good to trade away
  wantItems: CategoryScore[];    // scarce — seek in trade
  totalScore: number;
  overallReadiness: 'poor' | 'fair' | 'good' | 'excellent';
}

function computeBarter(
  pantryItems: ReturnType<typeof usePantryStore>['items'],
  pantryCategories: string[],
  inventoryItems: ReturnType<typeof useInventoryStore>['items'],
  inventoryCategories: string[],
): BarterSummary {
  const scores: CategoryScore[] = [];

  // Pantry categories
  for (const cat of pantryCategories) {
    const catItems = pantryItems.filter((i) => i.category === cat);
    const totalQty = catItems.reduce((sum, i) => sum + i.quantity, 0);
    const weight = PANTRY_BARTER_WEIGHT[cat] ?? DEFAULT_PANTRY_BARTER_WEIGHT;
    scores.push({
      name: cat,
      source: 'pantry',
      rawScore: totalQty * weight,
      status: 'balanced', // filled in below
      itemCount: catItems.length,
      totalQuantity: totalQty,
    });
  }

  // Inventory categories
  for (const cat of inventoryCategories) {
    const catItems = inventoryItems.filter((i) => i.category === cat);
    const totalQty = catItems.reduce((sum, i) => sum + i.quantity, 0);
    const weight =
      INVENTORY_BARTER_WEIGHT[cat] ?? DEFAULT_INVENTORY_BARTER_WEIGHT;
    scores.push({
      name: cat,
      source: 'inventory',
      rawScore: totalQty * weight,
      status: 'balanced',
      itemCount: catItems.length,
      totalQuantity: totalQty,
    });
  }

  const totalScore = scores.reduce((s, c) => s + c.rawScore, 0);

  // Assign status relative to total
  for (const cat of scores) {
    const fraction = totalScore > 0 ? cat.rawScore / totalScore : 0;
    if (fraction <= SCARCITY_THRESHOLD) {
      cat.status = 'scarce';
    } else if (fraction >= SURPLUS_THRESHOLD) {
      cat.status = 'surplus';
    } else {
      cat.status = 'balanced';
    }
  }

  const offerItems = scores
    .filter((c) => c.status === 'surplus')
    .sort((a, b) => b.rawScore - a.rawScore);

  const wantItems = scores
    .filter((c) => c.status === 'scarce')
    .sort((a, b) => a.rawScore - b.rawScore);

  let overallReadiness: BarterSummary['overallReadiness'];
  if (totalScore === 0) {
    overallReadiness = 'poor';
  } else if (wantItems.length >= scores.length / 2) {
    overallReadiness = 'fair';
  } else if (offerItems.length >= 2) {
    overallReadiness = 'excellent';
  } else if (offerItems.length >= 1) {
    overallReadiness = 'good';
  } else {
    overallReadiness = 'fair';
  }

  return { categories: scores, offerItems, wantItems, totalScore, overallReadiness };
}

const STATUS_ICON: Record<StockStatus, string> = {
  surplus: 'trending-up-outline',
  balanced: 'remove-outline',
  scarce: 'trending-down-outline',
};

const READINESS_LABEL: Record<BarterSummary['overallReadiness'], string> = {
  poor: 'Poor — nothing to offer',
  fair: 'Fair — limited trade power',
  good: 'Good — a few bargaining chips',
  excellent: 'Excellent — strong barter position',
};

const READINESS_ICON: Record<BarterSummary['overallReadiness'], string> = {
  poor: 'warning-outline',
  fair: 'alert-circle-outline',
  good: 'checkmark-circle-outline',
  excellent: 'star-outline',
};

function CategoryRow({
  item,
  COLORS,
}: {
  item: CategoryScore;
  COLORS: ReturnType<typeof useTheme>;
}) {
  const styles = rowStyles(COLORS);
  const iconColor =
    item.status === 'surplus'
      ? COLORS.SUCCESS
      : item.status === 'scarce'
        ? COLORS.ERROR
        : COLORS.TOAST_BROWN;

  return (
    <View style={styles.row}>
      <Ionicons
        name={STATUS_ICON[item.status]}
        size={18}
        color={iconColor}
        style={styles.rowIcon}
      />
      <View style={styles.rowMain}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowMeta}>
          {item.source === 'pantry' ? 'Pantry' : 'Inventory'} ·{' '}
          {item.itemCount} item{item.itemCount !== 1 ? 's' : ''},{' '}
          qty {Math.round(item.totalQuantity)}
        </Text>
      </View>
      <Text style={[styles.rowStatus, { color: iconColor }]}>
        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
      </Text>
    </View>
  );
}

function rowStyles(COLORS: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.TOAST_BROWN + '25',
    },
    rowIcon: { marginRight: 10 },
    rowMain: { flex: 1 },
    rowName: {
      fontSize: 14,
      fontWeight: '500',
      color: COLORS.PRIMARY_DARK,
    },
    rowMeta: {
      fontSize: 12,
      color: COLORS.PRIMARY_DARK,
      opacity: 0.6,
      marginTop: 2,
    },
    rowStatus: { fontSize: 13, fontWeight: '600' },
  });
}

/**
 * BarterEstimatorScreen
 *
 * Analyzes the user's pantry and inventory to suggest what they have in
 * surplus (good to trade) and what they're short on (should seek in trade).
 * All values are estimates for entertainment purposes only.
 */
export default observer(function BarterEstimatorScreen(): JSX.Element {
  const COLORS = useTheme();
  const pantryStore = usePantryStore();
  const inventoryStore = useInventoryStore();

  const summary = useMemo(
    () =>
      computeBarter(
        pantryStore.items,
        pantryStore.categories,
        inventoryStore.items,
        inventoryStore.categories,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pantryStore.items.length, inventoryStore.items.length],
  );

  const hasItems =
    pantryStore.items.length > 0 || inventoryStore.items.length > 0;

  const styles = makeStyles(COLORS);

  return (
    <ScreenBody>
      <SectionHeader>Barter Estimator</SectionHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={COLORS.TOAST_BROWN}
          />
          <Text style={styles.disclaimerText}>
            Trade values are rough estimates for entertainment only. Real barter
            depends on local scarcity, relationships, and circumstances.
          </Text>
        </View>

        {!hasItems ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="cube-outline"
              size={36}
              color={COLORS.TOAST_BROWN}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.emptyText}>
              Add items to your Pantry and Inventory to see your barter
              profile.
            </Text>
          </View>
        ) : (
          <>
            {/* Overall readiness */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Barter Position</Text>
              <View style={styles.badgeRow}>
                <Ionicons
                  name={READINESS_ICON[summary.overallReadiness]}
                  size={20}
                  color={COLORS.ACCENT}
                />
                <Text style={styles.badgeText}>
                  {READINESS_LABEL[summary.overallReadiness]}
                </Text>
              </View>
            </View>

            {/* What to offer */}
            {summary.offerItems.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons
                    name="arrow-up-circle-outline"
                    size={18}
                    color={COLORS.SUCCESS}
                  />
                  <Text style={[styles.cardTitle, { color: COLORS.SUCCESS }]}>
                    You can offer
                  </Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  You have surplus in these categories — good trade chips.
                </Text>
                {summary.offerItems.map((item) => (
                  <CategoryRow key={`${item.source}-${item.name}`} item={item} COLORS={COLORS} />
                ))}
              </View>
            )}

            {/* What to seek */}
            {summary.wantItems.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons
                    name="arrow-down-circle-outline"
                    size={18}
                    color={COLORS.ERROR}
                  />
                  <Text style={[styles.cardTitle, { color: COLORS.ERROR }]}>
                    You should seek
                  </Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  These categories are thin — prioritize acquiring them.
                </Text>
                {summary.wantItems.map((item) => (
                  <CategoryRow key={`${item.source}-${item.name}`} item={item} COLORS={COLORS} />
                ))}
              </View>
            )}

            {/* Full breakdown */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Full Breakdown</Text>
              <Text style={styles.cardSubtitle}>
                All categories ranked by barter value.
              </Text>
              {summary.categories
                .slice()
                .sort((a, b) => b.rawScore - a.rawScore)
                .map((item) => (
                  <CategoryRow
                    key={`${item.source}-${item.name}`}
                    item={item}
                    COLORS={COLORS}
                  />
                ))}
            </View>

            {/* How scores work */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>How scores work</Text>
              <Text style={styles.infoText}>
                Each item category earns a weighted score based on post-crisis
                desirability. Dry goods and canned goods score high; frozen
                items score low since freezers fail quickly without power.
                Categories above 35% of your total score are surplus;
                categories below 15% are scarce.
              </Text>
            </View>
          </>
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
    emptyCard: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      backgroundColor: COLORS.PRIMARY_LIGHT,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.TOAST_BROWN + '40',
    },
    emptyText: {
      fontSize: 14,
      color: COLORS.PRIMARY_DARK,
      opacity: 0.65,
      textAlign: 'center',
      lineHeight: 20,
    },
    card: {
      backgroundColor: COLORS.PRIMARY_LIGHT,
      borderRadius: 12,
      padding: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: COLORS.TOAST_BROWN + '40',
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.PRIMARY_DARK,
    },
    cardSubtitle: {
      fontSize: 13,
      color: COLORS.PRIMARY_DARK,
      opacity: 0.65,
      lineHeight: 18,
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
    infoBox: {
      backgroundColor: COLORS.BACKGROUND,
      borderRadius: 10,
      padding: 14,
      gap: 6,
    },
    infoTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.PRIMARY_DARK,
    },
    infoText: {
      fontSize: 12,
      color: COLORS.PRIMARY_DARK,
      opacity: 0.7,
      lineHeight: 18,
    },
  });
}
