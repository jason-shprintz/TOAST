/**
 * Region Update Prompt Component
 * Shows when user has moved outside their offline region
 * @format
 */

import React from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import { Text } from '../../components/ScaledText';
import { COLORS } from '../../theme';

export interface RegionUpdatePromptProps {
  visible: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

/**
 * Modal prompt for updating offline region
 */
export default function RegionUpdatePrompt({
  visible,
  onAccept,
  onDismiss,
}: RegionUpdatePromptProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable
          style={styles.container}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Update Offline Map Area?</Text>
            <Text style={styles.message}>
              You've moved outside your downloaded offline map region. Download
              a new region centered on your current location?
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onDismiss}
                activeOpacity={0.7}
                accessibilityLabel="Dismiss region update prompt"
              >
                <Text style={styles.secondaryButtonText}>Not Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onAccept}
                activeOpacity={0.7}
                accessibilityLabel="Update offline map region"
              >
                <Text style={styles.primaryButtonText}>Update Region</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
  },
  content: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.SECONDARY_ACCENT,
  },
  primaryButtonText: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY_DARK,
  },
  secondaryButtonText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 16,
    fontWeight: '600',
  },
});
