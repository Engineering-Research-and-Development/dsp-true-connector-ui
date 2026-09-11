import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { TenantComponent } from './tenant.component';
import { TenantService } from '../../services/tenant/tenant.service';
import { PagedAPIResponse } from '../../models/genericApiResponse';
import { Tenant } from '../../models/tenant';

class RouterMock {
  navigate = jasmine.createSpy('navigate');
}

describe('TenantComponent', () => {
  let component: TenantComponent;
  let fixture: ComponentFixture<TenantComponent>;
  let tenantService: jasmine.SpyObj<TenantService>;
  let router: RouterMock;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockTenants: Tenant[] = [
    {
      id: 'tenant-1',
      name: 'Tenant One',
      description: 'First tenant',
      participantId: 'did:web:participant:one',
      automaticNegotiation: true,
      automaticTransfer: false,
      enabled: true,
      bucketName: 'bucket-one',
    },
  ];

  const pagedResponse: PagedAPIResponse<Tenant> = {
    response: {
      success: true,
      message: 'Fetched tenants',
      timestamp: '2026-08-17T10:00:00Z',
      data: {
        links: [],
        content: mockTenants,
        page: {
          size: 20,
          totalElements: 1,
          totalPages: 1,
          number: 0,
        },
      },
    },
  };

  beforeEach(async () => {
    const tenantServiceSpy = jasmine.createSpyObj('TenantService', [
      'getAllTenants',
      'deleteTenant',
      'enableTenant',
      'disableTenant',
    ]);
    tenantServiceSpy.getAllTenants.and.returnValue(of(pagedResponse));
    tenantServiceSpy.deleteTenant.and.returnValue(of('Tenant deleted'));
    tenantServiceSpy.enableTenant.and.returnValue(of(mockTenants[0]));
    tenantServiceSpy.disableTenant.and.returnValue(of(mockTenants[0]));

    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(true),
    } as any);

    TestBed.configureTestingModule({
      imports: [TenantComponent, NoopAnimationsModule],
      providers: [
        { provide: TenantService, useValue: tenantServiceSpy },
        { provide: Router, useClass: RouterMock },
      ],
    });

    TestBed.overrideProvider(MatDialog, { useValue: dialogSpy });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(TenantComponent);
    component = fixture.componentInstance;
    tenantService = TestBed.inject(TenantService) as jasmine.SpyObj<TenantService>;
    router = TestBed.inject(Router) as unknown as RouterMock;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch tenants on init with default filters, pagination and sorting', () => {
    fixture.detectChanges();

    expect(tenantService.getAllTenants).toHaveBeenCalledWith(
      {},
      { page: 0, size: 20, sort: 'name', direction: 'asc' }
    );
  });

  it('should update tenants and total elements after successful fetch', () => {
    fixture.detectChanges();

    expect(component.tenants).toEqual(mockTenants);
    expect(component.paginationState.totalElements).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should apply name and enabled filters and reset to first page', () => {
    fixture.detectChanges();
    component.paginationState.pageIndex = 2;
    component.nameFilter = 'Tenant';
    component.selectedEnabled = true;

    component.applyFilters();

    expect(component.paginationState.pageIndex).toBe(0);
    expect(tenantService.getAllTenants).toHaveBeenCalledWith(
      { name: 'Tenant', enabled: true },
      { page: 0, size: 20, sort: 'name', direction: 'asc' }
    );
  });

  it('should clear filters and fetch', () => {
    fixture.detectChanges();
    component.nameFilter = 'Tenant';
    component.selectedEnabled = false;

    component.clearFilters();

    expect(component.nameFilter).toBe('');
    expect(component.selectedEnabled).toBeNull();
    expect(tenantService.getAllTenants).toHaveBeenCalledWith(
      {},
      { page: 0, size: 20, sort: 'name', direction: 'asc' }
    );
  });

  it('should fetch tenants for the selected page', () => {
    fixture.detectChanges();

    const pageEvent: PageEvent = {
      length: 100,
      pageIndex: 1,
      pageSize: 50,
      previousPageIndex: 0,
    };

    component.onPageChange(pageEvent);

    expect(tenantService.getAllTenants).toHaveBeenCalledWith(
      {},
      { page: 1, size: 50, sort: 'name', direction: 'asc' }
    );
  });

  it('should reset to first page and fetch with selected sort column', () => {
    fixture.detectChanges();
    component.paginationState.pageIndex = 3;

    component.onSortColumnChange('participantId');

    expect(component.paginationState.pageIndex).toBe(0);
    expect(tenantService.getAllTenants).toHaveBeenCalledWith(
      {},
      { page: 0, size: 20, sort: 'participantId', direction: 'asc' }
    );
  });

  it('should fetch with selected sort direction', () => {
    fixture.detectChanges();

    component.onSortDirectionChange('desc');

    expect(tenantService.getAllTenants).toHaveBeenCalledWith(
      {},
      { page: 0, size: 20, sort: 'name', direction: 'desc' }
    );
  });

  it('should navigate to add tenant', () => {
    fixture.detectChanges();

    component.onAdd();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/tenant/details'],
      jasmine.objectContaining({ state: jasmine.objectContaining({ editMode: true }) })
    );
  });

  it('should navigate to view tenant', () => {
    fixture.detectChanges();

    component.onView(mockTenants[0]);

    expect(router.navigate).toHaveBeenCalledWith(
      ['/tenant/details'],
      jasmine.objectContaining({ state: jasmine.objectContaining({ tenant: mockTenants[0] }) })
    );
  });

  it('should navigate to edit tenant', () => {
    fixture.detectChanges();

    component.onEdit(mockTenants[0]);

    expect(router.navigate).toHaveBeenCalledWith(
      ['/tenant/details'],
      jasmine.objectContaining({
        state: jasmine.objectContaining({ tenant: mockTenants[0], editMode: true }),
      })
    );
  });

  it('should enable tenant when disabled', () => {
    fixture.detectChanges();
    const disabledTenant = { ...mockTenants[0], enabled: false };

    component.onToggleEnabled(disabledTenant);

    expect(tenantService.enableTenant).toHaveBeenCalledWith(disabledTenant.id);
  });

  it('should disable tenant when enabled', () => {
    fixture.detectChanges();

    component.onToggleEnabled(mockTenants[0]);

    expect(tenantService.disableTenant).toHaveBeenCalledWith(mockTenants[0].id);
  });

  it('should delete tenant after confirmation', () => {
    fixture.detectChanges();

    component.onDelete(mockTenants[0]);

    expect(dialog.open).toHaveBeenCalled();
    expect(tenantService.deleteTenant).toHaveBeenCalledWith(mockTenants[0].id);
  });

  it('should stop loading when fetch fails', () => {
    tenantService.getAllTenants.and.returnValue(
      throwError(() => new Error('Request failed'))
    );
    spyOn(console, 'error');

    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });
});
