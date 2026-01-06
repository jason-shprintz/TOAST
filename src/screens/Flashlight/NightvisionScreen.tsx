import Slider from '@react-native-community/slider';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/ScaledText';
import { useCoreStore } from '../../stores/StoreContext';
import { COLORS } from '../../theme';

/**
 * Full-screen Nightvision mode with adjustable red light brightness.
 *
 * @remarks
 * This screen displays a full-screen black background with a red overlay
 * whose opacity can be controlled by the user via a slider. The slider
 * is overlaid on top of the red light for easy access.
 *
 * Users can navigate back using the standard swipe-back gesture to turn off
 * Nightvision mode.
 *
 * @returns A React element that renders the full-screen nightvision mode.
 */
const NightvisionScreenImpl = () => {
  const core = useCoreStore();

  return (
    <View style={styles.container}>
      {/* Black background */}
      <View style={styles.blackBackground} />

      {/* Red overlay with adjustable opacity */}
      <View
        style={[styles.redOverlay, { opacity: core.nightvisionBrightness }]}
      />

      {/* Controls overlaid on top */}
      <View style={styles.controlsOverlay}>
        <View style={styles.controlsContainer}>
          <Text style={styles.label}>
            Brightness: {core.nightvisionBrightnessPercent}%
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
      </View>
    </View>
  );
};

export default observer(NightvisionScreenImpl);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  blackBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  redOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ff0000', // Night-friendly dark red
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none', // Allow touches to pass through except for children
  },
  controlsContainer: {
    width: '80%',
    padding: 20,
    alignItems: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
