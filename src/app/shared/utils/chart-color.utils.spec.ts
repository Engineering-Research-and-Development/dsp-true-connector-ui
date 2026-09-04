import { ChartColorHelper } from './chart-color.utils';

describe('ChartColorHelper', () => {
  it('should return an empty array for a count of zero or less', () => {
    expect(ChartColorHelper.generateDistinctColors(0)).toEqual([]);
    expect(ChartColorHelper.generateDistinctColors(-1)).toEqual([]);
  });

  it('should return exactly `count` colors', () => {
    expect(ChartColorHelper.generateDistinctColors(3).length).toBe(3);
    expect(ChartColorHelper.generateDistinctColors(30).length).toBe(30);
  });

  it('should return unique colors for every entry, regardless of count', () => {
    for (const count of [3, 8, 15, 30]) {
      const colors = ChartColorHelper.generateDistinctColors(count);
      expect(new Set(colors).size).toBe(count);
    }
  });

  it('should be deterministic across calls', () => {
    const first = ChartColorHelper.generateDistinctColors(10);
    const second = ChartColorHelper.generateDistinctColors(10);
    expect(first).toEqual(second);
  });
});
