import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import LogoHeader from '../../components/LogoHeader';
import SectionHeader from '../../components/SectionHeader';
import { COLORS } from '../../theme';
import { observer } from 'mobx-react-lite';
import { useCoreStore } from '../../stores';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useKeyboardStatus } from '../../hooks/useKeyboardStatus';

export default observer(function NewNoteScreen() {
  const core = useCoreStore();
  const navigation = useNavigation();
  const [text, setText] = useState('');
  const [category, setCategory] = useState(core.categories[0]);
  const [noteType, setNoteType] = useState<'text' | 'sketch'>('text');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const { isVisible } = useKeyboardStatus();
  const keyboardVisibleHook = isVisible;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.innerContainer}>
            <View style={styles.logoCenter}>
              <LogoHeader />
            </View>
            <SectionHeader>New Note</SectionHeader>
            <View style={styles.card}>
              <View style={styles.inlineCenter}>
                <View style={styles.dropdown}>
                  <TouchableOpacity
                    style={styles.dropdownHeader}
                    onPress={() => setShowCategoryMenu(v => !v)}
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
                  >
                    <Text style={styles.dropdownHeaderText}>
                      {noteType === 'text' ? 'Type Text' : 'Sketch'}
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
                            {t === 'text' ? 'Type Text' : 'Sketch'}
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
                >
                  <Icon
                    name="camera-outline"
                    size={22}
                    color={COLORS.PRIMARY_DARK}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>
                {noteType === 'text' ? 'Type Text' : 'Sketch'}
              </Text>
              <TextInput
                style={
                  keyboardVisibleHook ? styles.inputSmall : styles.inputLarge
                }
                placeholder="Type your note..."
                multiline
                value={text}
                onChangeText={setText}
              />

              <View style={styles.inline}>
                <Button
                  title="Save Note"
                  onPress={() => {
                    core.createNote({ type: noteType, text, category });
                    // Return to previous screen (Notepad)
                    // Prefer goBack to avoid hard-coding route names
                    if (navigation && 'goBack' in navigation) {
                      // @ts-ignore
                      navigation.goBack();
                    }
                  }}
                />
                <Button
                  title="Clear Note"
                  onPress={() => {
                    setText('');
                  }}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenContainer>
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
    width: '100%',
    backgroundColor: COLORS.TOAST_BROWN,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 12,
    overflow: 'scroll',
  },
  logoCenter: {
    alignItems: 'center',
    width: '100%',
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
  inputSmall: {
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    color: COLORS.PRIMARY_DARK,
  },
  inputLarge: {
    height: 250,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    color: COLORS.PRIMARY_DARK,
  },
  dropdown: {
    flex: 1,
    position: 'relative',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.06)',
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
    backgroundColor: 'white',
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
  sketchBox: {
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  photoBox: {
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
});
