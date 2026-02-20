import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useEmergencyPlanStore } from '../../stores';
import { FormButtonRow, FormInput, FormTextArea } from '../Shared/Prepper';
import { formStyles as styles } from '../Shared/Prepper/formStyles';

/**
 * Screen for adding a new emergency contact.
 *
 * @returns The new emergency contact form screen.
 */
export default observer(function NewEmergencyContactScreen() {
  const navigation = useNavigation<any>();
  const store = useEmergencyPlanStore();

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!relationship.trim()) {
      Alert.alert('Error', 'Relationship is required');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    try {
      await store.createContact(name, relationship, phone, notes || undefined);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save contact');
    }
  };

  return (
    <ScreenBody>
      <SectionHeader>New Contact</SectionHeader>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <FormInput
            label="Name *"
            placeholder="Enter full name..."
            value={name}
            onChangeText={setName}
            autoFocus
            accessibilityLabel="Contact name"
          />
          <FormInput
            label="Relationship *"
            placeholder="e.g. Spouse, Parent, Neighbor..."
            value={relationship}
            onChangeText={setRelationship}
            accessibilityLabel="Relationship"
          />
          <FormInput
            label="Phone Number *"
            placeholder="Enter phone number..."
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            accessibilityLabel="Phone number"
          />
          <FormTextArea
            label="Notes (optional)"
            placeholder="Additional details..."
            value={notes}
            onChangeText={setNotes}
            accessibilityLabel="Notes"
          />
          <FormButtonRow
            onCancel={() => navigation.goBack()}
            onSave={handleSave}
            saveDisabled={!name.trim() || !relationship.trim() || !phone.trim()}
          />
        </ScrollView>
      </View>
    </ScreenBody>
  );
});
