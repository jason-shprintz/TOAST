import React from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/Ionicons';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';

/**
 * DigitalWhistleScreen component
 *
 * Provides two types of whistles:
 * - Normal Whistle (using placeholder tone)
 * - Dog Whistle (using placeholder tone)
 *
 * Note: Currently uses placeholder morse code sounds. Production implementation
 * would use custom whistle sound files at appropriate frequencies (e.g., 3000 Hz
 * for normal whistle and 20000 Hz for dog whistle).
 *
 * Each whistle has two modes:
 * - Short Burst: Plays once
 * - Continuous: Loops until stopped
 *
 * @returns A React element rendering the digital whistle screen.
 */
export default function DigitalWhistleScreen() {
  const COLORS = useTheme();
  const [isPlayingNormal, setIsPlayingNormal] = React.useState(false);
  const [isPlayingDog, setIsPlayingDog] = React.useState(false);
  const normalSoundRef = React.useRef<Sound | null>(null);
  const dogSoundRef = React.useRef<Sound | null>(null);

  /**
   * Initialize sounds on component mount
   */
  React.useEffect(() => {
    // Enable playback in silent mode
    Sound.setCategory('Playback');

    // Use the existing morse code sounds as a placeholder
    // In a real implementation, you would add custom whistle sound files
    normalSoundRef.current = new Sound(
      'sos_dash.wav',
      Sound.MAIN_BUNDLE,
      (error) => {
        if (error) {
          console.error('Failed to load normal whistle sound:', error);
        }
      },
    );

    dogSoundRef.current = new Sound(
      'sos_dot.wav',
      Sound.MAIN_BUNDLE,
      (error) => {
        if (error) {
          console.error('Failed to load dog whistle sound:', error);
        }
      },
    );

    const normalInterval = normalSoundRef;
    const dogInterval = dogSoundRef;

    return () => {
      // Cleanup on unmount
      if (normalInterval.current) {
        normalInterval.current.stop();
        normalInterval.current.release();
      }
      if (dogInterval.current) {
        dogInterval.current.stop();
        dogInterval.current.release();
      }
    };
  }, []);

  /**
   * Plays a short burst of whistle sound
   * @param isNormal - True for normal whistle, false for dog whistle
   */
  const playShortBurst = React.useCallback((isNormal: boolean) => {
    const sound = isNormal ? normalSoundRef.current : dogSoundRef.current;

    if (!sound) {
      Alert.alert('Error', 'Sound not loaded yet. Please try again.');
      return;
    }

    sound.stop(() => {
      sound.play((success) => {
        if (!success) {
          console.error('Playback failed');
        }
      });
    });
  }, []);

  /**
   * Starts continuous whistle playback using looping
   * @param isNormal - True for normal whistle, false for dog whistle
   */
  const startContinuous = React.useCallback((isNormal: boolean) => {
    const sound = isNormal ? normalSoundRef.current : dogSoundRef.current;

    if (!sound) {
      Alert.alert('Error', 'Sound not loaded yet. Please try again.');
      return;
    }

    // Stop any existing playback
    sound.stop(() => {
      // Set to loop continuously
      sound.setNumberOfLoops(-1);

      // Start playing
      sound.play((success) => {
        if (!success) {
          console.error('Playback failed');
          if (isNormal) {
            setIsPlayingNormal(false);
          } else {
            setIsPlayingDog(false);
          }
        }
      });

      // Update state
      if (isNormal) {
        setIsPlayingNormal(true);
      } else {
        setIsPlayingDog(true);
      }
    });
  }, []);

  /**
   * Stops continuous whistle playback
   * @param isNormal - True for normal whistle, false for dog whistle
   */
  const stopContinuous = React.useCallback((isNormal: boolean) => {
    const sound = isNormal ? normalSoundRef.current : dogSoundRef.current;

    if (sound) {
      sound.stop(() => {
        // Reset loop count
        sound.setNumberOfLoops(0);
      });
    }

    if (isNormal) {
      setIsPlayingNormal(false);
    } else {
      setIsPlayingDog(false);
    }
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      paddingHorizontal: 14,
      paddingTop: 10,
    },
    whistleSection: {
      marginBottom: 30,
    },
    whistleTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: COLORS.PRIMARY_DARK,
      marginBottom: 12,
      textAlign: 'center',
    },
    whistleDescription: {
      fontSize: 14,
      color: COLORS.SECONDARY_ACCENT,
      marginBottom: 16,
      textAlign: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    button: {
      flex: 1,
      backgroundColor: COLORS.ACCENT,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    buttonActive: {
      backgroundColor: COLORS.TOAST_BROWN,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.PRIMARY_LIGHT,
    },
    separator: {
      height: 2,
      backgroundColor: COLORS.TOAST_BROWN,
      marginVertical: 20,
      opacity: 0.3,
    },
    note: {
      fontSize: 12,
      color: COLORS.SECONDARY_ACCENT,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 20,
      paddingHorizontal: 20,
    },
  });

  return (
    <ScreenBody>
      <SectionHeader>Digital Whistle</SectionHeader>

      <View style={styles.container}>
        {/* Normal Whistle Section */}
        <View style={styles.whistleSection}>
          <Text style={styles.whistleTitle}>Normal Whistle</Text>
          <Text style={styles.whistleDescription}>
            Standard whistle tone - Audible to humans
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => playShortBurst(true)}
            >
              <Icon
                name="flash-outline"
                size={20}
                color={COLORS.PRIMARY_LIGHT}
              />
              <Text style={styles.buttonText}>Short Burst</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isPlayingNormal && styles.buttonActive]}
              onPress={() => {
                if (isPlayingNormal) {
                  stopContinuous(true);
                } else {
                  startContinuous(true);
                }
              }}
            >
              <Icon
                name={isPlayingNormal ? 'stop' : 'play'}
                size={20}
                color={COLORS.PRIMARY_LIGHT}
              />
              <Text style={styles.buttonText}>
                {isPlayingNormal ? 'Stop' : 'Continuous'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Dog Whistle Section */}
        <View style={styles.whistleSection}>
          <Text style={styles.whistleTitle}>Dog Whistle</Text>
          <Text style={styles.whistleDescription}>
            High frequency tone - May be less audible to humans
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => playShortBurst(false)}
            >
              <Icon
                name="flash-outline"
                size={20}
                color={COLORS.PRIMARY_LIGHT}
              />
              <Text style={styles.buttonText}>Short Burst</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isPlayingDog && styles.buttonActive]}
              onPress={() => {
                if (isPlayingDog) {
                  stopContinuous(false);
                } else {
                  startContinuous(false);
                }
              }}
            >
              <Icon
                name={isPlayingDog ? 'stop' : 'play'}
                size={20}
                color={COLORS.PRIMARY_LIGHT}
              />
              <Text style={styles.buttonText}>
                {isPlayingDog ? 'Stop' : 'Continuous'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.note}>
          Note: Currently using placeholder tones. Custom whistle sounds would
          be added in a production implementation.
        </Text>
      </View>
    </ScreenBody>
  );
}
