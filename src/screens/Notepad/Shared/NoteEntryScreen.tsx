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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
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

  const { note } = route.params || {};

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
              <Text style={styles.audioNote}>
                <Icon name="information-circle-outline" size={14} color={COLORS.PRIMARY_DARK} />
                {' '}Audio playback will be available in future release
              </Text>
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
  audioNote: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
