import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

import { TenantComponent } from './tenant.component';
import { TenantService } from '../../services/tenant/tenant.service';
import { PagedAPIResponse } from '../../models/genericApiResponse';
import { Tenant } from '../../models/tenant';

describe('TenantComponent', () => {
  let component: TenantComponent;
  let fixture: ComponentFixture<TenantComponent>;
  let tenantService: jasmine.SpyObj<TenantService>;

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
    ]);
    tenantServiceSpy.getAllTenants.and.returnValue(of(pagedResponse));

    await TestBed.configureTestingModule({
      imports: [TenantComponent],
      providers: [{ provide: TenantService, useValue: tenantServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantComponent);
    component = fixture.componentInstance;
    tenantService = TestBed.inject(TenantService) as jasmine.SpyObj<TenantService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch tenants on init with default pagination and sorting', () => {
    fixture.detectChanges();

    expect(tenantService.getAllTenants).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      sort: 'name',
      direction: 'asc',
    });
  });

  it('should update tenants and total elements after successful fetch', () => {
    fixture.detectChanges();

    expect(component.tenants).toEqual(mockTenants);
    expect(component.paginationState.totalElements).toBe(1);
    expect(component.loading).toBeFalse();
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

    expect(tenantService.getAllTenants).toHaveBeenCalledWith({
      page: 1,
      size: 50,
      sort: 'name',
      direction: 'asc',
    });
  });

  it('should reset to first page and fetch with selected sort', () => {
    fixture.detectChanges();
    component.paginationState.pageIndex = 3;

    const sortEvent: Sort = {
      active: 'description',
      direction: 'desc',
    };

    component.onSortChange(sortEvent);

    expect(component.paginationState.pageIndex).toBe(0);
    expect(tenantService.getAllTenants).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      sort: 'description',
      direction: 'desc',
    });
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
