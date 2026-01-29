import { useRoute, useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HorizontalRule } from '../../components/HorizontalRule';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useInventoryStore } from '../../stores';
import { COLORS, FOOTER_HEIGHT } from '../../theme';

/**
 * Displays all inventory items for a specific category.
 *
 * This screen retrieves the category name from the navigation route parameters
 * and displays all items belonging to that category in a list layout.
 * If no items are found for the category, a helper message is shown.
 *
 * @returns {JSX.Element} The rendered inventory category screen component.
 */
export default observer(function InventoryCategoryScreen(): React.JSX.Element {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const inventory = useInventoryStore();

  const { category } = route.params || {};
  const isValidCategory = category && inventory.categories.includes(category);
  const items = useMemo(
    () => (isValidCategory ? (inventory.itemsByCategory[category] ?? []) : []),
    [isValidCategory, category, inventory.itemsByCategory],
  );

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [items],
  );

  const handleAddItem = () => {
    navigation.navigate('NewInventoryItem', { category });
  };

  const handleItemPress = (item: any) => {
    navigation.navigate('EditInventoryItem', { item });
  };

  return (
    <ScreenBody>
      <SectionHeader>{category}</SectionHeader>
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddItem}
          accessibilityLabel="Add Item"
          accessibilityRole="button"
        >
          <Ionicons name="add-outline" size={24} color={COLORS.PRIMARY_LIGHT} />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>
      <HorizontalRule />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {sortedItems.length === 0 && (
            <Text style={styles.helperText}>
              No items in this category yet.
            </Text>
          )}
          {sortedItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => handleItemPress(item)}
              accessibilityLabel={`View ${item.name}`}
              accessibilityRole="button"
            >
              <View style={styles.itemHeader}>
                <Ionicons
                  name="cube-outline"
                  size={24}
                  color={COLORS.PRIMARY_DARK}
                />
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemQuantity}>
                  Quantity: {item.quantity}
                  {item.unit ? ` ${item.unit}` : ''}
                </Text>
                {item.notes && (
                  <Text style={styles.itemNotes} numberOfLines={2}>
                    {item.notes}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScreenBody>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    paddingBottom: FOOTER_HEIGHT,
  },
  actionBar: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY_DARK,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  addButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    paddingHorizontal: 6,
    paddingBottom: 24,
  },
  helperText: {
    fontSize: 16,
    opacity: 0.8,
    marginHorizontal: 6,
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 24,
  },
  itemCard: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    flex: 1,
  },
  itemDetails: {
    gap: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    fontWeight: '500',
  },
  itemNotes: {
    fontSize: 13,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
  },
});
