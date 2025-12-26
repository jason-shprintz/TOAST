import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
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
 * configure strobe frequency and SOS tone.
 *
 * @remarks
 * This component reads state from the core store (`useCoreStore`) and updates it via:
 * - `core.setFlashlightMode(next)` for mode changes (`'off' | 'on' | 'sos' | 'strobe'`)
 * - `core.setStrobeFrequency(v)` for strobe frequency changes (in Hz)
 * - `core.setSosWithTone(v)` for enabling/disabling SOS tone
 *
 * The currently selected mode is visually indicated by applying an `activeCard` style to the
 * corresponding option card. When the mode is `'strobe'`, additional controls for frequency are rendered.
 * When the mode is `'sos'`, a toggle for enabling/disabling the SOS tone is rendered.
 * Nightvision mode navigates to a dedicated full-screen NightvisionScreen.
 *
 * @returns A React element that renders the flashlight mode selection and optional mode-specific controls.
 */
const FlashlightScreenImpl = () => {
  const core = useCoreStore();
  const navigation = useNavigation();
  const mode = core.flashlightMode;

  const selectMode = (next: 'off' | 'on' | 'sos' | 'strobe') => {
    core.setFlashlightMode(next);
  };

  const openNightvision = () => {
    // @ts-ignore - navigation types
    navigation.navigate('Nightvision');
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
          onPress={openNightvision}
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
          <SectionHeader isShowHr={false}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionText}>SOS Tone</Text>
              <Switch
                value={core.sosWithTone}
                onValueChange={(v: boolean) => core.setSosWithTone(v)}
                trackColor={{
                  false: COLORS.SECONDARY_ACCENT,
                  true: COLORS.ACCENT,
                }}
                thumbColor={
                  core.sosWithTone ? COLORS.PRIMARY_LIGHT : COLORS.TOAST_BROWN
                }
                style={styles.switchContainer}
              />
            </View>
          </SectionHeader>
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
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  sectionText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.PRIMARY_DARK,
  },
  switchContainer: {
    paddingHorizontal: 20,
  },
});
