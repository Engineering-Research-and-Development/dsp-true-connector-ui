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

  negotiationStateChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  transferStateChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  transferFormatChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [],
  };
  eventsTimelineChartData: ChartData<'line'> = { labels: [], datasets: [] };

  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  readonly doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };

  readonly lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
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
    this.negotiationStateChartData = this.toBarChartData(
      summary.negotiations.countsByState
    );
    this.negotiationRoleStateRows = this.toRoleStateRows(
      summary.negotiations.countsByRoleAndState
    );

    this.transferStateChartData = this.toBarChartData(
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

  private toBarChartData(counts: KeyCount[]): ChartData<'bar'> {
    return {
      labels: counts.map((c) => c.key),
      datasets: [
        {
          label: 'Count',
          data: counts.map((c) => c.count),
          backgroundColor: CHART_PALETTE[0],
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
      fill: false,
    }));

    return {
      labels: buckets.map((b) => new Date(b).toLocaleString()),
      datasets,
    };
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
