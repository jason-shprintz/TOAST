import { useRoute, useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSound } from 'react-native-nitro-sound';
import { HorizontalRule } from '../../../components/HorizontalRule';
import ScreenBody from '../../../components/ScreenBody';
import SectionHeader from '../../../components/SectionHeader';
import { useCoreStore } from '../../../stores';
import { COLORS, FOOTER_HEIGHT } from '../../../theme';
import { noteListSharedStyles as shared } from '../noteListStyles';

/**
 * Displays a single note in fully expanded state.
 *
 * This screen retrieves a note from the navigation route parameters and displays
 * it with its full title and body text. It includes bookmark and delete functionality
 * and navigation options.
 *
 * @returns {JSX.Element} The rendered note entry screen component.
 *
 * @remarks
 * - Receives `note` parameter from the route params
 * - Displays the note title as the section header
 * - Shows the full note text in expanded view
 * - Includes bookmark and delete buttons
 */
export default observer(function NoteEntryScreen(): React.JSX.Element {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const core = useCoreStore();
  const [isBookmarked, setIsBookmarked] = useState<boolean>(
    route.params?.note?.bookmarked ?? false,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { note } = route.params || {};

  // Initialize sound player only for voice logs with audio URIs
  const isVoiceLog = note?.type === 'voice' && note?.audioUri;
  const soundHook = useSound({
    url: isVoiceLog ? note.audioUri : '',
    autoPlay: false,
    onPlaybackStatusUpdate: (status) => {
      if (status.ended) {
        setIsPlaying(false);
      }
    },
  });

  const handlePlayPause = async () => {
    if (!isVoiceLog) return;

    try {
      setIsLoading(true);
      if (isPlaying) {
        await soundHook.pause();
        setIsPlaying(false);
      } else {
        await soundHook.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Error', 'Failed to play audio. The file may not be available.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      await soundHook.stop();
      setIsPlaying(false);
    } catch (error) {
      console.error('Stop error:', error);
    }
  };

  if (!note) {
    return (
      <ScreenBody>
        <SectionHeader>Note Not Found</SectionHeader>
        <View style={styles.container}>
          <Text style={shared.value}>
            The requested note could not be found.
          </Text>
        </View>
      </ScreenBody>
    );
  }

  const noteTitle = note.title || '(Untitled)';
  const noteText = note.text || '';

  const handleBookmarkPress = async () => {
    await core.toggleNoteBookmark(note.id);
    setIsBookmarked(!isBookmarked);
  };

  return (
    <ScreenBody>
      <SectionHeader>{noteTitle}</SectionHeader>
      <View style={styles.noteHeader}>
        <TouchableOpacity
          accessibilityLabel="Bookmark note"
          accessibilityRole="button"
          style={shared.noteButton}
          onPress={handleBookmarkPress}
        >
          <Icon
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={30}
            color={COLORS.PRIMARY_DARK}
          />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Delete note"
          accessibilityRole="button"
          style={shared.noteButton}
          onPress={() => {
            Alert.alert(
              'Delete Note',
              'Are you sure you want to delete this note?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await core.deleteNote(note.id);
                    navigation.goBack();
                  },
                },
              ],
            );
          }}
        >
          <Icon name="trash-outline" size={30} color={COLORS.PRIMARY_DARK} />
        </TouchableOpacity>
      </View>
      <HorizontalRule />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={shared.actionsRow}>
            <Text style={shared.itemMeta}>
              {new Date(note.createdAt).toLocaleString()} • {note.category}
            </Text>
          </View>

          {note.type === 'voice' && note.audioUri && (
            <View style={styles.voiceLogContainer}>
              <View style={styles.voiceLogHeader}>
                <Icon name="mic-circle" size={40} color={COLORS.SECONDARY_ACCENT} />
                <View style={styles.voiceLogInfo}>
                  <Text style={styles.voiceLogTitle}>Voice Log</Text>
                  {note.duration && (
                    <Text style={styles.voiceLogDuration}>
                      Duration: {Math.round(note.duration)}s
                    </Text>
                  )}
                </View>
              </View>
              {note.latitude && note.longitude && (
                <Text style={styles.locationText}>
                  <Icon name="location-outline" size={14} color={COLORS.PRIMARY_DARK} />
                  {' '}Location: {note.latitude.toFixed(6)}, {note.longitude.toFixed(6)}
                </Text>
              )}
              <HorizontalRule />
              <View style={styles.playbackControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={handlePlayPause}
                  disabled={isLoading}
                  accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
                  accessibilityRole="button"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.PRIMARY_LIGHT} />
                  ) : (
                    <Icon
                      name={isPlaying ? 'pause' : 'play'}
                      size={30}
                      color={COLORS.PRIMARY_LIGHT}
                    />
                  )}
                </TouchableOpacity>
                {isPlaying && (
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={handleStop}
                    accessibilityLabel="Stop audio"
                    accessibilityRole="button"
                  >
                    <Icon name="stop" size={24} color={COLORS.PRIMARY_DARK} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View>
            <Text style={shared.itemBodyExpanded}>{noteText}</Text>
          </View>
        </ScrollView>
      </View>
    </ScreenBody>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderWidth: 2,
    borderRadius: 12,
    borderColor: COLORS.SECONDARY_ACCENT,
    alignSelf: 'stretch',
    marginTop: 12,
    marginBottom: FOOTER_HEIGHT + 12,
  },
  noteHeader: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  voiceLogContainer: {
    backgroundColor: COLORS.TOAST_BROWN,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY_ACCENT,
    padding: 12,
    marginVertical: 12,
  },
  voiceLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  voiceLogInfo: {
    marginLeft: 12,
    flex: 1,
  },
  voiceLogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_DARK,
  },
  voiceLogDuration: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.8,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
    marginTop: 4,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stopButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
