import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import SectionHeader from '../../components/SectionHeader';
import PlaceholderCard from '../../components/PlaceholderCard';
import { COLORS } from '../../theme';
import { observer } from 'mobx-react-lite';
import { useCoreStore } from '../../stores/StoreContext';
import Slider from '@react-native-community/slider';
const FlashlightScreenImpl = () => {
  const core = useCoreStore();
  const mode = core.flashlightMode;

  const selectMode = (next: 'off' | 'on' | 'sos' | 'strobe') => {
    core.setFlashlightMode(next);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/toast-logo.png')}
        style={styles.logo}
      />
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

      {mode === 'strobe' && (
        <View style={styles.strobeControls}>
          <SectionHeader>Strobe Frequency</SectionHeader>
          <Text style={styles.strobeLabel}>{core.strobeFrequencyHz} Hz</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={30}
            step={1}
            value={core.strobeFrequencyHz}
            onValueChange={(v: number) => core.setStrobeFrequency(v)}
            minimumTrackTintColor={COLORS.ACCENT}
            maximumTrackTintColor={COLORS.SECONDARY_ACCENT}
          />
        </View>
      )}
    </View>
  );
};

export default observer(FlashlightScreenImpl);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: 60,
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

  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 10,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    borderRadius: 90,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
  },

  strobeControls: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  strobeLabel: {
    color: COLORS.TOAST_BROWN,
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
