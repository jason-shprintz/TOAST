import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import LogoHeader from '../../components/LogoHeader';
import SectionHeader from '../../components/SectionHeader';
import { COLORS } from '../../theme';

export default function NewNoteScreen() {
  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>New Note</SectionHeader>
      <View style={styles.card}>
        <Text style={styles.value}>Placeholder for creating a new note.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: COLORS.TOAST_BROWN,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
  },
});
