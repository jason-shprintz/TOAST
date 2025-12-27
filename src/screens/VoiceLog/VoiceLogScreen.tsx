import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useCoreStore } from '../../stores';
import { COLORS } from '../../theme';

const MAX_DURATION_SECONDS = 12;

/**
 * Voice Log Screen
 *
 * Allows users to record short voice notes (max 12 seconds) with automatic metadata capture.
 * Features:
 * - One-tap recording with visual feedback
 * - Auto-stop at 12-second limit
 * - Haptic feedback on completion
 * - Automatic timestamp and location capture
 * - Creates a note entry in "Voice Logs" category
 *
 * @returns A React element rendering the Voice Log screen.
 */
export default observer(function VoiceLogScreen() {
  const core = useCoreStore();
  const navigation = useNavigation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // NOTE: In a real implementation, you would use a library like
      // react-native-audio-recorder-player here. For MVP, we're creating
      // a mock implementation that demonstrates the UX flow.
      
      setIsRecording(true);
      startTimeRef.current = Date.now();
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);

        // Auto-stop at max duration
        if (elapsed >= MAX_DURATION_SECONDS) {
          stopRecording();
        }
      }, 100);

      // In real implementation: Start actual audio recording
      // const path = await AudioRecorderPlayer.startRecorder({
      //   audioEncoder: AudioEncoderAndroidType.AAC,
      //   audioSamplingRate: 16000,
      //   audioChannels: 1,
      // });
      // setAudioPath(path);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRecording(false);

      // Haptic feedback
      Vibration.vibrate(200);

      const duration = recordingTime;

      // In real implementation: Stop actual audio recording
      // const result = await AudioRecorderPlayer.stopRecorder();
      // const audioUri = result;

      // For MVP demo: Create a mock audio URI
      const mockAudioUri = `file://voice-log-${Date.now()}.m4a`;

      // Save voice log
      await core.createVoiceLog({
        audioUri: mockAudioUri,
        duration: duration,
        transcription: undefined, // MVP: No transcription
      });

      // Show success message
      Alert.alert(
        'Saved',
        'Voice log saved successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation && 'goBack' in navigation) {
                // @ts-ignore
                navigation.goBack();
              }
            },
          },
        ],
      );

      setRecordingTime(0);
    } catch (error) {
      console.error('Failed to save voice log:', error);
      Alert.alert('Error', 'Failed to save voice log. Please try again.');
    }
  };

  const formatTime = (seconds: number): string => {
    const remaining = MAX_DURATION_SECONDS - seconds;
    return `${remaining}s`;
  };

  const progress = recordingTime / MAX_DURATION_SECONDS;

  return (
    <ScreenBody>
      <SectionHeader>Voice Log</SectionHeader>
      <View style={styles.container}>
        <View style={styles.infoBox}>
          <Icon name="information-circle-outline" size={20} color={COLORS.PRIMARY_DARK} />
          <Text style={styles.infoText}>
            Tap to record a voice note.{'\n'}
            Maximum duration: {MAX_DURATION_SECONDS} seconds.
          </Text>
        </View>

        <View style={styles.recordingArea}>
          {isRecording && (
            <>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            accessibilityLabel={isRecording ? 'Stop Recording' : 'Start Recording'}
            accessibilityRole="button"
          >
            <Icon
              name={isRecording ? 'stop' : 'mic'}
              size={60}
              color={COLORS.PRIMARY_LIGHT}
            />
          </TouchableOpacity>

          {!isRecording && (
            <Text style={styles.instruction}>Tap to start recording</Text>
          )}
          {isRecording && (
            <Text style={styles.recordingText}>Recording...</Text>
          )}
        </View>

        <View style={styles.featuresBox}>
          <Text style={styles.featuresTitle}>Auto-captured metadata:</Text>
          <View style={styles.featureRow}>
            <Icon name="time-outline" size={16} color={COLORS.PRIMARY_DARK} />
            <Text style={styles.featureText}>Timestamp</Text>
          </View>
          <View style={styles.featureRow}>
            <Icon name="location-outline" size={16} color={COLORS.PRIMARY_DARK} />
            <Text style={styles.featureText}>GPS Location (if available)</Text>
          </View>
        </View>
      </View>
    </ScreenBody>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.TOAST_BROWN,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY_ACCENT,
    padding: 12,
    marginBottom: 40,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginLeft: 8,
    lineHeight: 20,
  },
  recordingArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  progressContainer: {
    width: 200,
    height: 6,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.SECONDARY_ACCENT,
    borderRadius: 3,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 20,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#d32f2f',
  },
  instruction: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.8,
  },
  recordingText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  featuresBox: {
    backgroundColor: COLORS.TOAST_BROWN,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY_ACCENT,
    padding: 16,
    width: '100%',
    marginTop: 40,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginLeft: 8,
  },
});
