import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Tenant } from '../../models/tenant';
import { User } from '../../models/user';
import { UserRole } from '../../models/enums/user-role.enum';
import { TenantService } from '../../services/tenant/tenant.service';
import { UserService } from '../../services/user/user.service';
import {
  FilterExpansionState,
  PaginationHelper,
  PaginationState,
  SortState,
} from '../../shared/utils/pagination.utils';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-user-management',
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatListModule,
    MatExpansionModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSlideToggleModule,
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: User[] = [];
  tenants: Tenant[] = [];
  currentUser: User | null = null;
  loading = false;

  userRoles = Object.values(UserRole);
  booleanOptions = [
    { value: null, label: 'All' },
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ];

  // Pagination and sorting
  paginationState: PaginationState =
    PaginationHelper.createInitialPaginationState();
  sortState: SortState = PaginationHelper.createInitialSortState(
    'tenantId',
    'asc'
  );

  filterExpansionState: FilterExpansionState =
    PaginationHelper.createFilterExpansionState(false);
  sortExpansionState: FilterExpansionState =
    PaginationHelper.createFilterExpansionState(false);

  sortColumns = [
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Role' },
    { value: 'tenantId', label: 'Tenant ID' },
  ];

  // Filters
  firstNameFilter = '';
  lastNameFilter = '';
  emailFilter = '';
  selectedRole: UserRole | null = null;
  selectedTenantId: string | null = null;
  selectedEnabled: boolean | null = null;
  selectedExpired: boolean | null = null;
  selectedLocked: boolean | null = null;

  readonly userRole = UserRole;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private userService: UserService,
    private tenantService: TenantService
  ) {}

  ngOnInit(): void {
    this.fetchTenants();
    this.fetchCurrentUser();
    this.fetchUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchTenants(): void {
    this.tenantService
      .getAllTenantsList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tenants) => {
          this.tenants = tenants;
        },
        error: (error) => {
          console.error('Error fetching tenants:', error);
        },
      });
  }

  fetchCurrentUser(): void {
    this.userService
      .getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
        },
        error: (error) => {
          console.error('Error fetching current user:', error);
        },
      });
  }

  fetchUsers(): void {
    this.loading = true;

    const filters = {
      firstName: this.firstNameFilter || undefined,
      lastName: this.lastNameFilter || undefined,
      email: this.emailFilter || undefined,
      role: this.selectedRole || undefined,
      tenantId: this.selectedTenantId || undefined,
      enabled:
        this.selectedEnabled !== null && this.selectedEnabled !== undefined
          ? this.selectedEnabled
          : undefined,
      expired:
        this.selectedExpired !== null && this.selectedExpired !== undefined
          ? this.selectedExpired
          : undefined,
      locked:
        this.selectedLocked !== null && this.selectedLocked !== undefined
          ? this.selectedLocked
          : undefined,
    };

    const paginationOptions = PaginationHelper.createPaginationOptions(
      this.paginationState,
      this.sortState
    );

    this.userService
      .getUsers(filters, paginationOptions)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.users = response.response.data?.content || [];
          if (response.response.data?.page) {
            this.paginationState = PaginationHelper.updateTotalElements(
              this.paginationState,
              response.response.data.page.totalElements
            );
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching users:', error);
          this.loading = false;
        },
      });
  }

  applyFilters(): void {
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchUsers();
  }

  clearFilters(): void {
    this.firstNameFilter = '';
    this.lastNameFilter = '';
    this.emailFilter = '';
    this.selectedRole = null;
    this.selectedTenantId = null;
    this.selectedEnabled = null;
    this.selectedExpired = null;
    this.selectedLocked = null;
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchUsers();
  }

  onSortColumnChange(column: string): void {
    this.sortState = { ...this.sortState, sortColumn: column };
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchUsers();
  }

  onSortDirectionChange(direction: 'asc' | 'desc'): void {
    this.sortState = { ...this.sortState, sortDirection: direction };
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchUsers();
  }

  onPageChange(event: PageEvent): void {
    this.paginationState = PaginationHelper.handlePageChange(
      { pageIndex: event.pageIndex, pageSize: event.pageSize },
      this.paginationState
    );
    this.filterExpansionState.filtersExpanded = false;
    this.sortExpansionState.filtersExpanded = false;
    this.fetchUsers();
  }

  getTenantDisplayName(tenantId: string | null): string {
    if (!tenantId) {
      return 'N/A';
    }
    const tenant = this.tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : tenantId;
  }

  onAdd(): void {
    const newUser: User = {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      role: UserRole.ADMIN,
      tenantId: null,
      enabled: true,
      expired: false,
      locked: false,
    };
    this.router.navigate(['/user-management/details'], {
      state: { user: newUser, editMode: true },
    });
  }

  onView(user: User): void {
    this.router.navigate(['/user-management/details'], {
      state: { user },
    });
  }

  onEdit(user: User): void {
    this.router.navigate(['/user-management/details'], {
      state: { user, editMode: true },
    });
  }

  onDelete(user: User): void {
    if (this.isCurrentUser(user)) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'Cannot delete user',
          message: 'You cannot delete your own user account.',
          hideActions: true,
        },
      });
      return;
    }

    if (this.isLastEnabledSuperAdmin(user)) {
      this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'Cannot delete user',
          message: 'You cannot delete the only enabled SUPER_ADMIN.',
          hideActions: true,
        },
      });
      return;
    }

    const dialogData = {
      title: 'Confirm deletion of user',
      message: `Are you sure you want to delete user ${user.firstName} ${user.lastName}? This operation cannot be undone.`,
    };

    this.dialog
      .open(ConfirmationDialogComponent, { data: dialogData })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.loading = true;
          this.userService
            .deleteUser(user.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.fetchUsers();
              },
              error: (error) => {
                console.error('Error deleting user:', error);
                this.loading = false;
              },
            });
        }
      });
  }

  private isCurrentUser(user: User): boolean {
    return !!this.currentUser && this.currentUser.email === user.email;
  }

  private isLastEnabledSuperAdmin(user: User): boolean {
    if (user.role !== UserRole.SUPER_ADMIN || !user.enabled) {
      return false;
    }
    const enabledSuperAdmins = this.users.filter(
      (u) => u.role === UserRole.SUPER_ADMIN && u.enabled
    );
    return enabledSuperAdmins.length === 1;
  }
}
