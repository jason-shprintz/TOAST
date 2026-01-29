import { useRoute, useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
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

/**
 * Screen for adding a new inventory item.
 *
 * Allows users to:
 * - Enter item name (required)
 * - Set quantity (required, default 1)
 * - Specify unit (optional, e.g., "pieces", "lbs", "gallons")
 * - Add notes (optional)
 *
 * @returns {React.JSX.Element} The rendered new inventory item screen component.
 */
export default observer(function NewInventoryItemScreen(): React.JSX.Element {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const inventory = useInventoryStore();

  const { category } = route.params || {};
  const [name, setName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

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
      await inventory.createItem(
        trimmedName,
        category,
        quantityNum,
        unit.trim() || undefined,
        notes.trim() || undefined,
      );
      Alert.alert('Success', 'Item added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add item');
    }
  };

  return (
    <ScreenBody>
      <SectionHeader>Add Item to {category}</SectionHeader>
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
              autoFocus
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
              style={[styles.saveButton, !name.trim() && styles.disabledButton]}
              onPress={handleSave}
              disabled={!name.trim()}
              accessibilityLabel="Save item"
              accessibilityRole="button"
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
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
});
