import { observer } from 'mobx-react-lite';
import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useSettingsStore } from '../stores';

/**
 * Custom Text component that automatically scales font size based on user settings.
 * This component wraps the React Native Text component and applies the font scale
 * from the SettingsStore to any fontSize styles.
 */
export const Text = observer((props: TextProps) => {
  const settingsStore = useSettingsStore();
  const { style, ...otherProps } = props;

  // Apply font scaling to any fontSize in the style
  const scaledStyle = React.useMemo(() => {
    if (!style) return style;

    const flatStyle = StyleSheet.flatten(style);
    if (flatStyle && typeof flatStyle.fontSize === 'number') {
      return {
        ...flatStyle,
        fontSize: flatStyle.fontSize * settingsStore.fontScale,
      };
    }
    return style;
  }, [style, settingsStore.fontScale]);

  return <RNText {...otherProps} style={scaledStyle} />;
});
