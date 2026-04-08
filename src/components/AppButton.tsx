import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { Text } from './ScaledText';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'success';

export interface AppButtonProps {
  /** Button label text */
  label: string;
  /** Called when the button is pressed */
  onPress: () => void;
  /**
   * Visual variant of the button.
   * - `primary`     — brand accent (orange) background
   * - `secondary`   — bordered, light background
   * - `destructive` — error/red background
   * - `success`     — green background
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /** Optional Ionicons icon name to display before the label */
  icon?: string;
  /** Size for the icon. @default 20 */
  iconSize?: number;
  /** When true, the button is non-interactive and visually dimmed */
  disabled?: boolean;
  /** Additional layout/positioning styles applied to the button container */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label; falls back to `label` if omitted */
  accessibilityLabel?: string;
}

/**
 * Canonical action button used throughout the app.
 *
 * Provides four consistent variants (primary, secondary, destructive, success)
 * with a uniform border-radius, padding, and typography so that all action
 * buttons share the same visual identity regardless of screen.
 *
 * @example
 * ```tsx
 * <AppButton label="Save" onPress={handleSave} />
 * <AppButton label="Cancel" onPress={handleCancel} variant="secondary" />
 * <AppButton label="Delete" onPress={handleDelete} variant="destructive" icon="trash-outline" />
 * <AppButton label="Start" onPress={handleStart} variant="success" icon="play" />
 * ```
 */
export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconSize = 20,
  disabled = false,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const COLORS = useTheme();

  const containerStyle = (() => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: COLORS.ACCENT };
      case 'secondary':
        return { backgroundColor: COLORS.PRIMARY_LIGHT };
      case 'destructive':
        return { backgroundColor: COLORS.ERROR };
      case 'success':
        return { backgroundColor: COLORS.SUCCESS };
    }
  })();

  const textColor = (() => {
    switch (variant) {
      case 'primary':
        return COLORS.PRIMARY_DARK;
      case 'secondary':
        return COLORS.PRIMARY_DARK;
      case 'destructive':
        return COLORS.PRIMARY_LIGHT;
      case 'success':
        return COLORS.PRIMARY_LIGHT;
    }
  })();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        containerStyle,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {icon ? <Icon name={icon} size={iconSize} color={textColor} /> : null}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
