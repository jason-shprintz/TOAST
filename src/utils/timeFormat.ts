/**
 * Utility functions for formatting time based on user's device settings.
 * Automatically detects whether the user prefers 12-hour or 24-hour format.
 */

// Cache the 24-hour format detection result since it rarely changes during app session
let cachedIs24Hour: boolean | null = null;

/**
 * Detects if the user's device is set to use 24-hour time format.
 * This uses the Intl API to check the locale's time formatting preference.
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
    // Use the user's default locale formatting
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: 'numeric',
    });
    
    // Test with 13:00 (1 PM) - a clear indicator time
    // In 12-hour format, this will be "1:xx PM" or similar
    // In 24-hour format, this will be "13:xx" or similar
    const testDate = new Date(2000, 0, 1, 13, 0, 0);
    const formatted = formatter.format(testDate);
    
    // Check if the formatted string contains '13' which only appears in 24-hour format
    // In 12-hour format, it would show '1' with AM/PM markers
    const is24Hour = formatted.includes('13');
    
    cachedIs24Hour = is24Hour;
    return is24Hour;
  } catch (error) {
    // Default to 12-hour format if detection fails
    console.warn('Failed to detect time format preference:', error);
    cachedIs24Hour = false;
    return false;
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
