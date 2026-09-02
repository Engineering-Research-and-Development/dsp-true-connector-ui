import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import {
  CUSTOM_DATE_FORMATS,
  CustomDateAdapter,
} from '../../shared/utils/date-adapter.utils';
import {
  DashboardBucket,
  DashboardSummaryResponse,
  KeyCount,
} from '../../models/dashboard';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { DashboardFormatHelper } from '../../shared/utils/dashboard-format.utils';

interface RoleStateRow {
  role: string;
  state: string;
  count: number;
}

const CHART_PALETTE = [
  '#8a9eed',
  '#8b1e74',
  '#4caf93',
  '#f2a541',
  '#e0607e',
  '#5c6bc0',
  '#26a69a',
  '#ab47bc',
];

// Fixed, semantic colors for negotiation/transfer states, shared across both
// pie charts so that states with the same name (e.g. REQUESTED, TERMINATED)
// always render with the same color.
const DASHBOARD_STATE_COLORS: Record<string, string> = {
  COMPLETED: '#4caf50', // green
  FINALIZED: '#4caf50', // green
  TERMINATED: '#e53935', // red
  SUSPENDED: '#fdd835', // yellow
  REQUESTED: '#42a5f5', // blue
  OFFERED: '#8a9eed', // periwinkle (app primary)
  ACCEPTED: '#26a69a', // teal
  AGREED: '#ffa726', // amber
  VERIFIED: '#ab47bc', // purple
  INITIALIZED: '#9e9e9e', // gray
  STARTED: '#5c6bc0', // indigo
};

/**
 * Resolves a fixed, semantic color for a negotiation/transfer state key. Falls
 * back to cycling through the general chart palette for any unmapped state.
 */
