import { DashboardFormatHelper } from './dashboard-format.utils';

describe('DashboardFormatHelper', () => {
  describe('formatCpuRatio', () => {
    it('should format a ratio as a rounded percentage', () => {
      expect(DashboardFormatHelper.formatCpuRatio(0.37)).toBe('37%');
      expect(DashboardFormatHelper.formatCpuRatio(0)).toBe('0%');
      expect(DashboardFormatHelper.formatCpuRatio(1)).toBe('100%');
    });

    it('should return N/A for negative values', () => {
      expect(DashboardFormatHelper.formatCpuRatio(-1)).toBe('N/A');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes into the smallest matching unit', () => {
      expect(DashboardFormatHelper.formatBytes(0)).toBe('0.0 B');
      expect(DashboardFormatHelper.formatBytes(1024)).toBe('1.0 KB');
    });

    it('should convert heap-sized values to MB/GB', () => {
      expect(DashboardFormatHelper.formatBytes(402653184)).toBe('384 MB');
      expect(DashboardFormatHelper.formatBytes(1073741824)).toBe('1.0 GB');
    });

    it('should return N/A for negative values', () => {
      expect(DashboardFormatHelper.formatBytes(-1)).toBe('N/A');
    });
  });

  describe('splitRoleStateKey', () => {
    it('should split a combined role/state key', () => {
      expect(DashboardFormatHelper.splitRoleStateKey('CONSUMER:REQUESTED')).toEqual({
        role: 'CONSUMER',
        state: 'REQUESTED',
      });
      expect(DashboardFormatHelper.splitRoleStateKey('PROVIDER:STARTED')).toEqual({
        role: 'PROVIDER',
        state: 'STARTED',
      });
    });
  });
});
