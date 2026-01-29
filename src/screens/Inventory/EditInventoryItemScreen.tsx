import { useRoute, useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useInventoryStore } from '../../stores';
import { COLORS, FOOTER_HEIGHT } from '../../theme';
import type { InventoryItem } from '../../stores/InventoryStore';

/**
 * Screen for editing an existing inventory item.
 *
 * Allows users to:
 * - Edit item name
 * - Update quantity
 * - Change unit
 * - Modify notes
 * - Delete the item
 *
 * @returns {React.JSX.Element} The rendered edit inventory item screen component.
 */
export default observer(function EditInventoryItemScreen(): React.JSX.Element {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const inventory = useInventoryStore();

  const { item } = route.params || {};
  const [name, setName] = useState<string>(item?.name || '');
  const [quantity, setQuantity] = useState<string>(
    item?.quantity?.toString() || '1',
  );
  const [unit, setUnit] = useState<string>(item?.unit || '');
  const [notes, setNotes] = useState<string>(item?.notes || '');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity.toString());
      setUnit(item.unit || '');
      setNotes(item.notes || '');
    }
  }, [item]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Item name is required');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum < 0) {
      Alert.alert('Error', 'Please enter a valid quantity (0 or greater)');
      return;
    }

    try {
      await inventory.updateItem(item.id, {
        name: trimmedName,
        quantity: quantityNum,
        unit: unit.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Success', 'Item updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update item');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await inventory.deleteItem(item.id);
              Alert.alert('Success', 'Item deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete item');
            }
          },
        },
      ],
    );
  };

  if (!item) {
    return (
      <ScreenBody>
        <SectionHeader>Edit Item</SectionHeader>
        <View style={styles.container}>
          <Text style={styles.errorText}>Item not found</Text>
        </View>
      </ScreenBody>
    );
  }

  return (
    <ScreenBody>
      <SectionHeader>Edit Item</SectionHeader>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formGroup}>
            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter item name..."
              placeholderTextColor={COLORS.PRIMARY_DARK}
              value={name}
              onChangeText={setName}
              accessibilityLabel="Item name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter quantity..."
              placeholderTextColor={COLORS.PRIMARY_DARK}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              accessibilityLabel="Quantity"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Unit (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., pieces, lbs, gallons..."
              placeholderTextColor={COLORS.PRIMARY_DARK}
              value={unit}
              onChangeText={setUnit}
              accessibilityLabel="Unit"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter notes..."
              placeholderTextColor={COLORS.PRIMARY_DARK}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel="Notes"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !name.trim() && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={!name.trim()}
              accessibilityLabel="Save changes"
              accessibilityRole="button"
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            accessibilityLabel="Delete item"
            accessibilityRole="button"
          >
            <Text style={styles.deleteButtonText}>Delete Item</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenBody>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingBottom: FOOTER_HEIGHT,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.ERROR || '#d32f2f',
    textAlign: 'center',
    marginTop: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.PRIMARY_DARK,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY_DARK,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_DARK,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR || '#d32f2f',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  deleteButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
});
