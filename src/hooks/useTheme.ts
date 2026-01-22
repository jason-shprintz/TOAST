import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores';
import { ThemeMode } from '../stores/SettingsStore';
import { LIGHT_COLORS, DARK_COLORS, ColorScheme } from '../theme/colors';

/**
 * Helper function to select the appropriate color scheme based on theme mode and system preference
 */
function getColorSchemeForThemeMode(
  themeMode: ThemeMode,
  systemColorScheme: 'light' | 'dark' | null | undefined
): ColorScheme {
  if (themeMode === 'light') {
    return LIGHT_COLORS;
  } else if (themeMode === 'dark') {
    return DARK_COLORS;
  } else {
    return systemColorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }
}

/**
 * Hook that provides the current theme colors based on the user's theme mode setting.
 * 
 * - If theme mode is 'light', returns light colors
 * - If theme mode is 'dark', returns dark colors
 * - If theme mode is 'system', returns colors based on system color scheme
 * 
 * @returns The current color scheme object
 */
export function useTheme(): ColorScheme {
  const settingsStore = useSettingsStore();
  const systemColorScheme = useColorScheme();
  const [colors, setColors] = useState<ColorScheme>(() =>
    getColorSchemeForThemeMode(settingsStore.themeMode, systemColorScheme)
  );

  useEffect(() => {
    const newColors = getColorSchemeForThemeMode(
      settingsStore.themeMode,
      systemColorScheme
    );
    setColors(newColors);
  }, [settingsStore.themeMode, systemColorScheme]);

  return colors;
}
