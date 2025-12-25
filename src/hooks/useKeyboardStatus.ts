import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export type KeyboardStatus = {
  isKeyboardVisible: boolean;
};

/**
 * Custom React hook that tracks the visibility status of the keyboard.
 *
 * Listens for keyboard show and hide events, updating the `isVisible` state accordingly.
 * Useful for adapting UI components when the keyboard appears or disappears.
 *
 * @returns {KeyboardStatus} An object containing the `isVisible` boolean indicating whether the keyboard is currently visible.
 */
export function useKeyboardStatus(): KeyboardStatus {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  return { isKeyboardVisible };
}
