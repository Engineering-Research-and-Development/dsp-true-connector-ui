import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AuditEvent } from '../../models/auditEvent';
import { AuditEventType } from '../../models/auditEventType';
import { AuditService } from '../../services/audit/audit.service';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { AuditEventDetailsDialogComponent } from './audit-event-details-dialog/audit-event-details-dialog.component';

// Custom date adapter to force DD/MM/YYYY format
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

// Custom date format configuration
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

@Component({
  selector: 'app-audit-trail',
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    NgxSkeletonLoaderModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatTooltipModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
  ],
  templateUrl: './audit-trail.component.html',
  styleUrl: './audit-trail.component.css',
})
export class AuditTrailComponent implements OnInit {
  loading = false;
  auditEvents: AuditEvent[] = [];

  // Table configuration
  displayedColumns: string[] = [
    'timestamp',
    'eventType',
    'username',
    'description',
    'source',
    'ipAddress',
    'actions',
  ];

  // Pagination
  pageSize = 20;
  pageIndex = 0;
  totalEvents = 0;
  pageSizeOptions = [10, 20, 50, 100];

  // Sorting
  sortColumn = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Filter properties
  selectedEventType: AuditEventType | null = null;
  usernameFilter: string = '';
  sourceFilter: string = '';
  ipAddressFilter: string = '';
  providerPidFilter: string = '';
  consumerPidFilter: string = '';
  fromDateFilter: Date | null = null;
  toDateFilter: Date | null = null;

  // Available event types for dropdown
  auditEventTypes: AuditEventType[] = [];
  loadingEventTypes = false;
  eventTypeFilterDisabled = false;

  // Expansion panel state
  filtersExpanded: boolean = false;

  constructor(
    private auditService: AuditService,
    private dialog: MatDialog,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.loadEventTypes();
    this.fetchAuditEvents();
  }

  /**
   * Load available event types from backend
   */
  loadEventTypes(): void {
    this.loadingEventTypes = true;
    this.auditService.getAuditEventTypes().subscribe({
      next: (eventTypes) => {
        this.auditEventTypes = eventTypes;
        this.loadingEventTypes = false;
        this.eventTypeFilterDisabled = false;
      },
      error: (error) => {
        console.error('Error loading audit event types:', error);
        this.loadingEventTypes = false;
        this.eventTypeFilterDisabled = true;
        this.auditEventTypes = [];
        this.snackbarService.openSnackBar(
          'Event type filtering unavailable. Other filters are still active.',
          'OK',
          'center',
          'bottom',
          'snackbar-warning'
        );
      },
    });
  }

  /**
   * Check if any filters are currently applied
   */
  private hasFiltersApplied(): boolean {
    return (
      this.selectedEventType !== null ||
      this.usernameFilter.trim() !== '' ||
      this.sourceFilter.trim() !== '' ||
      this.ipAddressFilter.trim() !== '' ||
      this.providerPidFilter.trim() !== '' ||
      this.consumerPidFilter.trim() !== '' ||
      this.fromDateFilter !== null ||
      this.toDateFilter !== null
    );
  }

