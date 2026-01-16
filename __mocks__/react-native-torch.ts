/**
 * Mock for react-native-torch
 */

const Torch = {
  switchState: jest.fn(() => Promise.resolve()),
};

export default Torch;
