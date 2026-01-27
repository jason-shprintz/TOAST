import { observer } from 'mobx-react-lite';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import AudioRecorderPlayer, {
  type RecordBackType,
} from 'react-native-audio-recorder-player';
import Icon from 'react-native-vector-icons/Ionicons';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { useCoreStore } from '../../stores/StoreContext';
import { FOOTER_HEIGHT, SCROLL_PADDING } from '../../theme';

/**
 * DecibelMeterScreen component
 *
 * Displays a visual decibel meter that measures ambient sound levels.
 * When active, the meter is also displayed in the footer.
 *
 * Features:
 * - Real-time audio level monitoring
 * - Visual meter display with color gradients
 * - Start/Stop controls
 * - Footer integration when active
 * - Light and dark mode support
 *
 * @returns A React element rendering the decibel meter screen.
 */
const DecibelMeterScreenImpl = () => {
  const core = useCoreStore();
  const COLORS = useTheme();
  const [isActive, setIsActive] = useState(core.decibelMeterActive);
  const [decibelLevel, setDecibelLevel] = useState(0);
  const animatedLevel = useRef(new Animated.Value(0)).current;
  const isRecordingRef = useRef(false);

  /**
   * Request audio recording permission for Android.
   * iOS permissions are handled via Info.plist.
   */
  const requestAudioPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return true; // iOS permissions handled by Info.plist
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message:
            'This app needs access to your microphone to measure sound levels.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  /**
   * Starts audio recording with real-time metering to get actual dB levels.
   * Uses react-native-audio-recorder-player which exposes currentMetering.
   */
  const startMonitoring = async () => {
    try {
      isRecordingRef.current = true;

      // Start recording with metering enabled
      await AudioRecorderPlayer.startRecorder(undefined, undefined, true);

      // Set up the recorder state listener to get real-time metering data
      AudioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
        if (!isRecordingRef.current) return;

        // currentMetering provides actual dB levels from the microphone
        // On iOS: ranges from -160 dB (silence) to 0 dB (max)
        // On Android: provides amplitude value that we normalize
        const metering = e.currentMetering || -160;

        // Convert metering to a 0-100 scale for display
        // iOS metering ranges from -160 to 0, normalize to 0-100
        // Add 160 to shift range, then map to 0-100
        let normalizedLevel;
        if (Platform.OS === 'ios') {
          // iOS: -160 to 0 dB range
          normalizedLevel = Math.max(0, Math.min(100, (metering + 160) / 1.6));
        } else {
          // Android: amplitude value, normalize to 0-100
          // Android provides values typically 0-32767
          normalizedLevel = Math.max(0, Math.min(100, metering / 327.67));
        }

        setDecibelLevel(normalizedLevel);
        core.setCurrentDecibelLevel(normalizedLevel);

        // Animate the level change
        Animated.spring(animatedLevel, {
          toValue: normalizedLevel,
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start();
      });
    } catch (error) {
      console.error('Error starting monitoring:', error);
      throw error;
    }
  };

  /**
   * Stops audio level monitoring by stopping the recorder.
   */
  const stopMonitoring = async () => {
    try {
      isRecordingRef.current = false;
      await AudioRecorderPlayer.stopRecorder();
      AudioRecorderPlayer.removeRecordBackListener();
    } catch (error) {
      console.error('Error stopping recorder:', error);
    }
    setDecibelLevel(0);
    core.setCurrentDecibelLevel(0);
    animatedLevel.setValue(0);
  };

  /**
   * Handles starting the decibel meter with real microphone input.
   */
  const handleStart = async () => {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is required to measure sound levels.',
      );
      return;
    }

    try {
      setIsActive(true);
      core.setDecibelMeterActive(true);
      await startMonitoring();
    } catch (error) {
      console.error('Error starting recorder:', error);
      Alert.alert('Error', 'Failed to start audio monitoring.');
      setIsActive(false);
      core.setDecibelMeterActive(false);
    }
  };

  /**
   * Handles stopping the decibel meter.
   */
  const handleStop = async () => {
    setIsActive(false);
    core.setDecibelMeterActive(false);
    await stopMonitoring();
  };

  /**
   * Cleanup on unmount - stop the recorder but keep the meter state active
   * so it persists when navigating away from the screen.
   */
  useEffect(() => {
    return () => {
      // Stop the recorder when unmounting but don't change the active state
      if (isRecordingRef.current) {
        AudioRecorderPlayer.stopRecorder().catch(console.error);
        AudioRecorderPlayer.removeRecordBackListener();
        isRecordingRef.current = false;
      }
    };
  }, []);

  /**
   * Sync local state with core store and restart monitoring if meter is active.
   * This ensures the monitoring resumes when returning to the screen.
   */
  useEffect(() => {
    setIsActive(core.decibelMeterActive);

    // If the meter is active (from core store) but not recording locally, start it
    if (core.decibelMeterActive && !isRecordingRef.current) {
      startMonitoring().catch((error) => {
        console.error('Error restarting recorder:', error);
        core.setDecibelMeterActive(false);
        setIsActive(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [core.decibelMeterActive]);

  /**
   * Get color based on decibel level.
   */
  const getLevelColor = (level: number): string => {
    if (level < 40) return COLORS.SUCCESS; // Quiet - green
    if (level < 70) return COLORS.ACCENT; // Moderate - orange
    return COLORS.ERROR; // Loud - red
  };

  const levelColor = getLevelColor(decibelLevel);

  return (
    <ScreenBody>
      <SectionHeader>Decibel Meter</SectionHeader>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Main Meter Display */}
          <View
            style={[
              styles.meterContainer,
              {
                backgroundColor: COLORS.PRIMARY_LIGHT,
                borderColor: COLORS.SECONDARY_ACCENT,
              },
            ]}
          >
            {/* Decibel Level Display */}
            <View style={styles.levelDisplay}>
              <Text
                style={[
                  styles.levelNumber,
                  { color: isActive ? levelColor : COLORS.PRIMARY_DARK },
                ]}
              >
                {Math.round(decibelLevel)}
              </Text>
              <Text
                style={[
                  styles.levelUnit,
                  { color: isActive ? levelColor : COLORS.PRIMARY_DARK },
                ]}
              >
                dB
              </Text>
            </View>

            {/* Visual Bar Meter */}
            <View style={styles.barMeterContainer}>
              {[...Array(20)].map((_, i) => {
                const barLevel = (i + 1) * 5; // Each bar represents 5 dB
                const isBarActive = decibelLevel >= barLevel;
                const barColor = getLevelColor(barLevel);
                const barHeight = ((i + 1) / 20) * 120; // Height scales from 6px to 120px

                return (
                  <View
                    key={i}
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: isBarActive
                          ? barColor
                          : COLORS.BACKGROUND,
                        borderColor: COLORS.SECONDARY_ACCENT,
                        opacity: isBarActive ? 1 : 0.3,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsContainer}>
            {!isActive ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: COLORS.SUCCESS,
                    borderColor: COLORS.SECONDARY_ACCENT,
                  },
                ]}
                onPress={handleStart}
                accessibilityLabel="Start Decibel Meter"
                accessibilityRole="button"
              >
                <Icon name="play" size={24} color={COLORS.PRIMARY_LIGHT} />
                <Text
                  style={[styles.buttonText, { color: COLORS.PRIMARY_LIGHT }]}
                >
                  Start Monitoring
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: COLORS.ERROR,
                    borderColor: COLORS.SECONDARY_ACCENT,
                  },
                ]}
                onPress={handleStop}
                accessibilityLabel="Stop Decibel Meter"
                accessibilityRole="button"
              >
                <Icon name="stop" size={24} color={COLORS.PRIMARY_LIGHT} />
                <Text
                  style={[styles.buttonText, { color: COLORS.PRIMARY_LIGHT }]}
                >
                  Stop Monitoring
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reference Levels */}
          <View style={styles.referenceContainer}>
            <Text
              style={[
                styles.referenceTitle,
                {
                  color: COLORS.PRIMARY_DARK,
                  borderBottomColor: COLORS.SECONDARY_ACCENT,
                },
              ]}
            >
              Reference Sound Levels
            </Text>
            <View style={styles.referenceItem}>
              <Text style={[styles.referenceLevel, { color: COLORS.SUCCESS }]}>
                30 dB
              </Text>
              <Text
                style={[
                  styles.referenceDescription,
                  { color: COLORS.PRIMARY_DARK },
                ]}
              >
                Whisper, Quiet Library
              </Text>
            </View>
            <View style={styles.referenceItem}>
              <Text style={[styles.referenceLevel, { color: COLORS.SUCCESS }]}>
                50 dB
              </Text>
              <Text
                style={[
                  styles.referenceDescription,
                  { color: COLORS.PRIMARY_DARK },
                ]}
              >
                Normal Conversation
              </Text>
            </View>
            <View style={styles.referenceItem}>
              <Text style={[styles.referenceLevel, { color: COLORS.ACCENT }]}>
                70 dB
              </Text>
              <Text
                style={[
                  styles.referenceDescription,
                  { color: COLORS.PRIMARY_DARK },
                ]}
              >
                Busy Street Traffic
              </Text>
            </View>
            <View style={styles.referenceItem}>
              <Text style={[styles.referenceLevel, { color: COLORS.ERROR }]}>
                85 dB
              </Text>
              <Text
                style={[
                  styles.referenceDescription,
                  { color: COLORS.PRIMARY_DARK },
                ]}
              >
                Heavy Traffic, Power Tools
              </Text>
            </View>
            <View style={styles.referenceItem}>
              <Text style={[styles.referenceLevel, { color: COLORS.ERROR }]}>
                100 dB
              </Text>
              <Text
                style={[
                  styles.referenceDescription,
                  { color: COLORS.PRIMARY_DARK },
                ]}
              >
                Motorcycle, Chainsaw
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenBody>
  );
};

export default observer(DecibelMeterScreenImpl);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    paddingBottom: FOOTER_HEIGHT,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    paddingTop: SCROLL_PADDING,
    paddingBottom: 24,
    alignItems: 'center',
  },
  meterContainer: {
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  levelDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  levelNumber: {
    fontSize: 72,
    fontWeight: '700',
    lineHeight: 72,
  },
  levelUnit: {
    fontSize: 32,
    fontWeight: '600',
    marginLeft: 8,
  },
  barMeterContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 120,
    width: '100%',
    gap: 3,
  },
  bar: {
    flex: 1, // Equal width bars that flex to fill container
    borderRadius: 4,
    borderWidth: 1,
    // Height is set dynamically based on bar level to create proper meter visualization
  },
  controlsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  referenceContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  referenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  referenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  referenceLevel: {
    fontSize: 14,
    fontWeight: '700',
    width: 50,
  },
  referenceDescription: {
    fontSize: 14,
    flex: 1,
  },
});
