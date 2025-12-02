import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SectionHeader from '../../components/SectionHeader';
import PlaceholderCard from '../../components/PlaceholderCard';
import { COLORS } from '../../theme';

type Mode = 'off' | 'on' | 'sos' | 'strobe';

export default function FlashlightScreen() {
  const [mode, setMode] = useState<Mode>('off');

  const selectMode = (next: Mode) => {
    setMode(prev => (prev === next ? 'off' : next));
  };

  return (
    <View style={styles.container}>
      <SectionHeader>Flashlight</SectionHeader>

      <View style={styles.grid}>
        <PlaceholderCard
          title="Flashlight On"
          icon="flashlight-outline"
          onPress={() => selectMode('on')}
          containerStyle={mode === 'on' ? styles.activeCard : undefined}
        />
        <PlaceholderCard
          title="SOS"
          icon="alert-outline"
          onPress={() => selectMode('sos')}
          containerStyle={mode === 'sos' ? styles.activeCard : undefined}
        />
        <PlaceholderCard
          title="Strobe"
          icon="flash-outline"
          onPress={() => selectMode('strobe')}
          containerStyle={mode === 'strobe' ? styles.activeCard : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  activeCard: {
    borderColor: COLORS.ACCENT,
    borderWidth: 3,
  },
});
