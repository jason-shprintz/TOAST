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
  PermissionsAndroid,
} from 'react-native';
import {
  useSoundRecorder,
  // AudioEncoderAndroidType,
} from 'react-native-nitro-sound';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useCoreStore } from '../../stores';
import { COLORS } from '../../theme';

const MAX_DURATION_SECONDS = 12;

/**
 * Voice Log Screen
 *
 * Allows users to record short voice notes (max 12 seconds) with automatic metadata capture
 * or view and manage previously recorded voice logs.
 *
 * Features:
 * - One-tap recording with visual feedback
 * - Auto-stop at 12-second limit
 * - Haptic feedback on completion
 * - Automatic timestamp and location capture
 * - View, play, and delete saved voice logs
 * - Voice logs are stored separately from regular notes
 *
 * @returns A React element rendering the Voice Log screen.
 */
export default observer(function VoiceLogScreen() {
  const core = useCoreStore();
  const navigation = useNavigation();
  const [mode, setMode] = useState<'select' | 'record' | 'view'>('select');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const soundRef = useRef<Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize sound recorder
  const { startRecorder, stopRecorder } = useSoundRecorder({
    onRecord: e => {
      const currentTime = Math.floor(e.currentPosition / 1000);
      setRecordingTime(currentTime);

      // Auto-stop at max duration
      if (currentTime >= MAX_DURATION_SECONDS) {
        handleStopRecording();
      }
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Stop playback when unmounting
      if (soundRef.current) {
        soundRef.current.stop(() => {
          soundRef.current?.release();
          soundRef.current = null;
        });
      }
    };
  }, []);

  const requestAudioPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return true; // iOS permissions handled by Info.plist
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Audio Recording Permission',
          message:
            'This app needs access to your microphone to record voice logs.',
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

  const handleStartRecording = async () => {
    try {
      // Request permission on Android
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required to record audio.',
        );
        return;
      }

      setIsRecording(true);
      setRecordingTime(0);

      // Start recording - library uses default writable cache directory
      const path = await startRecorder();

      setAudioPath(path);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (!isRecording) return;

    try {
      setIsRecording(false);

      // Clear timer if running
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop recording - wrap in try/catch in case recorder isn't active
      let result: string | undefined;
      try {
        result = await stopRecorder();
      } catch (error) {
        console.warn('Error stopping recorder:', error);
        result = audioPath || undefined;
      }

      // Haptic feedback
      Vibration.vibrate(200);

      const duration = recordingTime;
      const audioUri = result || audioPath;

      // Validate audio path before saving
      if (!audioUri) {
        Alert.alert('Error', 'Failed to record audio. Please try again.');
        setRecordingTime(0);
        setAudioPath(null);
        return;
      }

      // Save voice log
      await core.createVoiceLog({
        audioUri: audioUri,
        duration: duration,
        transcription: undefined, // Transcription not implemented yet
      });

      // Show success message and navigate back
      Alert.alert('Saved', 'Voice log saved successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);

      setRecordingTime(0);
      setAudioPath(null);
    } catch (error) {
      console.error('Failed to save voice log:', error);
      Alert.alert('Error', 'Failed to save voice log. Please try again.');
      // Ensure recording state is reset even when saving fails
      setRecordingTime(0);
      setAudioPath(null);
    }
  };

  const formatTime = (seconds: number): string => {
    const remaining = MAX_DURATION_SECONDS - seconds;
    return `${remaining}s`;
  };

  const progress = recordingTime / MAX_DURATION_SECONDS;

  // Get only voice logs from notes
  const voiceLogs = core.notes.filter(note => note.category === 'Voice Logs');

  const handlePlayVoiceLog = (noteId: string, audioUri: string) => {
    try {
      // Stop any currently playing sound
      if (soundRef.current) {
        soundRef.current.stop(() => {
          soundRef.current?.release();
          soundRef.current = null;
        });
        setPlayingId(null);
        return;
      }

      // Start playing new sound
      setPlayingId(noteId);

      // Load audio file
      const sound = new Sound(audioUri, '', error => {
        if (error) {
          console.error('Failed to load sound:', error);
          Alert.alert('Error', 'Failed to load audio file.');
          sound.release();
          setPlayingId(null);
          return;
        }

        // Play the sound
        sound.play(success => {
          if (success) {
            setPlayingId(null);
          } else {
            console.error('Failed to play sound');
            Alert.alert('Error', 'Failed to play audio.');
            setPlayingId(null);
          }

          // Release sound resources after playback completes
          sound.release();
          if (soundRef.current === sound) {
            soundRef.current = null;
          }
        });

        soundRef.current = sound;
      });
    } catch (error) {
      console.error('Error playing voice log:', error);
      Alert.alert('Error', 'Failed to play voice log.');
      setPlayingId(null);
    }
  };

  const handleDeleteVoiceLog = (noteId: string) => {
    Alert.alert(
      'Delete Voice Log',
      'Are you sure you want to delete this voice log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Stop playing if this is the currently playing log
            if (playingId === noteId && soundRef.current) {
              soundRef.current.stop(() => {
                soundRef.current?.release();
                soundRef.current = null;
              });
              setPlayingId(null);
            }
            core.deleteNote(noteId);
          },
        },
      ],
    );
  };

  // Mode: Select recording or viewing
  if (mode === 'select') {
    return (
      <ScreenBody>
        <SectionHeader>Voice Logs</SectionHeader>
        <View style={styles.container}>
          <Text style={styles.modeSelectionTitle}>
            What would you like to do?
          </Text>

          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => {
              setMode('record');
              setRecordingTime(0);
              setAudioPath(null);
            }}
            accessibilityLabel="Record Voice Log"
            accessibilityRole="button"
          >
            <Icon
              name="mic"
              size={48}
              color={COLORS.PRIMARY_LIGHT}
              style={styles.modeButtonIcon}
            />
            <Text style={styles.modeButtonText}>Record Voice Log</Text>
            <Text style={styles.modeButtonSubtext}>
              Create a new voice note
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => setMode('view')}
            accessibilityLabel="View Voice Logs"
            accessibilityRole="button"
          >
            <Icon
              name="list"
              size={48}
              color={COLORS.PRIMARY_LIGHT}
              style={styles.modeButtonIcon}
            />
            <Text style={styles.modeButtonText}>View Voice Logs</Text>
            <Text style={styles.modeButtonSubtext}>
              {voiceLogs.length} saved {voiceLogs.length === 1 ? 'log' : 'logs'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenBody>
    );
  }

  // Mode: Record
  if (mode === 'record') {
    return (
      <ScreenBody>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => setMode('select')}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <Icon name="chevron-back" size={32} color={COLORS.PRIMARY_DARK} />
          </TouchableOpacity>
          <SectionHeader isShowHr={false}>Record Voice Log</SectionHeader>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.container}>
          <View style={styles.infoBox}>
            <Icon
              name="information-circle-outline"
              size={20}
              color={COLORS.PRIMARY_DARK}
            />
            <Text style={styles.infoText}>
              Tap to record a voice note.{'\n'}
              Maximum duration: {MAX_DURATION_SECONDS} seconds.
            </Text>
          </View>

          <View style={styles.recordingArea}>
            {isRecording && (
              <>
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${progress * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.timerText}>
                  {formatTime(recordingTime)}
                </Text>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
              ]}
              onPress={isRecording ? handleStopRecording : handleStartRecording}
              accessibilityLabel={
                isRecording ? 'Stop Recording' : 'Start Recording'
              }
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
              <Icon
                name="location-outline"
                size={16}
                color={COLORS.PRIMARY_DARK}
              />
              <Text style={styles.featureText}>
                GPS Location (if available)
              </Text>
            </View>
          </View>
        </View>
      </ScreenBody>
    );
  }

  // Mode: View
  return (
    <ScreenBody>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => setMode('select')}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Icon name="chevron-back" size={32} color={COLORS.PRIMARY_DARK} />
        </TouchableOpacity>
        <SectionHeader isShowHr={false}>Voice Logs</SectionHeader>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.container}>
        {voiceLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon
              name="mic-off-outline"
              size={64}
              color={COLORS.PRIMARY_DARK}
              style={{ opacity: 0.5, marginBottom: 16 }}
            />
            <Text style={styles.emptyStateText}>No voice logs yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Record your first voice log to get started
            </Text>
          </View>
        ) : (
          <View style={styles.voiceLogsList}>
            {voiceLogs.map(log => (
              <View
                key={log.id}
                style={[
                  styles.voiceLogCard,
                  playingId === log.id && styles.voiceLogCardPlaying,
                ]}
              >
                <View style={styles.voiceLogHeader}>
                  <View style={styles.voiceLogInfo}>
                    <Text style={styles.voiceLogTitle}>{log.title}</Text>
                    <Text style={styles.voiceLogTime}>
                      {new Date(log.createdAt).toLocaleString()}
                    </Text>
                    {log.duration && (
                      <Text style={styles.voiceLogDuration}>
                        Duration: {log.duration}s
                      </Text>
                    )}
                    {playingId === log.id && (
                      <View style={styles.playingIndicator}>
                        <View style={styles.playingDot} />
                        <Text style={styles.playingText}>Playing...</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.voiceLogActions}>
                  {log.audioUri && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handlePlayVoiceLog(log.id, log.audioUri!)}
                      accessibilityLabel={
                        playingId === log.id ? 'Stop playing' : 'Play voice log'
                      }
                      accessibilityRole="button"
                    >
                      <Icon
                        name={playingId === log.id ? 'pause' : 'play'}
                        size={24}
                        color={COLORS.SECONDARY_ACCENT}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteVoiceLog(log.id)}
                    accessibilityLabel="Delete voice log"
                    accessibilityRole="button"
                  >
                    <Icon name="trash-outline" size={24} color="#d32f2f" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
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
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  modeSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 30,
    textAlign: 'center',
  },
  modeButton: {
    width: '100%',
    backgroundColor: COLORS.TOAST_BROWN,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  modeButtonIcon: {
    marginBottom: 12,
  },
  modeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 4,
  },
  modeButtonSubtext: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
    textAlign: 'center',
  },
  voiceLogsList: {
    width: '100%',
  },
  voiceLogCard: {
    backgroundColor: COLORS.TOAST_BROWN,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY_ACCENT,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceLogCardPlaying: {
    backgroundColor: COLORS.ACCENT,
    borderColor: COLORS.ACCENT,
  },
  voiceLogHeader: {
    flex: 1,
  },
  voiceLogInfo: {
    flex: 1,
  },
  voiceLogTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 4,
  },
  voiceLogTime: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
    marginBottom: 4,
  },
  voiceLogDuration: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
    marginBottom: 4,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  playingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    marginRight: 6,
  },
  playingText: {
    fontSize: 12,
    color: COLORS.SECONDARY_ACCENT,
    fontWeight: '600',
  },
  voiceLogActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});
