import Slider from '@react-native-community/slider';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import PlaceholderCard from '../../components/PlaceholderCard';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import { useCoreStore } from '../../stores/StoreContext';
import { COLORS } from '../../theme';

const FlashlightScreenImpl = () => {
  const core = useCoreStore();
  const mode = core.flashlightMode;

  const selectMode = (next: 'off' | 'on' | 'sos' | 'strobe') => {
    core.setFlashlightMode(next);
  };

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Flashlight</SectionHeader>

      <Grid>
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
      </Grid>

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
    </ScreenContainer>
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
