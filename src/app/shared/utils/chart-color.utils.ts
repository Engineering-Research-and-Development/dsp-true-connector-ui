/**
 * Helper for generating chart colors that are guaranteed to be visually
 * distinct regardless of how many entries need coloring.
 */
export class ChartColorHelper {
  /**
   * Generates `count` distinct, deterministic HSL colors by spreading hues
   * evenly around the color wheel (360 / count degrees apart). Unlike
   * cycling through a fixed hardcoded palette, this never wraps around and
   * repeats a color, no matter how large `count` is.
   */
  static generateDistinctColors(count: number): string[] {
    if (count <= 0) {
      return [];
    }

    const saturation = 65;
    const lightness = 50;
    const hueStep = 360 / count;

    return Array.from({ length: count }, (_, index) => {
      const hue = Math.round(index * hueStep);
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });
  }
}
