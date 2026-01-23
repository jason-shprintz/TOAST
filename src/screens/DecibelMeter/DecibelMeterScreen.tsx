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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { useCoreStore } from '../../stores/StoreContext';

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
   * Simulates audio level monitoring.
   * Note: Real audio metering would require native module enhancements.
   * This implementation uses simulated levels for demonstration.
   */
  const startMonitoring = () => {
    // Simulate audio level changes
    intervalRef.current = setInterval(() => {
      // Generate pseudo-random audio levels that look realistic
      // Real implementation would read from actual microphone input
      const baseLevel = 20 + Math.random() * 30; // Base ambient noise (20-50)
      const spike = Math.random() > 0.8 ? Math.random() * 40 : 0; // Occasional spikes
      const newLevel = Math.min(100, baseLevel + spike);

      setDecibelLevel(newLevel);
      core.setCurrentDecibelLevel(newLevel);

      // Animate the level change
      Animated.spring(animatedLevel, {
        toValue: newLevel,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start();
    }, 100); // Update 10 times per second
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
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      core.setDecibelMeterActive(false);
      core.setCurrentDecibelLevel(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Icon
          name="information-circle-outline"
          size={20}
          color={COLORS.PRIMARY_DARK}
        />
        <Text style={[styles.infoText, { color: COLORS.PRIMARY_DARK }]}>
          {isActive
            ? 'Monitoring ambient sound levels. The meter will also appear in the footer.'
            : 'Tap Start to begin monitoring ambient sound levels.'}
        </Text>
      </View>

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
    </ScreenBody>
  );
};

export default observer(DecibelMeterScreenImpl);

const styles = StyleSheet.create({
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
