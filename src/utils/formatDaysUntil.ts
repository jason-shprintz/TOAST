/**
 * Formats the number of days until a future date as a human-readable string.
 *
 * Examples:
 * - "Today"
 * - "Tomorrow"
 * - "In 5 days"
 * - "In ~2 months"
 * - Falls back to a short date string for dates beyond 12 months
 *
 * @param date - The target future date
 * @returns A human-readable countdown string
 */
export function formatDaysUntil(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (24 * 3600 * 1000));
  if (diffDays <= 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays < 30) {
    return `In ${diffDays} days`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `In ~${months} month${months !== 1 ? 's' : ''}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
