import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Button,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import SketchCanvas from '../../components/SketchCanvas';
import { useKeyboardStatus } from '../../hooks/useKeyboardStatus';
import { useCoreStore } from '../../stores';
import { COLORS, FOOTER_HEIGHT } from '../../theme';
import { MAX_TITLE_LENGTH } from './constants';

/**
 * Screen for composing and saving a new note.
 *
 * Provides UI to:
 * - Select a note category from `core.categories`.
 * - Select a note type (`'text'` or `'sketch'`).
 * - Enter note content via a multiline `TextInput` (currently used for both types).
 * - Save the note to the core store and return to the previous screen.
 * - Clear the current draft.
 *
 * Keyboard handling:
 * - Wraps content in `KeyboardAvoidingView` (iOS uses `padding`) and dismisses the keyboard
 *   when tapping outside inputs.
 * - Adapts input height based on `useKeyboardStatus().isVisible`.
 *
 * Validation:
 * - Save/Clear actions are disabled until the trimmed text is non-empty.
 *
 * Accessibility:
 * - Dropdown triggers and the attach-photo icon button include accessibility labels/hints/roles.
 *
 * Notes:
 * - The “Attach photo” action is a placeholder (no-op).
 * - Navigation uses `goBack()` when available to avoid hard-coded route names.
 *
 * @returns A React element rendering the “New Note” creation screen.
 */
export default observer(function NewNoteScreen() {
  const core = useCoreStore();
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [sketchDataUri, setSketchDataUri] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState(core.categories[0]);
  const [noteType, setNoteType] = useState<'text' | 'sketch'>('text');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const { isKeyboardVisible } = useKeyboardStatus();
  const hasContent: boolean = noteType === 'text' ? text.trim().length > 0 : !!sketchDataUri;
  const animatedHeight = useMemo(() => new Animated.Value(250), []);

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isKeyboardVisible ? 100 : 250,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [isKeyboardVisible, animatedHeight]);

  return (
    <ScreenBody>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.innerContainer}>
            <SectionHeader>New Note</SectionHeader>
            <View style={styles.card}>
              <View style={styles.inlineCenter}>
                <View style={styles.dropdown}>
                  <TouchableOpacity
                    style={styles.dropdownHeader}
                    onPress={() => setShowCategoryMenu(v => !v)}
                    accessibilityLabel={`Category: ${category}`}
                    accessibilityHint="Opens category selection menu"
                    accessibilityRole="button"
                  >
                    <Text style={styles.dropdownHeaderText}>{category}</Text>
                    <Icon
                      name="chevron-down-outline"
                      size={18}
                      color={COLORS.PRIMARY_DARK}
                    />
                  </TouchableOpacity>
                  {showCategoryMenu && (
                    <View style={styles.dropdownMenu}>
                      {core.categories.map(cat => (
                        <TouchableOpacity
                          key={cat}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setCategory(cat);
                            setShowCategoryMenu(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.dropdown}>
                  <TouchableOpacity
                    style={styles.dropdownHeader}
                    onPress={() => setShowTypeMenu(v => !v)}
                    accessibilityLabel={`Note type: ${
                      noteType === 'text' ? 'Type Text' : 'Sketch'
                    }`}
                    accessibilityHint="Opens note type selection menu"
                    accessibilityRole="button"
                  >
                    <Text style={styles.dropdownHeaderText}>
                      {noteType === 'text' ? 'Text' : 'Sketch'}
                    </Text>
                    <Icon
                      name="chevron-down-outline"
                      size={18}
                      color={COLORS.PRIMARY_DARK}
                    />
                  </TouchableOpacity>
                  {showTypeMenu && (
                    <View style={styles.dropdownMenu}>
                      {['text', 'sketch'].map(t => (
                        <TouchableOpacity
                          key={t}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setNoteType(t as 'text' | 'sketch');
                            setShowTypeMenu(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>
                            {t === 'text' ? 'Text' : 'Sketch'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => {
                    /* placeholder attach photo */
                  }}
                  accessibilityLabel="Attach photo"
                  accessibilityHint="Opens camera to attach a photo to your note"
                  accessibilityRole="button"
                >
                  <Icon
                    name="camera-outline"
                    size={22}
                    color={COLORS.PRIMARY_DARK}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inline}>
                <Button
                  title="Save"
                  disabled={!hasContent}
                  onPress={async () => {
                    try {
                      await core.createNote({
                        type: noteType,
                        title,
                        text: noteType === 'text' ? text : undefined,
                        sketchDataUri: noteType === 'sketch' ? sketchDataUri : undefined,
                        category,
                      });
                      // Return to previous screen (Notepad)
                      // Prefer goBack to avoid hard-coding route names
                      if (navigation && 'goBack' in navigation) {
                        // @ts-ignore
                        navigation.goBack();
                      }
                    } catch (error) {
                      Alert.alert(
                        'Error',
                        'Failed to save note. Please try again.',
                      );
                      console.error('Failed to create note:', error);
                    }
                  }}
                />
                <Button
                  title="Clear"
                  disabled={!hasContent}
                  onPress={() => {
                    if (noteType === 'text') {
                      setText('');
                    } else {
                      setSketchDataUri(undefined);
                    }
                  }}
                />
              </View>

              <TextInput
                style={styles.titleInput}
                placeholder="Title (optional)"
                placeholderTextColor={COLORS.PRIMARY_DARK}
                value={title}
                onChangeText={setTitle}
                maxLength={MAX_TITLE_LENGTH}
              />

              <Text style={styles.label}>
                {noteType === 'text' ? 'Text' : 'Sketch'}
              </Text>
              {noteType === 'text' ? (
                <Animated.View
                  style={[
                    styles.animatedInputContainer,
                    { height: animatedHeight },
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type your note..."
                    placeholderTextColor={COLORS.PRIMARY_DARK}
                    multiline
                    value={text}
                    onChangeText={setText}
                  />
                </Animated.View>
              ) : (
                <View style={styles.sketchContainer}>
                  <SketchCanvas
                    onSketchSave={(dataUri: string) => setSketchDataUri(dataUri)}
                    initialSketch={sketchDataUri}
                  />
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenBody>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
  },
  card: {
    flex: 1 - FOOTER_HEIGHT,
    width: '100%',
    backgroundColor: COLORS.TOAST_BROWN,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: FOOTER_HEIGHT + 6,
  },
  label: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.9,
    marginBottom: 6,
    fontWeight: '700',
  },
  value: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
  },
  titleInput: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    color: COLORS.PRIMARY_DARK,
    fontSize: 14,
  },
  inline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  inlineCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  animatedInputContainer: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    color: COLORS.PRIMARY_DARK,
  },
  sketchContainer: {
    height: 250,
    marginBottom: 12,
  },
  dropdown: {
    flex: 1,
    position: 'relative',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownHeaderText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 14,
  },
  iconButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
