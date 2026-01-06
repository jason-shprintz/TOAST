import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  Text as RNText,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

type HelpSection = 'what' | 'how' | 'privacy' | 'terms' | 'contact';

interface AccordionItem {
  id: HelpSection;
  title: string;
  content: string;
}

/**
 * Help modal component that overlays on top of the app.
 * Displays help topics in an accordion menu format.
 * When a topic is clicked, it expands to show content and collapses any other open topics.
 * 
 * Note: Uses React Native's Text directly to avoid scaling issues in the help UI.
 */

// No-op handler to prevent backdrop touch from propagating
const preventClose = () => {};

export const HelpModal = ({ visible, onClose }: HelpModalProps) => {
  const [expandedSection, setExpandedSection] = useState<HelpSection | null>(null);

  const helpSections: AccordionItem[] = [
    {
      id: 'what',
      title: 'What is TOAST',
      content:
        'TOAST (Tactical Operations And Survival Toolkit) is a comprehensive mobile application designed to assist users in various tactical and survival situations. It provides essential tools, references, and utilities in one convenient package.',
    },
    {
      id: 'how',
      title: 'How to use',
      content:
        'Navigate through TOAST using the intuitive menu system. Access different tools and features from the home screen. Swipe left or right to navigate between screens. Tap on any tool to open it. Use the settings button (top right) to customize your experience.',
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      content:
        'Your privacy is important to us. TOAST operates primarily offline and does not collect or transmit personal data without your explicit consent. Any data stored is kept locally on your device. For more details, please contact us at info@toastbyte.studio.',
    },
    {
      id: 'terms',
      title: 'Terms of Use',
      content:
        'By using TOAST, you agree to use this application responsibly and in accordance with all applicable laws. This application is provided "as-is" without warranties of any kind. The developers are not liable for any decisions made based on information provided by this app. For complete terms, contact info@toastbyte.studio.',
    },
    {
      id: 'contact',
      title: 'Contact',
      content:
        'Have questions, feedback, or need support? Reach out to us at:\n\ninfo@toastbyte.studio\n\nWe welcome your suggestions and are here to help!',
    },
  ];

  const handleSectionPress = (sectionId: HelpSection) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback
        onPress={onClose}
        accessibilityLabel="Close help modal"
        accessibilityRole="button"
        accessibilityHint="Tap to dismiss the help"
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={preventClose}>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <RNText style={styles.headerText}>Help</RNText>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  accessibilityLabel="Close help"
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="close-outline"
                    size={28}
                    color={COLORS.PRIMARY_DARK}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                {helpSections.map(section => (
                  <View key={section.id} style={styles.accordionItem}>
                    <TouchableOpacity
                      style={[
                        styles.accordionHeader,
                        expandedSection === section.id &&
                          styles.accordionHeaderExpanded,
                      ]}
                      onPress={() => handleSectionPress(section.id)}
                      accessibilityLabel={`${section.title} ${expandedSection === section.id ? 'expanded' : 'collapsed'}`}
                      accessibilityRole="button"
                      accessibilityHint={`Tap to ${expandedSection === section.id ? 'collapse' : 'expand'} ${section.title}`}
                    >
                      <RNText style={styles.accordionTitle}>
                        {section.title}
                      </RNText>
                      <Ionicons
                        name={
                          expandedSection === section.id
                            ? 'chevron-up-outline'
                            : 'chevron-down-outline'
                        }
                        size={24}
                        color={COLORS.PRIMARY_DARK}
                      />
                    </TouchableOpacity>
                    {expandedSection === section.id && (
                      <View style={styles.accordionContent}>
                        <RNText style={styles.accordionText}>
                          {section.content}
                        </RNText>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 500,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.TOAST_BROWN,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.TOAST_BROWN,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.PRIMARY_DARK,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  accordionItem: {
    marginBottom: 12,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
    backgroundColor: COLORS.BACKGROUND,
  },
  accordionHeaderExpanded: {
    backgroundColor: COLORS.TOAST_BROWN,
    borderColor: COLORS.PRIMARY_DARK,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
    flex: 1,
  },
  accordionContent: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.TOAST_BROWN,
  },
  accordionText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.PRIMARY_DARK,
  },
});
