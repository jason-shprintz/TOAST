import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { useEmergencyPlanStore } from '../../stores';
import { FOOTER_HEIGHT } from '../../theme';
import { FormButtonRow, FormTextArea } from '../Shared/Prepper';

/**
 * Structured communication plan template screen.
 *
 * Allows users to record:
 * - Who calls whom
 * - What to do if phones are down
 * - Out-of-area contact
 * - Check-in schedule
 *
 * @returns The communication plan screen.
 */
export default observer(function CommunicationPlanScreen() {
  const navigation = useNavigation<any>();
  const store = useEmergencyPlanStore();
  const COLORS = useTheme();

  const plan = store.communicationPlan;
  const [whoCallsWhom, setWhoCallsWhom] = useState(plan.whoCallsWhom);
  const [ifPhonesDown, setIfPhonesDown] = useState(plan.ifPhonesDown);
  const [outOfAreaContact, setOutOfAreaContact] = useState(
    plan.outOfAreaContact,
  );
  const [checkInSchedule, setCheckInSchedule] = useState(plan.checkInSchedule);
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await store.saveCommunicationPlan({
        whoCallsWhom,
        ifPhonesDown,
        outOfAreaContact,
        checkInSchedule,
      });
      setIsDirty(false);
      Alert.alert('Saved', 'Communication plan saved.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save plan');
    }
  };

  return (
    <ScreenBody>
      <SectionHeader>Communication Plan</SectionHeader>
      <View style={[styles.container, { paddingBottom: FOOTER_HEIGHT }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.intro, { color: COLORS.PRIMARY_DARK }]}>
            Record your family communication plan below. This data is stored
            offline on your device.
          </Text>

          <FormTextArea
            label="Who calls whom?"
            placeholder="e.g. Dad calls Mom, Mom calls kids, eldest child calls neighbors..."
            value={whoCallsWhom}
            onChangeText={markDirty(setWhoCallsWhom)}
            accessibilityLabel="Who calls whom"
          />

          <FormTextArea
            label="If phones are down…"
            placeholder="e.g. Meet at rally point A within 2 hours, leave note on door..."
            value={ifPhonesDown}
            onChangeText={markDirty(setIfPhonesDown)}
            accessibilityLabel="If phones are down"
          />

          <FormTextArea
            label="Out-of-area contact"
            placeholder="e.g. Aunt Jane in Denver: (555) 123-4567 — all family members will check in with her..."
            value={outOfAreaContact}
            onChangeText={markDirty(setOutOfAreaContact)}
            accessibilityLabel="Out of area contact"
          />

          <FormTextArea
            label="Check-in schedule"
            placeholder="e.g. Check in every 6 hours at 6am, 12pm, 6pm, midnight..."
            value={checkInSchedule}
            onChangeText={markDirty(setCheckInSchedule)}
            accessibilityLabel="Check in schedule"
          />

          <FormButtonRow
            onCancel={() => navigation.goBack()}
            onSave={handleSave}
            saveDisabled={!isDirty}
            saveLabel="Save Plan"
            cancelLabel="Back"
          />
        </ScrollView>
      </View>
    </ScreenBody>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
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
  intro: {
    fontSize: 14,
    opacity: 0.75,
    marginBottom: 16,
    lineHeight: 20,
  },
});
