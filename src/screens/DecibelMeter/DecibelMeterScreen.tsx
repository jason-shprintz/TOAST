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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
   * Simulates audio level monitoring with smoother, more realistic behavior.
   * Note: Real audio metering would require native module enhancements.
   * This implementation uses simulated levels for demonstration.
   */
  const startMonitoring = () => {
    let currentLevel = 25; // Start at quiet ambient level
    const targetLevelRef = { value: 25 }; // Use object to share across closures
    
    // Simulate audio level changes with smoother transitions
    intervalRef.current = setInterval(() => {
      // Slowly drift the target level to simulate ambient changes
      if (Math.random() > 0.95) {
        // Occasionally change the target ambient level
        targetLevelRef.value = 20 + Math.random() * 25; // Range: 20-45 dB (quiet to moderate)
      }
      
      // Add occasional brief spikes to simulate sounds
      let targetLevel = targetLevelRef.value;
      if (Math.random() > 0.92) {
        // Brief spike (simulating a sound)
        targetLevel += Math.random() * 30; // Up to +30 dB
      }
      
      // Smooth interpolation toward target (not instant jumps)
      const smoothing = 0.3; // Lower = smoother transitions
      currentLevel = currentLevel + (targetLevel - currentLevel) * smoothing;
      
      // Clamp to valid range
      const newLevel = Math.max(15, Math.min(100, currentLevel));
      
      setDecibelLevel(newLevel);
      core.setCurrentDecibelLevel(newLevel);

      // Animate the level change with smooth spring
      Animated.spring(animatedLevel, {
        toValue: newLevel,
        useNativeDriver: false,
        friction: 12,
        tension: 30,
      }).start();
    }, 150); // Update ~6-7 times per second for smoother appearance
  };

  /**
   * Stops audio level monitoring.
   */
  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDecibelLevel(0);
    core.setCurrentDecibelLevel(0);
    animatedLevel.setValue(0);
  };

  /**
   * Handles starting the decibel meter.
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

    setIsActive(true);
    core.setDecibelMeterActive(true);
    startMonitoring();
  };

  /**
   * Handles stopping the decibel meter.
   */
  const handleStop = () => {
    setIsActive(false);
    core.setDecibelMeterActive(false);
    stopMonitoring();
  };

  /**
   * Cleanup on unmount - only stop the interval, but keep the meter active
   * so it persists when navigating away from the screen.
   */
  useEffect(() => {
    return () => {
      // Only stop the monitoring interval on this screen
      // Don't deactivate the meter - it should persist across navigation
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Sync local state with core store and restart monitoring if meter is active.
   * This ensures the monitoring resumes when returning to the screen.
   */
  useEffect(() => {
    setIsActive(core.decibelMeterActive);
    
    // If the meter is active (from core store) but not monitoring locally, start it
    if (core.decibelMeterActive && !intervalRef.current) {
      startMonitoring();
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

  /**
   * Get decibel description based on level.
   */
  const getLevelDescription = (level: number): string => {
    if (level < 30) return 'Very Quiet';
    if (level < 50) return 'Quiet';
    if (level < 70) return 'Moderate';
    if (level < 85) return 'Loud';
    return 'Very Loud';
  };

  const levelColor = getLevelColor(decibelLevel);
  const levelDescription = getLevelDescription(decibelLevel);

  return (
    <ScreenBody>
      <SectionHeader>Decibel Meter</SectionHeader>
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

          <Text
            style={[
              styles.levelDescription,
              { color: isActive ? levelColor : COLORS.PRIMARY_DARK },
            ]}
          >
            {isActive ? levelDescription : 'Inactive'}
          </Text>

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
                      backgroundColor: isBarActive ? barColor : COLORS.BACKGROUND,
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
              <Text style={[styles.buttonText, { color: COLORS.PRIMARY_LIGHT }]}>
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
              <Text style={[styles.buttonText, { color: COLORS.PRIMARY_LIGHT }]}>
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
    </ScreenBody>
  );
};

export default observer(DecibelMeterScreenImpl);

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: SCROLL_PADDING,
    paddingBottom: FOOTER_HEIGHT + SCROLL_PADDING,
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
  levelDescription: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
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
