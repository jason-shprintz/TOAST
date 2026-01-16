/**
 * Mock for react-native-sqlite-storage
 */

const mockExecuteSql = jest.fn((_query: string, _params?: any[]) => {
  return Promise.resolve([
    { rows: { length: 0, item: () => null, raw: () => [] } },
  ]);
});

const mockTransaction = jest.fn((callback: (tx: any) => void) => {
  const tx = {
    executeSql: (
      query: string,
      params?: any[],
      success?: Function,
      error?: Function,
    ) => {
      try {
        const result = { rows: { length: 0, item: () => null, raw: () => [] } };
        if (success) success(tx, result);
      } catch (e) {
        if (error) error(tx, e);
      }
    },
  };
  callback(tx);
  return Promise.resolve();
});

const mockDatabase = {
  executeSql: mockExecuteSql,
  transaction: mockTransaction,
  close: jest.fn(() => Promise.resolve()),
};

const SQLite = {
  openDatabase: jest.fn(() => Promise.resolve(mockDatabase)),
  deleteDatabase: jest.fn(() => Promise.resolve()),
  enablePromise: jest.fn(),
  DEBUG: jest.fn(),
};

export default SQLite;
