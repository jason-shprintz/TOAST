import Slider from '@react-native-community/slider';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CardTopic from '../../components/CardTopic';
import Grid from '../../components/Grid';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useCoreStore } from '../../stores/StoreContext';
import { COLORS } from '../../theme';

/**
 * Flashlight screen UI that lets the user choose a flashlight mode and, when applicable,
 * configure strobe frequency.
 *
 * @remarks
 * This component reads state from the core store (`useCoreStore`) and updates it via:
 * - `core.setFlashlightMode(next)` for mode changes (`'off' | 'on' | 'sos' | 'strobe'`)
 * - `core.setStrobeFrequency(v)` for strobe frequency changes (in Hz)
 *
 * The currently selected mode is visually indicated by applying an `activeCard` style to the
 * corresponding option card. When the mode is `'strobe'`, additional controls are rendered,
 * including a slider constrained to integer values from 1–15 Hz.
 *
 * @returns A React element that renders the flashlight mode selection and optional strobe controls.
 */
const FlashlightScreenImpl = () => {
  const core = useCoreStore();
  const mode = core.flashlightMode;

  const selectMode = (next: 'off' | 'on' | 'sos' | 'strobe') => {
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
      </Grid>

      {mode === 'strobe' && (
        <View style={styles.strobeControls}>
          <SectionHeader>Strobe Frequency</SectionHeader>
          <Text style={styles.strobeLabel}>{core.strobeFrequencyHz} Hz</Text>
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
    </ScreenBody>
  );
};

export default observer(FlashlightScreenImpl);

const styles = StyleSheet.create({
  activeCard: {
    borderColor: COLORS.ACCENT,
    borderWidth: 3,
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
