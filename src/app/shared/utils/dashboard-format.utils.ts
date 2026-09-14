/**
 * Formatting helpers for the statistics dashboard (CPU ratios, byte sizes, and
 * combined "ROLE:STATE" keys returned by the dashboard API).
 */
export class DashboardFormatHelper {
  static readonly BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

  /**
   * Formats a CPU usage ratio (0..1) as a rounded percentage string.
   * A negative value (e.g. -1) indicates the metric is unavailable.
   */
  static formatCpuRatio(value: number): string {
    if (value < 0) {
      return 'N/A';
    }
    return `${Math.round(value * 100)}%`;
  }

  /**
   * Formats a raw byte count into a human-readable string (B/KB/MB/GB/TB).
   * A negative value indicates the metric is unavailable.
   */
  static formatBytes(value: number): string {
    if (value < 0) {
      return 'N/A';
    }

    const units = DashboardFormatHelper.BYTE_UNITS;
    let size = value;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
  }

  /**
   * Splits a combined "ROLE:STATE" key (e.g. "CONSUMER:REQUESTED") into its
   * role and state parts.
   */
  static splitRoleStateKey(key: string): { role: string; state: string } {
    const [role, state] = key.split(':');
    return { role, state };
  }
}
