import { useRoute, RouteProp } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Sound from 'react-native-sound';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { COLORS } from '../../theme';
import { textToMorse, morseCodeData } from '../../utils/morseCodeMapping';
import { TrainerLevel } from './MorseTrainerScreen';

type RouteParams = {
  level: TrainerLevel;
};

// Morse code timing constants (in milliseconds)
const MORSE_UNIT_MS = 200; // Base unit for morse code timing (gap between sounds)
const LETTER_SPACE_UNITS = 2; // Additional space between letters (total 3 units)
const WORD_SEPARATOR_UNITS = 6; // Additional space between words (total 7 units)
const FEEDBACK_TIMEOUT_MS = 1500; // Time to display feedback before next challenge

// Training data
const COMMON_WORDS = [
  'SOS',
  'HELP',
  'WATER',
  'FOOD',
  'SAFE',
  'DANGER',
  'YES',
  'NO',
  'STOP',
  'GO',
  'COME',
  'HERE',
  'MORSE',
  'CODE',
  'TEST',
  'RADIO',
  'SIGNAL',
];

const TRAINING_SENTENCES = [
  'SOS NEED HELP',
  'ALL CLEAR',
  'STORM COMING',
  'SAFE HERE',
  'SEND SUPPLIES',
  'RADIO CHECK',
];

/**
 * Generates a random challenge based on the difficulty level.
 */
function generateChallenge(level: TrainerLevel): string {
  if (level === 'easy') {
    // Random single character
    const randomItem =
      morseCodeData[Math.floor(Math.random() * morseCodeData.length)];
    return randomItem.char;
  } else if (level === 'medium') {
    // Random word
    return COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)];
  } else {
    // Random sentence
    return TRAINING_SENTENCES[
      Math.floor(Math.random() * TRAINING_SENTENCES.length)
    ];
  }
}

/**
 * Morse Code Trainer Level Screen.
 * Plays morse code audio and asks user to identify what was played.
 */
