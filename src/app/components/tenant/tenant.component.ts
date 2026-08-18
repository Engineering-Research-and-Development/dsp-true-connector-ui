import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { TenantService } from '../../services/tenant/tenant.service';
import { Tenant } from '../../models/tenant';
import { PaginationHelper, PaginationState, SortState } from '../../shared/utils/pagination.utils';

@Component({
  selector: 'app-tenants',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
  ],
  templateUrl: './tenant.component.html',
  styleUrls: ['./tenant.component.css'],
})
export class TenantComponent implements OnInit {

  tenants: Tenant[] = [];

  displayedColumns: string[] = [
    'name',
    'description',
    'participantId',
    'automaticNegotiation',
    'automaticTransfer',
    'enabled',
    'bucketName',
  ];

  paginationState: PaginationState = PaginationHelper.createInitialPaginationState();
  sortState: SortState = PaginationHelper.createInitialSortState('name', 'asc');

  loading: boolean = false;

  constructor(private tenantService: TenantService) {}

  ngOnInit(): void {
    this.fetchTenants();
  }

  fetchTenants(): void {
    this.loading = true;
    const paginationOptions = PaginationHelper.createPaginationOptions(
      this.paginationState,
      this.sortState
    );

    this.tenantService.getAllTenants(paginationOptions).subscribe({
      next: (response) => {
        const data = response.response.data;
        if (data) {
          this.tenants = data.content;
          this.paginationState = PaginationHelper.updateTotalElements(
            this.paginationState,
            data.page.totalElements
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

  onSortChange(sort: Sort) {
    this.sortState = PaginationHelper.handleSortChange(
      { active: sort.active, direction: sort.direction as 'asc' | 'desc' },
      this.sortState
    );
    this.paginationState = PaginationHelper.resetToFirstPage(this.paginationState);
    this.fetchTenants();
  }

  onPageChange(event: PageEvent) {
    this.paginationState = PaginationHelper.handlePageChange(
      { pageIndex: event.pageIndex, pageSize: event.pageSize },
      this.paginationState
    );
    this.fetchTenants();
  }
}