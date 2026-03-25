/**
 * Mock for @react-native-clipboard/clipboard
 */

const Clipboard = {
  setString: jest.fn(),
  getString: jest.fn(() => Promise.resolve('')),
  hasString: jest.fn(() => Promise.resolve(false)),
};

export default Clipboard;
