import {
  MAT_DATE_FORMATS,
  NativeDateAdapter,
} from '@angular/material/core';

/**
 * Custom date adapter forcing DD/MM/YYYY display in mat-datepicker fields
 * (shared across components that use a "From Date"/"To Date" filter, e.g.
 * audit trail and the statistics dashboard).
 */
export class CustomDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return date.toDateString();
  }

  override parse(value: any): Date | null {
    if (typeof value === 'string' && value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-based
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    return super.parse(value);
  }
}

export const CUSTOM_DATE_FORMATS = {
  parse: {
    dateInput: 'input',
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};
