import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export type KeyboardStatus = {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
};

/**
 * React Native hook that tracks whether the on-screen keyboard is visible and what its current height is.
 *
 * Listens to `keyboardDidShow` and `keyboardDidHide` events and updates:
 * - `isKeyboardVisible` to reflect visibility state
 * - `keyboardHeight` to `event.endCoordinates.height` when shown and `0` when hidden
 *
 * @returns An object containing:
 * - `isKeyboardVisible` - `true` when the keyboard is visible, otherwise `false`.
 * - `keyboardHeight` - The keyboard height in pixels when visible, otherwise `0`.
 */
export function useKeyboardStatus(): KeyboardStatus {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardHeightOffset = 2;

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height / keyboardHeightOffset);
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  return { isKeyboardVisible, keyboardHeight };
}
