/**
 * Mock for react-native-fs
 */

const RNFS = {
  CachesDirectoryPath: '/tmp/cache',
  DocumentDirectoryPath: '/tmp/documents',
  DownloadDirectoryPath: '/tmp/downloads',
  writeFile: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve('')),
  readDir: jest.fn(() => Promise.resolve([])),
  exists: jest.fn(() => Promise.resolve(false)),
  unlink: jest.fn(() => Promise.resolve()),
  mkdir: jest.fn(() => Promise.resolve()),
  moveFile: jest.fn(() => Promise.resolve()),
  copyFile: jest.fn(() => Promise.resolve()),
  stat: jest.fn(() => Promise.resolve({ size: 0, isDirectory: () => false })),
};

export default RNFS;
