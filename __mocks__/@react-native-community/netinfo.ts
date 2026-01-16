/**
 * Mock for @react-native-community/netinfo
 */

const defaultState = {
  type: 'wifi',
  isConnected: true,
  isInternetReachable: true,
  details: {
    isConnectionExpensive: false,
  },
};

const NetInfo = {
  addEventListener: jest.fn(
    (callback: (state: typeof defaultState) => void) => {
      // Immediately call with default state
      callback(defaultState);
      // Return unsubscribe function
      return jest.fn();
    },
  ),
  fetch: jest.fn(() => Promise.resolve(defaultState)),
  refresh: jest.fn(() => Promise.resolve(defaultState)),
  configure: jest.fn(),
  useNetInfo: jest.fn(() => defaultState),
};

export default NetInfo;
export type NetInfoState = typeof defaultState;
export type NetInfoSubscription = () => void;
