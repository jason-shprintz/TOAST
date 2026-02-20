/**
 * Mock for react-native-sensors
 */

export const SensorTypes = {
  accelerometer: 'accelerometer',
  gyroscope: 'gyroscope',
  magnetometer: 'magnetometer',
  barometer: 'barometer',
  orientation: 'orientation',
};

export const setUpdateIntervalForType = jest.fn();

const createSensorMock = () => ({
  subscribe: jest.fn((_next: unknown, _error: unknown) => ({
    unsubscribe: jest.fn(),
  })),
});

export const accelerometer = createSensorMock();
export const gyroscope = createSensorMock();
export const magnetometer = createSensorMock();
export const barometer = createSensorMock();
export const orientation = createSensorMock();
