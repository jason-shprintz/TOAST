/**
 * Utility functions for formatting time based on user's device settings.
 * Automatically detects whether the user prefers 12-hour or 24-hour format.
 */

import DeviceInfo from 'react-native-device-info';

// Cache the 24-hour format detection result since it rarely changes during app session
let cachedIs24Hour: boolean | null = null;

/**
 * Detects if the user's device is set to use 24-hour time format.
 * This uses react-native-device-info to check the device's time format setting.
 * The result is cached for performance.
 * 
 * @returns true if the device uses 24-hour format, false for 12-hour format
 */
export function is24HourFormat(): boolean {
  // Return cached value if available
  if (cachedIs24Hour !== null) {
    return cachedIs24Hour;
  }

  try {
    // Use DeviceInfo.is24Hour() to get the device's actual 24-hour setting
    const is24Hour = DeviceInfo.is24Hour();
    cachedIs24Hour = is24Hour;
    return is24Hour;
  } catch (error) {
    // Fallback: try to detect from locale formatting
    try {
      const formatter = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: 'numeric',
      });
      
      const testDate = new Date(2000, 0, 1, 13, 0, 0);
      const formatted = formatter.format(testDate);
      
      const is24Hour = formatted.includes('13');
      cachedIs24Hour = is24Hour;
      return is24Hour;
    } catch (fallbackError) {
      // Default to 12-hour format if all detection fails
      console.warn('Failed to detect time format preference:', error, fallbackError);
      cachedIs24Hour = false;
      return false;
    }
  }
}

/**
 * Resets the cached 24-hour format detection.
 * Call this if the user's locale preference changes during the app session.
 */
export function resetTimeFormatCache(): void {
  cachedIs24Hour = null;
}

/**
 * Formats a date to a time string respecting the user's device 24-hour preference.
 * 
 * @param date - The date to format
 * @returns Formatted time string (e.g., "6:30 AM" or "06:30")
 */
export function formatTime(date: Date): string {
  const use24Hour = is24HourFormat();
  
  return date.toLocaleTimeString(undefined, {
    hour: use24Hour ? '2-digit' : 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
  });
}

/**
 * Formats a date to a full datetime string respecting the user's device 24-hour preference.
 * 
 * @param date - The date to format
 * @returns Formatted datetime string (e.g., "1/15/2024, 6:30 AM" or "1/15/2024, 06:30")
 */
export function formatDateTime(date: Date): string {
  const use24Hour = is24HourFormat();
  
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: use24Hour ? '2-digit' : 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
  });
}
