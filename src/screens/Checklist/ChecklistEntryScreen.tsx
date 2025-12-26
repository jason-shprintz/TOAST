import { useRoute, useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { HorizontalRule } from '../../components/HorizontalRule';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useCoreStore } from '../../stores';
import { COLORS, FOOTER_HEIGHT } from '../../theme';

/**
 * Displays a single checklist with its items.
 *
 * This screen retrieves a checklist from the navigation route parameters and displays
 * it with all its items. Users can check/uncheck items, add new items, and delete items.
 *
 * @returns {React.JSX.Element} The rendered checklist entry screen component.
 */
export default observer(function ChecklistEntryScreen(): React.JSX.Element {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const core = useCoreStore();
  const [newItemText, setNewItemText] = useState<string>('');
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);

  const { checklist } = route.params || {};

  if (!checklist) {
    return (
      <ScreenBody>
        <SectionHeader>Checklist Not Found</SectionHeader>
        <View style={styles.container}>
          <Text style={styles.errorText}>
            The requested checklist could not be found.
          </Text>
        </View>
      </ScreenBody>
    );
  }

  const checklistName = checklist.name || '(Untitled)';
  const items = core.getChecklistItems(checklist.id);

  const handleAddItem = async () => {
    if (newItemText.trim()) {
      await core.addChecklistItem(checklist.id, newItemText.trim());
      setNewItemText('');
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await core.deleteChecklistItem(itemId);
          },
        },
      ],
    );
  };

  const handleDeleteChecklist = () => {
    Alert.alert(
      'Delete Checklist',
      'Are you sure you want to delete this checklist and all its items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await core.deleteChecklist(checklist.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <ScreenBody>
      <SectionHeader>{checklistName}</SectionHeader>
      <View style={styles.checklistHeader}>
        <TouchableOpacity
          accessibilityLabel="Add item"
          accessibilityRole="button"
          style={styles.headerButton}
          onPress={() => setIsAddingItem(true)}
        >
          <Icon
            name="add-circle-outline"
            size={30}
            color={COLORS.PRIMARY_DARK}
          />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Delete checklist"
          accessibilityRole="button"
          style={styles.headerButton}
          onPress={handleDeleteChecklist}
        >
          <Icon name="trash-outline" size={30} color={COLORS.PRIMARY_DARK} />
        </TouchableOpacity>
      </View>
      <HorizontalRule />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {items.length === 0 && !isAddingItem && (
            <View style={styles.emptyState}>
              <Icon
                name="clipboard-outline"
                size={48}
                color={COLORS.PRIMARY_DARK}
              />
              <Text style={styles.emptyText}>No items yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add items
              </Text>
            </View>
          )}

          {items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => core.toggleChecklistItem(item.id)}
                accessibilityLabel={item.checked ? 'Uncheck item' : 'Check item'}
                accessibilityRole="checkbox"
              >
                <Icon
                  name={
                    item.checked ? 'checkbox-outline' : 'square-outline'
                  }
                  size={28}
                  color={COLORS.PRIMARY_DARK}
                />
              </TouchableOpacity>
              <Text
                style={[
                  styles.itemText,
                  item.checked && styles.itemTextChecked,
                ]}
              >
                {item.text}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteItem(item.id)}
                accessibilityLabel="Delete item"
                accessibilityRole="button"
              >
                <Icon
                  name="close-circle-outline"
                  size={24}
                  color={COLORS.PRIMARY_DARK}
                />
              </TouchableOpacity>
            </View>
          ))}

          {isAddingItem && (
            <View style={styles.addItemRow}>
              <TextInput
                style={styles.input}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="Enter item text..."
                placeholderTextColor={COLORS.PRIMARY_DARK + '80'}
                autoFocus
                onSubmitEditing={handleAddItem}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddItem}
                accessibilityLabel="Save item"
                accessibilityRole="button"
              >
                <Icon
                  name="checkmark-circle-outline"
                  size={30}
                  color={COLORS.PRIMARY_DARK}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setNewItemText('');
                  setIsAddingItem(false);
                }}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
              >
                <Icon
                  name="close-circle-outline"
                  size={30}
                  color={COLORS.PRIMARY_DARK}
                />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenBody>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderWidth: 2,
    borderRadius: 12,
    borderColor: COLORS.SECONDARY_ACCENT,
    alignSelf: 'stretch',
    marginTop: 12,
    marginBottom: FOOTER_HEIGHT + 12,
  },
  checklistHeader: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    paddingVertical: 6,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
    textAlign: 'center',
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK + '80',
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SECONDARY_ACCENT + '40',
  },
  checkbox: {
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.PRIMARY_DARK + '60',
  },
  deleteButton: {
    marginLeft: 8,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SECONDARY_ACCENT + '40',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY_ACCENT,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  addButton: {
    marginLeft: 8,
  },
  cancelButton: {
    marginLeft: 4,
  },
});