  /**
   * Fetch all audit events
   */
  fetchAuditEvents() {
    this.loading = true;
    this.auditService
      .getAuditEventsWithFilters(
        {},
        {
          page: this.pageIndex,
          size: this.pageSize,
          sort: this.sortColumn,
          direction: this.sortDirection,
        }
      )
      .subscribe({
        next: (response) => {
          const data = response.response.data;
          if (data) {
            this.auditEvents = data.content;
            this.totalEvents = data.page.totalElements;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching audit events:', error);
          this.loading = false;
        },
      });
  }

  /**
   * Apply filters and fetch audit events with filtering
   */
  applyFilters() {
    // Keep the expansion panel open when applying filters
    this.filtersExpanded = true;

    if (this.hasFiltersApplied()) {
      // Use filtering method when filters are applied
      this.loading = true;
      this.pageIndex = 0; // Reset to first page when applying filters

      const filters = {
        eventType: this.selectedEventType?.code,
        username: this.usernameFilter || undefined,
        source: this.sourceFilter || undefined,
        ipAddress: this.ipAddressFilter || undefined,
        providerPid: this.providerPidFilter || undefined,
        consumerPid: this.consumerPidFilter || undefined,
        fromDate: this.fromDateFilter
          ? this.formatDateForAPI(this.fromDateFilter, false)
          : undefined,
        toDate: this.toDateFilter
          ? this.formatDateForAPI(this.toDateFilter, true)
          : undefined,
      };

      const pagination = {
        page: this.pageIndex,
        size: this.pageSize,
        sort: this.sortColumn,
        direction: this.sortDirection,
      };

      this.auditService
        .getAuditEventsWithFilters(filters, pagination)
        .subscribe({
          next: (response) => {
            const data = response.response.data;
            if (data) {
              this.auditEvents = data.content;
              this.totalEvents = data.page.totalElements;
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error fetching filtered audit events:', error);
            this.loading = false;
          },
        });
    } else {
      // No filters applied, use original method
      this.fetchAuditEvents();
    }
  }

  /**
   * Clear all filters and fetch all audit events
   */
  clearFilters() {
    // Keep the expansion panel open after clearing filters
    this.filtersExpanded = true;

    this.selectedEventType = null;
    this.usernameFilter = '';
    this.sourceFilter = '';
    this.ipAddressFilter = '';
    this.providerPidFilter = '';
    this.consumerPidFilter = '';
    this.fromDateFilter = null;
    this.toDateFilter = null;
    this.pageIndex = 0; // Reset to first page
    this.fetchAuditEvents();
  }

  /**
   * Handle sort change
   */
  onSortChange(sort: Sort) {
    this.sortColumn = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc';
    this.pageIndex = 0; // Reset to first page when sorting changes
    this.refreshCurrentView();
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.refreshCurrentView();
  }

  /**
   * Refresh the current view based on whether filters are applied
   */
  refreshCurrentView() {
    if (this.hasFiltersApplied()) {
      this.applyFilters();
    } else {
      this.fetchAuditEvents();
    }
  }

  /**
   * Open details dialog for an audit event
   */
  openDetailsDialog(auditEvent: AuditEvent) {
    this.dialog.open(AuditEventDetailsDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      autoFocus: false,
      restoreFocus: false,
      data: {
        auditEvent: auditEvent,
        eventTypes: this.auditEventTypes,
      },
    });
  }

  /**
   * Get the display name of the audit event type
   */
  getEventTypeDisplayName(eventTypeCode: string): string {
    const eventType = this.auditEventTypes.find(
      (type) => type.code === eventTypeCode
    );
    return eventType ? eventType.description : eventTypeCode;
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Format date for API request (UTC ISO format)
   */
  formatDateForAPI(date: Date, isEndDate: boolean = false): string {
    // Create a new date to avoid modifying the original
    const apiDate = new Date(date);

    if (isEndDate) {
      // For end date, set to end of day (23:59:59.999)
      apiDate.setHours(23, 59, 59, 999);
    } else {
      // For start date, set to beginning of day (00:00:00.000)
      apiDate.setHours(0, 0, 0, 0);
    }

    // Backend expects UTC format like: 2025-07-16T08:20:05.577Z
    const formattedDate = apiDate.toISOString();

    return formattedDate;
  }

  /**
   * Get event type chip color based on event type
   */
  getEventTypeChipColor(eventTypeCode: string): string {
    if (eventTypeCode.includes('LOGIN') || eventTypeCode.includes('LOGOUT')) {
      return 'primary';
    } else if (
      eventTypeCode.includes('ERROR') ||
      eventTypeCode.includes('FAILED') ||
      eventTypeCode.includes('DENIED')
    ) {
      return 'warn';
    } else if (
      eventTypeCode.includes('COMPLETED') ||
      eventTypeCode.includes('FINALIZED') ||
      eventTypeCode.includes('APPROVED')
    ) {
      return 'accent';
    }
    return '';
  }
}
