/**
 * Utility functions for formatting time based on user's device settings.
 * Automatically detects whether the user prefers 12-hour or 24-hour format.
 */

/**
 * Detects if the user's device is set to use 24-hour time format.
 * This uses the Intl API to check the locale's time formatting preference.
 * 
 * @returns true if the device uses 24-hour format, false for 12-hour format
 */
export function is24HourFormat(): boolean {
  try {
    // Create a date formatter with the user's locale
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
    });
    
    // Format a date at 23:00 (11 PM)
    const testDate = new Date(2000, 0, 1, 23, 0, 0);
    const formatted = formatter.format(testDate);
    
    // If the formatted string contains '23', it's 24-hour format
    // If it contains '11' or 'PM', it's 12-hour format
    return formatted.includes('23');
  } catch (error) {
    // Default to 12-hour format if detection fails
    console.warn('Failed to detect time format preference:', error);
    return false;
  }
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
