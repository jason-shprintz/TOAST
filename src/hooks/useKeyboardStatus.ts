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

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardHeight(event.endCoordinates.height / 2);
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return { isKeyboardVisible, keyboardHeight };
}
