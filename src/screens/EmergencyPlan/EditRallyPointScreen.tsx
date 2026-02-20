import { useNavigation, useRoute } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useEmergencyPlanStore } from '../../stores';
import {
  DeleteButton,
  FormButtonRow,
  FormInput,
  FormTextArea,
} from '../Shared/Prepper';
import { formStyles as styles } from '../Shared/Prepper/formStyles';

/**
 * Screen for editing an existing rally point.
 *
 * @returns The edit rally point form screen.
 */
export default observer(function EditRallyPointScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const store = useEmergencyPlanStore();

  const { rallyPoint } = route.params || {};
  const [name, setName] = useState(rallyPoint?.name || '');
  const [description, setDescription] = useState(rallyPoint?.description || '');
  const [coordinates, setCoordinates] = useState(rallyPoint?.coordinates || '');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }

    try {
      await store.updateRallyPoint(rallyPoint.id, {
        name: name.trim(),
        description: description.trim(),
        coordinates: coordinates.trim() || undefined,
      });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update rally point');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Rally Point',
      `Are you sure you want to delete "${rallyPoint.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await store.deleteRallyPoint(rallyPoint.id);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to delete rally point',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenBody>
      <SectionHeader>Edit Rally Point</SectionHeader>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <FormInput
            label="Name *"
            placeholder='e.g. "Primary: Grandma&apos;s house"'
            value={name}
            onChangeText={setName}
            accessibilityLabel="Rally point name"
          />
          <FormTextArea
            label="Description *"
            placeholder="Address or directions..."
            value={description}
            onChangeText={setDescription}
            accessibilityLabel="Description"
          />
          <FormInput
            label="Coordinates (optional)"
            placeholder='e.g. "40.7128, -74.0060"'
            value={coordinates}
            onChangeText={setCoordinates}
            accessibilityLabel="Coordinates"
          />
          <FormButtonRow
            onCancel={() => navigation.goBack()}
            onSave={handleSave}
            saveDisabled={!name.trim() || !description.trim()}
          />
          <DeleteButton onPress={handleDelete} label="Delete Rally Point" />
        </ScrollView>
      </View>
    </ScreenBody>
  );
});