export default function MorseTrainerLevelScreen() {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const level = route.params.level;

  const [challenge, setChallenge] = useState('');
  const [playedChallenge, setPlayedChallenge] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [dotSound, setDotSound] = useState<Sound | null>(null);
  const [dashSound, setDashSound] = useState<Sound | null>(null);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const feedbackTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const playbackTimeoutsRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const isPlayingRef = React.useRef(false);

  // Load sounds on mount
  useEffect(() => {
    Sound.setCategory('Playback');

    let dotLoaded = false;
    let dashLoaded = false;

    const checkBothLoaded = () => {
      if (dotLoaded && dashLoaded) {
        setSoundsLoaded(true);
      }
    };

    const dot = new Sound('sos_dot.wav', Sound.MAIN_BUNDLE, error => {
      if (error) {
        console.error('Failed to load dot sound', error);
        return;
      }
      dotLoaded = true;
      checkBothLoaded();
    });

    const dash = new Sound('sos_dash.wav', Sound.MAIN_BUNDLE, error => {
      if (error) {
        console.error('Failed to load dash sound', error);
        return;
      }
      dashLoaded = true;
      checkBothLoaded();
    });

    setDotSound(dot);
    setDashSound(dash);

    return () => {
      dot.release();
      dash.release();
    };
  }, []);

  // Generate initial challenge
  useEffect(() => {
    setChallenge(generateChallenge(level));
  }, [level]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      // Clear all playback timeouts
      playbackTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      playbackTimeoutsRef.current = [];
    };
  }, []);

  /**
   * Plays the morse code sequence for the current challenge.
   */
  const playMorseCode = useCallback(async () => {
    if (!dotSound || !dashSound || !soundsLoaded || isPlayingRef.current || !challenge) {
      return;
    }

    // Clear any existing playback timeouts
    playbackTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    playbackTimeoutsRef.current = [];

    // Record which challenge we're playing BEFORE starting playback
    setPlayedChallenge(challenge);
    setIsPlaying(true);
    isPlayingRef.current = true;
    const morseCode = textToMorse(challenge);

    // Helper to play a sound with proper stop/start sequence
    const playSound = (sound: Sound): Promise<void> => {
      return new Promise(resolve => {
        sound.stop(() => {
          sound.play(() => {
            resolve();
          });
        });
      });
    };

    // Helper to create a tracked timeout
    const createTimeout = (callback: () => void, delay: number): Promise<void> => {
      return new Promise(resolve => {
        const timeout = setTimeout(() => {
          // Remove this timeout from tracking
          playbackTimeoutsRef.current = playbackTimeoutsRef.current.filter(t => t !== timeout);
          callback();
          resolve();
        }, delay);
        playbackTimeoutsRef.current.push(timeout);
      });
    };

    const playSequence = async (morse: string) => {
      for (let i = 0; i < morse.length; i++) {
        // Check if playback was aborted
        if (!isPlayingRef.current) {
          return;
        }

        const char = morse[i];

        if (char === '.') {
          // Play dot and wait for it to complete
          await playSound(dotSound);
          // Gap after dot
          await createTimeout(() => {}, MORSE_UNIT_MS);
        } else if (char === '-') {
          // Play dash and wait for it to complete
          await playSound(dashSound);
          // Gap after dash
          await createTimeout(() => {}, MORSE_UNIT_MS);
        } else if (char === ' ') {
          // Space between letters (2 more units, total 3)
          await createTimeout(() => {}, MORSE_UNIT_MS * LETTER_SPACE_UNITS);
        } else if (char === '/') {
          // Word separator (6 more units, total 7)
          await createTimeout(() => {}, MORSE_UNIT_MS * WORD_SEPARATOR_UNITS);
        }
      }
    };

    await playSequence(morseCode);
    
    // Only update state if playback wasn't aborted
    if (isPlayingRef.current) {
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, [dotSound, dashSound, soundsLoaded, challenge]);

  /**
   * Checks the user's answer against the challenge that was played.
   */
  const checkAnswer = () => {
    const normalizedAnswer = userAnswer.trim().toUpperCase();
    const normalizedChallenge = playedChallenge.trim().toUpperCase();

    setAttempts(attempts + 1);

    if (normalizedAnswer === normalizedChallenge) {
      setScore(score + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }

    // Clear any existing timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    // Show feedback for 1.5 seconds, then move to next challenge
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setUserAnswer('');
      setChallenge(generateChallenge(level));
      feedbackTimeoutRef.current = null;
    }, FEEDBACK_TIMEOUT_MS);
  };

  /**
   * Reveals the answer to the user and moves to next challenge.
   */
  const showAnswer = () => {
    setUserAnswer(playedChallenge);
    setFeedback('incorrect');
    setAttempts(attempts + 1);

    // Clear any existing timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    // Move to next challenge after showing answer
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setUserAnswer('');
      setChallenge(generateChallenge(level));
      feedbackTimeoutRef.current = null;
    }, FEEDBACK_TIMEOUT_MS);
  };

  const getLevelTitle = () => {
    switch (level) {
      case 'easy':
        return 'Easy - Character';
      case 'medium':
        return 'Medium - Word';
      case 'hard':
        return 'Hard - Sentence';
    }
  };

  return (
    <ScreenBody>
      <SectionHeader>{getLevelTitle()}</SectionHeader>

      <View style={styles.container}>
        {/* Score Display */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            Score: {score}/{attempts}
            {attempts > 0 && ` (${Math.round((score / attempts) * 100)}%)`}
          </Text>
        </View>

        {/* Play Button */}
        <TouchableOpacity
          style={[
            styles.playButton,
            (isPlaying || !soundsLoaded) && styles.playButtonDisabled,
          ]}
          onPress={playMorseCode}
          disabled={isPlaying || !soundsLoaded}
          accessibilityLabel="Play morse code"
        >
          {isPlaying ? (
            <ActivityIndicator size="large" color={COLORS.PRIMARY_LIGHT} />
          ) : !soundsLoaded ? (
            <Text style={styles.playButtonText}>LOADING SOUNDS...</Text>
          ) : (
            <Text style={styles.playButtonText}>▶ PLAY MORSE CODE</Text>
          )}
        </TouchableOpacity>

        {/* Answer Input */}
        <View style={styles.answerContainer}>
          <Text style={styles.answerLabel}>Your Answer:</Text>
          <TextInput
            style={styles.answerInput}
            placeholder={`Enter ${
              level === 'easy'
                ? 'character'
                : level === 'medium'
                ? 'word'
                : 'sentence'
            }...`}
            placeholderTextColor={COLORS.SECONDARY_ACCENT}
            value={userAnswer}
            onChangeText={setUserAnswer}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={feedback === null}
          />
        </View>

        {/* Feedback */}
        {feedback && (
          <View
            style={[
              styles.feedbackContainer,
              feedback === 'correct'
                ? styles.correctFeedback
                : styles.incorrectFeedback,
            ]}
          >
            <Text style={styles.feedbackText}>
              {feedback === 'correct'
                ? '✓ Correct!'
                : `✗ Incorrect. Answer was: ${playedChallenge}`}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {feedback === null && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (userAnswer.trim().length === 0 || !playedChallenge) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={checkAnswer}
              disabled={userAnswer.trim().length === 0 || !playedChallenge}
              accessibilityLabel="Submit answer"
              accessibilityState={{
                disabled: userAnswer.trim().length === 0 || !playedChallenge,
              }}
            >
              <Text style={styles.buttonText}>SUBMIT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.hintButton,
                !playedChallenge && styles.hintButtonDisabled,
              ]}
              onPress={showAnswer}
              disabled={!playedChallenge}
              accessibilityLabel="Show answer"
              disabled={!playedChallenge}
            >
              <Text style={styles.buttonText}>SHOW ANSWER</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Press PLAY to hear the morse code, then enter what you heard and
            press SUBMIT.
          </Text>
        </View>
      </View>
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  scoreContainer: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
  },
  playButton: {
    backgroundColor: COLORS.ACCENT,
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
  },
  playButtonDisabled: {
    backgroundColor: COLORS.SECONDARY_ACCENT,
    opacity: 0.7,
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.PRIMARY_LIGHT,
  },
  answerContainer: {
    marginBottom: 16,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 6,
  },
  answerInput: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
  },
  feedbackContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 2,
  },
  correctFeedback: {
    backgroundColor: COLORS.SUCCESS_LIGHT,
    borderColor: COLORS.SUCCESS,
  },
  incorrectFeedback: {
    backgroundColor: COLORS.ERROR_LIGHT,
    borderColor: COLORS.ERROR,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.PRIMARY_DARK,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
  },
  submitButton: {
    backgroundColor: COLORS.ACCENT,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.SECONDARY_ACCENT,
    opacity: 0.6,
  },
  hintButton: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  hintButtonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
  },
  helpContainer: {
    padding: 10,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY_ACCENT,
  },
  helpText: {
    fontSize: 11,
    color: COLORS.SECONDARY_ACCENT,
    textAlign: 'center',
  },
});
