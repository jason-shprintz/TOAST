/**
 * Converts a byte value into a human-readable string with appropriate units.
 *
 * @param bytes - The number of bytes to format. If `null`, `undefined`, or negative, returns `'Unknown'`.
 * @returns A formatted string representing the size in B, KB, MB, GB, or TB.
 */
function formatBytes(bytes: number | null | undefined) {
  if (!bytes || bytes < 0) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let b = bytes;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  return `${b.toFixed(1)} ${units[i]}`;
}

export default formatBytes;
