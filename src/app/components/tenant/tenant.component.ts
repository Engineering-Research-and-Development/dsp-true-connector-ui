import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Tenant } from '../../models/tenant';
import { TenantService } from '../../services/tenant/tenant.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import {
  FilterExpansionState,
  PaginationHelper,
  PaginationState,
  SortState,
} from '../../shared/utils/pagination.utils';

@Component({
  selector: 'app-tenants',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatListModule,
    MatExpansionModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    FormsModule,
    MatTooltipModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSlideToggleModule,
  ],
  templateUrl: './tenant.component.html',
  styleUrls: ['./tenant.component.css'],
})
export class TenantComponent implements OnInit, OnDestroy {
  tenants: Tenant[] = [];
  loading = false;

  paginationState: PaginationState =
    PaginationHelper.createInitialPaginationState();
  sortState: SortState = PaginationHelper.createInitialSortState('name', 'asc');

  filterExpansionState: FilterExpansionState =
    PaginationHelper.createFilterExpansionState(false);
  sortExpansionState: FilterExpansionState =
    PaginationHelper.createFilterExpansionState(false);

  sortColumns = [
    { value: 'name', label: 'Name' },
    { value: 'participantId', label: 'Participant ID' },
    { value: 'id', label: 'ID' },
  ];

  booleanOptions = [
    { value: null, label: 'All' },
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ];

  nameFilter = '';
  selectedEnabled: boolean | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private tenantService: TenantService
  ) {}

  ngOnInit(): void {
    this.fetchTenants();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchTenants(): void {
    this.loading = true;

    const filters: { name?: string; enabled?: boolean } = {};
    if (this.nameFilter) {
      filters.name = this.nameFilter;
    }
    if (
      this.selectedEnabled !== null &&
      this.selectedEnabled !== undefined
    ) {
      filters.enabled = this.selectedEnabled;
    }

    const paginationOptions = PaginationHelper.createPaginationOptions(
      this.paginationState,
      this.sortState
    );

    this.tenantService
      .getAllTenants(filters, paginationOptions)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.tenants = response.response.data?.content || [];
          if (response.response.data?.page) {
            this.paginationState = PaginationHelper.updateTotalElements(
              this.paginationState,
              response.response.data.page.totalElements
            );
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching tenants:', error);
          this.loading = false;
        },
      });
  }

  applyFilters(): void {
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchTenants();
  }

  clearFilters(): void {
    this.nameFilter = '';
    this.selectedEnabled = null;
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchTenants();
  }

  onSortColumnChange(column: string): void {
    this.sortState = { ...this.sortState, sortColumn: column };
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchTenants();
  }

  onSortDirectionChange(direction: 'asc' | 'desc'): void {
    this.sortState = { ...this.sortState, sortDirection: direction };
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchTenants();
  }

  onPageChange(event: PageEvent): void {
    this.paginationState = PaginationHelper.handlePageChange(
      { pageIndex: event.pageIndex, pageSize: event.pageSize },
      this.paginationState
    );
    this.filterExpansionState.filtersExpanded = false;
    this.sortExpansionState.filtersExpanded = false;
    this.fetchTenants();
  }

  onAdd(): void {
    const newTenant: Tenant = {
      id: '',
      name: '',
      description: '',
      participantId: '',
      automaticNegotiation: false,
      automaticTransfer: false,
      enabled: false,
      bucketName: '',
    };
    this.router.navigate(['/tenant/details'], {
      state: { tenant: newTenant, editMode: true },
    });
  }

  onView(tenant: Tenant): void {
    this.router.navigate(['/tenant/details'], {
      state: { tenant },
    });
  }

  onEdit(tenant: Tenant): void {
    this.router.navigate(['/tenant/details'], {
      state: { tenant, editMode: true },
    });
  }

  onToggleEnabled(tenant: Tenant): void {
    if (tenant.enabled) {
      this.setTenantEnabled(tenant.id, false);
    } else {
      this.setTenantEnabled(tenant.id, true);
    }
  }

  private setTenantEnabled(id: string, enabled: boolean): void {
    const operation = enabled
      ? this.tenantService.enableTenant(id)
      : this.tenantService.disableTenant(id);

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.fetchTenants(),
      error: (error) => console.error('Error toggling tenant status:', error),
    });
  }

  onDelete(tenant: Tenant): void {
    const dialogData = {
      title: 'Confirm deletion of tenant',
      message: `Are you sure you want to delete tenant ${tenant.name}? This operation cannot be undone.`,
    };

    this.dialog
      .open(ConfirmationDialogComponent, { data: dialogData })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.loading = true;
          this.tenantService
            .deleteTenant(tenant.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => this.fetchTenants(),
              error: (error) => {
                console.error('Error deleting tenant:', error);
                this.loading = false;
              },
            });
        }
      });
  }
}