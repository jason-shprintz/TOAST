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
import { useTheme } from '../../hooks/useTheme';
import { useInventoryStore } from '../../stores';
import { FOOTER_HEIGHT } from '../../theme';

/**
 * Screen for editing an existing inventory item.
 *
 * Allows users to:
 * - Edit item name
 * - Update quantity
 * - Change unit
 * - Modify notes
 * - Set expiration date (optional, month and year)
 * - Delete the item
 *
 * @returns {React.JSX.Element} The rendered edit inventory item screen component.
 */
export default observer(function EditInventoryItemScreen(): React.JSX.Element {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const inventory = useInventoryStore();
  const COLORS = useTheme();

  const { item } = route.params || {};
  const [name, setName] = useState<string>(item?.name || '');
  const [quantity, setQuantity] = useState<string>(
    item?.quantity?.toString() || '1',
  );
  const [unit, setUnit] = useState<string>(item?.unit || '');
  const [notes, setNotes] = useState<string>(item?.notes || '');
  const [expirationMonth, setExpirationMonth] = useState<number | undefined>(item?.expirationMonth);
  const [expirationYear, setExpirationYear] = useState<number | undefined>(item?.expirationYear);

  const months = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 2099 - currentYear + 1 },
    (_, i) => currentYear + i,
  );

  const showMonthPicker = () => {
    const options = ['None', ...months.map((m) => m.label)];
    Alert.alert('Select Month', '', [
      ...options.map((option, index) => ({
        text: option,
        onPress: () => {
          if (index === 0) {
            setExpirationMonth(undefined);
          } else {
            setExpirationMonth(months[index - 1].value);
          }
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const showYearPicker = () => {
    const options = ['None', ...years.map((y) => y.toString())];
    Alert.alert('Select Year', '', [
      ...options.map((option, index) => ({
        text: option,
        onPress: () => {
          if (index === 0) {
            setExpirationYear(undefined);
          } else {
            setExpirationYear(years[index - 1]);
          }
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getMonthLabel = () => {
    if (!expirationMonth) return 'Select Month';
    return months.find((m) => m.value === expirationMonth)?.label || 'Select Month';
  };

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
        expirationMonth,
        expirationYear,
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
          <Text style={[styles.errorText, { color: COLORS.ERROR || '#d32f2f' }]}>Item not found</Text>
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
            <Text style={[styles.label, { color: COLORS.PRIMARY_DARK }]}>
              Item Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: COLORS.PRIMARY_LIGHT,
                  borderColor: COLORS.SECONDARY_ACCENT,
                  color: COLORS.PRIMARY_DARK,
                },
              ]}
              placeholder="Enter item name..."
              placeholderTextColor={COLORS.PRIMARY_DARK}
              value={name}
              onChangeText={setName}
              accessibilityLabel="Item name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: COLORS.PRIMARY_DARK }]}>
              Quantity & Unit *
            </Text>
            <View style={styles.expirationRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: COLORS.PRIMARY_LIGHT,
                    borderColor: COLORS.SECONDARY_ACCENT,
                    color: COLORS.PRIMARY_DARK,
                  },
                ]}
                placeholder="Quantity..."
                placeholderTextColor={COLORS.PRIMARY_DARK}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                accessibilityLabel="Quantity"
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: COLORS.PRIMARY_LIGHT,
                    borderColor: COLORS.SECONDARY_ACCENT,
                    color: COLORS.PRIMARY_DARK,
                  },
                ]}
                placeholder="Unit (optional)..."
                placeholderTextColor={COLORS.PRIMARY_DARK}
                value={unit}
                onChangeText={setUnit}
                accessibilityLabel="Unit"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: COLORS.PRIMARY_DARK }]}>
              Expiration Date (optional)
            </Text>
            <View style={styles.expirationRow}>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  {
                    backgroundColor: COLORS.PRIMARY_LIGHT,
                    borderColor: COLORS.SECONDARY_ACCENT,
                  },
                ]}
                onPress={showMonthPicker}
              >
                <Text style={[styles.pickerText, { color: COLORS.PRIMARY_DARK }]}>
                  {getMonthLabel()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  {
                    backgroundColor: COLORS.PRIMARY_LIGHT,
                    borderColor: COLORS.SECONDARY_ACCENT,
                  },
                ]}
                onPress={showYearPicker}
              >
                <Text style={[styles.pickerText, { color: COLORS.PRIMARY_DARK }]}>
                  {expirationYear || 'Select Year'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: COLORS.PRIMARY_DARK }]}>
              Notes (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: COLORS.PRIMARY_LIGHT,
                  borderColor: COLORS.SECONDARY_ACCENT,
                  color: COLORS.PRIMARY_DARK,
                },
              ]}
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
              style={[
                styles.cancelButton,
                {
                  backgroundColor: COLORS.PRIMARY_LIGHT,
                  borderColor: COLORS.PRIMARY_DARK,
                },
              ]}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={[styles.cancelButtonText, { color: COLORS.PRIMARY_DARK }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: COLORS.PRIMARY_DARK },
                !name.trim() && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={!name.trim()}
              accessibilityLabel="Save changes"
              accessibilityRole="button"
            >
              <Text style={[styles.saveButtonText, { color: COLORS.PRIMARY_LIGHT }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              { backgroundColor: COLORS.ERROR || '#d32f2f' },
            ]}
            onPress={handleDelete}
            accessibilityLabel="Delete item"
            accessibilityRole="button"
          >
            <Text style={[styles.deleteButtonText, { color: COLORS.PRIMARY_LIGHT }]}>
              Delete Item
            </Text>
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
    textAlign: 'center',
    marginTop: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 10,
  },
  expirationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
