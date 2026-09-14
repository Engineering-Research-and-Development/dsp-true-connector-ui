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
import { MatExpansionModule } from '@angular/material/expansion';
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
import { AuditService } from '../../services/audit/audit.service';
import { AuditEventType } from '../../models/auditEventType';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { DashboardFormatHelper } from '../../shared/utils/dashboard-format.utils';
import { ChartColorHelper } from '../../shared/utils/chart-color.utils';
import { UserService } from '../../services/user/user.service';
import { TenantService } from '../../services/tenant/tenant.service';
import { Tenant } from '../../models/tenant';
import { UserRole } from '../../models/enums/user-role.enum';
import {
  FilterExpansionState,
  PaginationHelper,
} from '../../shared/utils/pagination.utils';

// Key used to persist the SUPER_ADMIN's selected tenant scope across reloads.
const SELECTED_TENANT_STORAGE_KEY = 'dashboardSelectedTenantId';

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
    MatExpansionModule,
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

  /** Upper bound for the From Date picker: it cannot be later than To Date. */
  get maxFromDate(): Date | null {
    return this.toDateFilter;
  }

  /** Lower bound for the To Date picker: it cannot be earlier than From Date. */
  get minToDate(): Date | null {
    return this.fromDateFilter;
  }

  readonly bucketOptions: DashboardBucket[] = ['hour', 'day'];
  readonly roleStateColumns: string[] = ['role', 'state', 'count'];
  readonly keyCountColumns: string[] = ['key', 'count'];

  filterExpansionState: FilterExpansionState =
    PaginationHelper.createFilterExpansionState(false);

  negotiationStateChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  transferStateChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  transferFormatChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [],
  };
  eventsTimelineChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  readonly pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom' } },
  };

  readonly doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };

  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    // Multiple event-type series can overlap heavily; showing a combined
    // tooltip for the hovered bucket (rather than requiring a pixel-perfect
    // hover on a single bar) makes it possible to actually read the data.
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

  isSuperAdmin = false;
  tenants: Tenant[] = [];
  selectedTenantId: string | null = null;

  /** Code -> description lookup for audit event types, used to render
   * human-readable event names (e.g. "Application login" instead of
   * "APPLICATION_LOGIN") in the Event Type table and events-over-time
   * chart. Populated once on init; falls back to the raw code if the
   * lookup fails or a code is unmapped. */
  eventTypes: AuditEventType[] = [];

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly snackbarService: SnackbarService,
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
    private readonly auditService: AuditService
  ) {}

  ngOnInit(): void {
    this.loadEventTypes();
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
        if (this.isSuperAdmin) {
          this.loadTenants();
        } else {
          this.loadSummary();
        }
      },
      error: (error) => {
        console.error('Error fetching current user:', error);
        this.loadSummary();
      },
    });
  }

  /**
   * Loads the audit event type list (code -> description) used to render
   * human-readable event names. This is a static/global reference list, not
   * scoped by date range or tenant, so it's loaded once and independently of
   * the summary data. Failures are silently ignored: display falls back to
   * raw event codes via `getEventTypeDisplayName`.
   */
  private loadEventTypes(): void {
    this.auditService.getAuditEventTypes().subscribe({
      next: (eventTypes) => {
        this.eventTypes = eventTypes;
        // If the summary already loaded before this resolved, rebuild the
        // view model so event-type labels pick up the friendly names
        // instead of staying stuck on the raw codes used as a fallback.
        if (this.summary) {
          this.buildViewModel(this.summary);
        }
      },
      error: (error) => {
        console.error('Error fetching audit event types:', error);
      },
    });
  }

  /**
   * Resolves the human-readable name for an event type code (e.g.
   * "APPLICATION_LOGIN" -> "Application login"), falling back to the raw
   * code if it isn't found in the fetched event type list.
   */
  getEventTypeDisplayName(code: string): string {
    const eventType = this.eventTypes.find((type) => type.code === code);
    return eventType ? eventType.description : code;
  }

  /**
   * Loads the tenant list for the SUPER_ADMIN tenant selector, restoring a
   * previously persisted selection if it still refers to an existing tenant.
   */
  private loadTenants(): void {
    this.tenantService.getAllTenantsList().subscribe({
      next: (tenants) => {
        this.tenants = tenants;
        const storedTenantId = localStorage.getItem(
          SELECTED_TENANT_STORAGE_KEY
        );
        this.selectedTenantId =
          storedTenantId && tenants.some((t) => t.id === storedTenantId)
            ? storedTenantId
            : null;
        this.loadSummary();
      },
      error: (error) => {
        console.error('Error fetching tenants:', error);
        this.loadSummary();
      },
    });
  }

  /**
   * Handles a tenant selection change from the SUPER_ADMIN dropdown: persists
   * the choice and immediately reloads the dashboard scoped to it (or to all
   * tenants when "All Tenants" is selected).
   */
  onTenantChange(): void {
    if (this.selectedTenantId) {
      localStorage.setItem(SELECTED_TENANT_STORAGE_KEY, this.selectedTenantId);
    } else {
      localStorage.removeItem(SELECTED_TENANT_STORAGE_KEY);
    }
    this.loadSummary();
  }

  refresh(): void {
    this.loadSummary();
  }

  /**
   * Resets all dashboard filters (date range, bucket, tenant) to their
   * defaults, clears any persisted tenant selection, and reloads the
   * summary — mirroring User Management's Clear Filters behavior.
   */
  clearFilters(): void {
    this.fromDateFilter = null;
    this.toDateFilter = null;
    this.bucket = 'hour';
    this.selectedTenantId = null;
    localStorage.removeItem(SELECTED_TENANT_STORAGE_KEY);
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
        tenantId: this.selectedTenantId ?? undefined,
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
      summary.negotiations.byState
    );
    this.negotiationRoleStateRows = this.toRoleStateRows(
      summary.negotiations.byRoleAndState
    );

    this.transferStateChartData = this.toPieChartData(
      summary.transfers.byState
    );
    this.transferRoleStateRows = this.toRoleStateRows(
      summary.transfers.byRoleAndState
    );
    this.transferFormatChartData = this.toDoughnutChartData(
      summary.transfers.byFormat
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
  ): ChartData<'bar'> {
    const buckets = Array.from(
      new Set(summary.events.overTime.map((c) => c.bucketStart))
    ).sort();
    const eventTypes = Array.from(
      new Set(summary.events.overTime.map((c) => c.key))
    );
    const timelineColors = ChartColorHelper.generateDistinctColors(
      eventTypes.length
    );

    const datasets = eventTypes.map((eventType, index) => ({
      label: this.getEventTypeDisplayName(eventType),
      data: buckets.map((bucketStart) => {
        const match = summary.events.overTime.find(
          (c) => c.bucketStart === bucketStart && c.key === eventType
        );
        return match ? match.count : 0;
      }),
      borderColor: timelineColors[index],
      backgroundColor: timelineColors[index],
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
    return !!this.summary && this.summary.negotiations.byState.length > 0;
  }

  get hasTransfersData(): boolean {
    return !!this.summary && this.summary.transfers.byState.length > 0;
  }

  get hasEventsData(): boolean {
    return !!this.summary && this.summary.events.overTime.length > 0;
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
