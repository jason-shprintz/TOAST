module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|uuid|react-native-sensors|react-native-maps)/)',
  ],
  moduleNameMapper: {
    '@react-native-async-storage/async-storage':
      '<rootDir>/__mocks__/@react-native-async-storage/async-storage.ts',
    '@react-native-clipboard/clipboard':
      '<rootDir>/__mocks__/@react-native-clipboard/clipboard.ts',
    'react-native-fs': '<rootDir>/__mocks__/react-native-fs.ts',
    'react-native-maps': '<rootDir>/__mocks__/react-native-maps.tsx',
  },
};
