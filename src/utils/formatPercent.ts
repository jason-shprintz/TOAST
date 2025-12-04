/**
 * Formats the percentage of `used` over `total` as a string with a percent sign.
 *
 * @param used - The numerator value representing the used amount.
 * @param total - The denominator value representing the total amount.
 * @returns The formatted percentage string (e.g., "75%"), or '-' if `total` is zero or negative.
 */
function formatPercent(used: number, total: number) {
  if (!total || total <= 0) return '-';
  return `${Math.round((used / total) * 100)}%`;
}

export default formatPercent;
