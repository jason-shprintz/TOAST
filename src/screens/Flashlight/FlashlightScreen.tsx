import Slider from '@react-native-community/slider';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { StyleSheet, Text, View, Switch } from 'react-native';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useCoreStore } from '../../stores/StoreContext';
import { COLORS } from '../../theme';

/**
 * Flashlight screen UI that lets the user choose a flashlight mode and, when applicable,
 * configure strobe frequency, nightvision brightness, and SOS tone.
 *
 * @remarks
 * This component reads state from the core store (`useCoreStore`) and updates it via:
 * - `core.setFlashlightMode(next)` for mode changes (`'off' | 'on' | 'sos' | 'strobe' | 'nightvision'`)
 * - `core.setStrobeFrequency(v)` for strobe frequency changes (in Hz)
 * - `core.setNightvisionBrightness(v)` for nightvision brightness changes (0-1)
 * - `core.setSosWithTone(v)` for enabling/disabling SOS tone
 *
 * The currently selected mode is visually indicated by applying an `activeCard` style to the
 * corresponding option card. When the mode is `'strobe'`, additional controls for frequency are rendered.
 * When the mode is `'nightvision'`, a full-screen red overlay with brightness controls is rendered.
 * When the mode is `'sos'`, a toggle for enabling/disabling the SOS tone is rendered.
 *
 * @returns A React element that renders the flashlight mode selection and optional mode-specific controls.
 */
const FlashlightScreenImpl = () => {
  const core = useCoreStore();
  const mode = core.flashlightMode;

  const selectMode = (next: 'off' | 'on' | 'sos' | 'strobe' | 'nightvision') => {
    core.setFlashlightMode(next);
  };

  return (
    <ScreenBody>
      <SectionHeader>Flashlight</SectionHeader>

      <Grid>
        <CardTopic
          title="Flashlight On"
          icon="flashlight-outline"
          onPress={() => selectMode('on')}
          containerStyle={mode === 'on' ? styles.activeCard : undefined}
        />
        <CardTopic
          title="SOS"
          icon="alert-outline"
          onPress={() => selectMode('sos')}
          containerStyle={mode === 'sos' ? styles.activeCard : undefined}
        />
        <CardTopic
          title="Strobe"
          icon="flash-outline"
          onPress={() => selectMode('strobe')}
          containerStyle={mode === 'strobe' ? styles.activeCard : undefined}
        />
        <CardTopic
          title="Nightvision"
          icon="moon-outline"
          onPress={() => selectMode('nightvision')}
          containerStyle={mode === 'nightvision' ? styles.activeCard : undefined}
        />
      </Grid>

      {mode === 'strobe' && (
        <View style={styles.controlsContainer}>
          <SectionHeader>Strobe Frequency</SectionHeader>
          <Text style={styles.label}>{core.strobeFrequencyHz} Hz</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={15}
            step={1}
            value={core.strobeFrequencyHz}
            onValueChange={(v: number) => core.setStrobeFrequency(v)}
            minimumTrackTintColor={COLORS.ACCENT}
            maximumTrackTintColor={COLORS.SECONDARY_ACCENT}
          />
        </View>
      )}

      {mode === 'sos' && (
        <View style={styles.controlsContainer}>
          <SectionHeader>SOS Options</SectionHeader>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>SOS Tone</Text>
            <Switch
              value={core.sosWithTone}
              onValueChange={(v: boolean) => core.setSosWithTone(v)}
              trackColor={{ false: COLORS.SECONDARY_ACCENT, true: COLORS.ACCENT }}
              thumbColor={core.sosWithTone ? COLORS.PRIMARY_LIGHT : COLORS.TOAST_BROWN}
            />
          </View>
        </View>
      )}

      {mode === 'nightvision' && (
        <View style={styles.controlsContainer}>
          <SectionHeader>Nightvision Brightness</SectionHeader>
          <Text style={styles.label}>
            {Math.round(core.nightvisionBrightness * 100)}%
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            value={core.nightvisionBrightness}
            onValueChange={(v: number) => core.setNightvisionBrightness(v)}
            minimumTrackTintColor={COLORS.ACCENT}
            maximumTrackTintColor={COLORS.SECONDARY_ACCENT}
          />
        </View>
      )}

      {/* Full-screen nightvision red overlay */}
      {mode === 'nightvision' && (
        <View
          style={[
            styles.nightvisionOverlay,
            { opacity: core.nightvisionBrightness },
          ]}
        />
      )}
    </ScreenBody>
  );
};

export default observer(FlashlightScreenImpl);

const styles = StyleSheet.create({
  activeCard: {
    borderColor: COLORS.ACCENT,
    borderWidth: 3,
  },
  controlsContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  label: {
    color: COLORS.TOAST_BROWN,
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  nightvisionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8B0000', // Night-friendly dark red
    pointerEvents: 'none', // Allow touches to pass through
  },
});