function getStateColor(key: string, fallbackIndex: number): string {
  return (
    DASHBOARD_STATE_COLORS[key.toUpperCase()] ??
    CHART_PALETTE[fallbackIndex % CHART_PALETTE.length]
  );
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  loading = false;
  summary: DashboardSummaryResponse | null = null;

  fromDateFilter: Date | null = null;
  toDateFilter: Date | null = null;
  bucket: DashboardBucket = 'hour';

  readonly bucketOptions: DashboardBucket[] = ['hour', 'day'];
  readonly roleStateColumns: string[] = ['role', 'state', 'count'];
  readonly keyCountColumns: string[] = ['key', 'count'];

  negotiationStateChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  transferStateChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  transferFormatChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [],
  };
  eventsTimelineChartData: ChartData<'line'> = { labels: [], datasets: [] };

  readonly pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom' } },
  };

  readonly doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };

  readonly lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    // Multiple event-type series can overlap heavily; showing a combined
    // tooltip for the hovered bucket (rather than requiring a pixel-perfect
    // hover on a single line) makes it possible to actually read the data.
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { boxWidth: 12, boxHeight: 12, padding: 8 },
      },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 12,
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: { beginAtZero: true },
    },
  };

  negotiationRoleStateRows: RoleStateRow[] = [];
  transferRoleStateRows: RoleStateRow[] = [];

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  refresh(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.loading = true;
    this.dashboardService
      .getSummary({
        from: this.fromDateFilter
          ? this.formatDateForAPI(this.fromDateFilter, false)
          : undefined,
        to: this.toDateFilter
          ? this.formatDateForAPI(this.toDateFilter, true)
          : undefined,
        bucket: this.bucket,
      })
      .subscribe({
        next: (summary) => {
          this.summary = summary;
          this.buildViewModel(summary);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching dashboard summary:', error);
          this.snackbarService.openSnackBar(
            'Failed to load dashboard statistics',
            'OK',
            'center',
            'bottom',
            'snackbar-error'
          );
          this.loading = false;
        },
      });
  }

  private buildViewModel(summary: DashboardSummaryResponse): void {
    this.negotiationStateChartData = this.toPieChartData(
      summary.negotiations.countsByState
    );
    this.negotiationRoleStateRows = this.toRoleStateRows(
      summary.negotiations.countsByRoleAndState
    );

    this.transferStateChartData = this.toPieChartData(
      summary.transfers.countsByState
    );
    this.transferRoleStateRows = this.toRoleStateRows(
      summary.transfers.countsByRoleAndState
    );
    this.transferFormatChartData = this.toDoughnutChartData(
      summary.transfers.countsByFormat
    );

    this.eventsTimelineChartData = this.toTimelineChartData(summary);
  }

  private toPieChartData(counts: KeyCount[]): ChartData<'pie'> {
    return {
      labels: counts.map((c) => c.key),
      datasets: [
        {
          data: counts.map((c) => c.count),
          backgroundColor: counts.map((c, i) => getStateColor(c.key, i)),
        },
      ],
    };
  }

  private toDoughnutChartData(counts: KeyCount[]): ChartData<'doughnut'> {
    return {
      labels: counts.map((c) => c.key),
      datasets: [
        {
          data: counts.map((c) => c.count),
          backgroundColor: counts.map(
            (_, i) => CHART_PALETTE[i % CHART_PALETTE.length]
          ),
        },
      ],
    };
  }

  private toTimelineChartData(
    summary: DashboardSummaryResponse
  ): ChartData<'line'> {
    const buckets = Array.from(
      new Set(summary.events.countsOverTime.map((c) => c.bucketStart))
    ).sort();
    const eventTypes = Array.from(
      new Set(summary.events.countsOverTime.map((c) => c.key))
    );

    const datasets = eventTypes.map((eventType, index) => ({
      label: eventType,
      data: buckets.map((bucketStart) => {
        const match = summary.events.countsOverTime.find(
          (c) => c.bucketStart === bucketStart && c.key === eventType
        );
        return match ? match.count : 0;
      }),
      borderColor: CHART_PALETTE[index % CHART_PALETTE.length],
      backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length],
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: false,
    }));

    return {
      labels: buckets.map((b) => this.formatTimelineLabel(b)),
      datasets,
    };
  }

  /**
   * Formats a bucket timestamp as a short, non-overlapping axis label (e.g.
   * "Sep 24" for day buckets, "Sep 24, 2:00 AM" for hour buckets) instead of
   * the full locale date-time string.
   */
  private formatTimelineLabel(bucketStart: string): string {
    const date = new Date(bucketStart);
    const isMidnight = date.getHours() === 0 && date.getMinutes() === 0;
    return isMidnight
      ? new Intl.DateTimeFormat(undefined, {
          month: 'short',
          day: 'numeric',
        }).format(date)
      : new Intl.DateTimeFormat(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(date);
  }

  private toRoleStateRows(counts: KeyCount[]): RoleStateRow[] {
    return counts.map((c) => {
      const { role, state } = DashboardFormatHelper.splitRoleStateKey(c.key);
      return { role, state, count: c.count };
    });
  }

  formatCpuRatio(value: number): string {
    return DashboardFormatHelper.formatCpuRatio(value);
  }

  /**
   * These flags drive the "Select period to show ... data" empty-state
   * messages so charts/tables don't render blank when a window has no data.
   */
  get hasNegotiationsData(): boolean {
    return !!this.summary && this.summary.negotiations.countsByState.length > 0;
  }

  get hasTransfersData(): boolean {
    return !!this.summary && this.summary.transfers.countsByState.length > 0;
  }

  get hasEventsData(): boolean {
    return !!this.summary && this.summary.events.countsOverTime.length > 0;
  }

  /**
   * Resolves the semantic color for a negotiation/transfer state (exposed
   * publicly so it can be unit tested directly).
   */
  getStateColor(key: string): string {
    return getStateColor(key, 0);
  }

  formatBytes(value: number): string {
    return DashboardFormatHelper.formatBytes(value);
  }

  formatUptime(uptimeMilliseconds: number): string {
    if (uptimeMilliseconds < 0) {
      return 'N/A';
    }
    const totalSeconds = Math.floor(uptimeMilliseconds / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  /**
   * Format date for API request (UTC ISO format), mirroring the audit trail's
   * date filter convention: start-of-day for the "from" bound, end-of-day for
   * the "to" bound.
   */
  private formatDateForAPI(date: Date, isEndDate: boolean): string {
    const apiDate = new Date(date);
    if (isEndDate) {
      apiDate.setHours(23, 59, 59, 999);
    } else {
      apiDate.setHours(0, 0, 0, 0);
    }
    return apiDate.toISOString();
  }
}
