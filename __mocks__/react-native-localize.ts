/**
 * Mock for react-native-localize
 */

export const uses24HourClock = jest.fn(() => false);
export const getLocales = jest.fn(() => [
  { countryCode: 'US', languageTag: 'en-US', languageCode: 'en', isRTL: false },
]);
export const getNumberFormatSettings = jest.fn(() => ({
  decimalSeparator: '.',
  groupingSeparator: ',',
}));
export const getCalendar = jest.fn(() => 'gregorian');
export const getCountry = jest.fn(() => 'US');
export const getCurrencies = jest.fn(() => ['USD']);
export const getTemperatureUnit = jest.fn(() => 'fahrenheit');
export const getTimeZone = jest.fn(() => 'America/New_York');
export const findBestLanguageTag = jest.fn(() => ({
  languageTag: 'en-US',
  isRTL: false,
}));

export default {
  uses24HourClock,
  getLocales,
  getNumberFormatSettings,
  getCalendar,
  getCountry,
  getCurrencies,
  getTemperatureUnit,
  getTimeZone,
  findBestLanguageTag,
};
