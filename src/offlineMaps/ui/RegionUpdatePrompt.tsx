/**
 * Region Update Prompt Component
 * Shows when user has moved outside their offline region
 * @format
 */

import React, { useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import { Text } from '../../components/ScaledText';
import { useTheme } from '../../hooks/useTheme';

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
  const COLORS = useTheme();

  // Create dynamic styles using theme colors
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          ...styles.content,
          backgroundColor: COLORS.BACKGROUND,
        },
        title: {
          ...styles.title,
          color: COLORS.PRIMARY_DARK,
        },
        message: {
          ...styles.message,
          color: COLORS.PRIMARY_DARK,
        },
        primaryButton: {
          ...styles.primaryButton,
          backgroundColor: COLORS.SECONDARY_ACCENT,
        },
        primaryButtonText: {
          ...styles.primaryButtonText,
          color: COLORS.PRIMARY_LIGHT,
        },
        secondaryButton: {
          ...styles.secondaryButton,
          borderColor: COLORS.PRIMARY_DARK,
        },
        secondaryButtonText: {
          ...styles.secondaryButtonText,
          color: COLORS.PRIMARY_DARK,
        },
      }),
    [COLORS],
  );

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
          <View style={dynamicStyles.content}>
            <Text style={dynamicStyles.title}>Update Offline Map Area?</Text>
            <Text style={dynamicStyles.message}>
              You've moved outside your downloaded offline map region. Download
              a new region centered on your current location?
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, dynamicStyles.secondaryButton]}
                onPress={onDismiss}
                activeOpacity={0.7}
                accessibilityLabel="Dismiss region update prompt"
              >
                <Text style={dynamicStyles.secondaryButtonText}>Not Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, dynamicStyles.primaryButton]}
                onPress={onAccept}
                activeOpacity={0.7}
                accessibilityLabel="Update offline map region"
              >
                <Text style={dynamicStyles.primaryButtonText}>
                  Update Region
                </Text>
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
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
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
  primaryButton: {},
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
