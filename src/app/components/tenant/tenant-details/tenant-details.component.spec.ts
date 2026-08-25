import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';

import { TenantDetailsComponent } from './tenant-details.component';
import { Tenant } from '../../../models/tenant';
import { TenantService } from '../../../services/tenant/tenant.service';
import { EditStateService } from '../../../shared/edit-state.service';

class RouterMock {
  getCurrentNavigation = jasmine.createSpy('getCurrentNavigation');
  navigate = jasmine.createSpy('navigate');
}

class LocationMock {
  back = jasmine.createSpy('back');
}

describe('TenantDetailsComponent', () => {
  let component: TenantDetailsComponent;
  let fixture: ComponentFixture<TenantDetailsComponent>;
  let tenantServiceSpy: jasmine.SpyObj<TenantService>;
  let routerMock: RouterMock;
  let locationMock: LocationMock;

  const mockTenant: Tenant = {
    id: 'tenant-1',
    name: 'Tenant One',
    description: 'First tenant',
    participantId: 'did:web:participant:one',
    automaticNegotiation: true,
    automaticTransfer: false,
    enabled: true,
    bucketName: 'bucket-one',
  };

  beforeEach(async () => {
    tenantServiceSpy = jasmine.createSpyObj('TenantService', [
      'createTenant',
      'updateTenant',
      'enableTenant',
      'disableTenant',
    ]);
    tenantServiceSpy.createTenant.and.returnValue(of(mockTenant));
    tenantServiceSpy.updateTenant.and.returnValue(of(mockTenant));
    tenantServiceSpy.enableTenant.and.returnValue(of({ ...mockTenant, enabled: true }));
    tenantServiceSpy.disableTenant.and.returnValue(of({ ...mockTenant, enabled: false }));

    await TestBed.configureTestingModule({
      imports: [TenantDetailsComponent, NoopAnimationsModule],
      providers: [
        { provide: TenantService, useValue: tenantServiceSpy },
        { provide: Router, useClass: RouterMock },
        { provide: Location, useClass: LocationMock },
        EditStateService,
      ],
    }).compileComponents();

    routerMock = TestBed.inject(Router) as unknown as RouterMock;
    locationMock = TestBed.inject(Location) as unknown as LocationMock;
  });

  function setupNavigation(state: any) {
    routerMock.getCurrentNavigation.and.returnValue({
      extras: { state },
    } as any);
  }

  it('should create in view mode', () => {
    setupNavigation({ tenant: mockTenant });
    fixture = TestBed.createComponent(TenantDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.editMode).toBeFalse();
    expect(component.isCreate).toBeFalse();
  });

  it('should go back when no navigation state is present', () => {
    setupNavigation(null);
    fixture = TestBed.createComponent(TenantDetailsComponent);
    component = fixture.componentInstance;

    expect(locationMock.back).toHaveBeenCalled();
  });

  it('should be in create mode for a tenant without id', () => {
    setupNavigation({
      tenant: { ...mockTenant, id: '' },
      editMode: true,
    });
    fixture = TestBed.createComponent(TenantDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isCreate).toBeTrue();
    expect(component.editMode).toBeTrue();
    expect(component.tenantForm.get('id')?.enabled).toBeTrue();
    expect(component.tenantForm.get('participantId')?.enabled).toBeTrue();
  });

  it('should require id, name and participantId in create mode', () => {
    setupNavigation({
      tenant: { ...mockTenant, id: '' },
      editMode: true,
    });
    fixture = TestBed.createComponent(TenantDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.tenantForm.patchValue({
      id: '',
      name: '',
      participantId: '',
    });

    expect(component.tenantForm.invalid).toBeTrue();
    expect(component.tenantForm.get('id')?.hasError('required')).toBeTrue();
    expect(component.tenantForm.get('name')?.hasError('required')).toBeTrue();
    expect(component.tenantForm.get('participantId')?.hasError('required')).toBeTrue();
  });

  it('should create a tenant', () => {
    setupNavigation({
      tenant: { ...mockTenant, id: '' },
      editMode: true,
    });
    fixture = TestBed.createComponent(TenantDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.tenantForm.patchValue({
      id: 'new-tenant',
      name: 'New Tenant',
      participantId: 'urn:participant:new',
    });

    component.saveTenant();

    expect(tenantServiceSpy.createTenant).toHaveBeenCalled();
    expect(component.isCreate).toBeFalse();
    expect(component.editMode).toBeFalse();
  });

  it('should update a tenant', () => {
    setupNavigation({ tenant: mockTenant, editMode: true });
    fixture = TestBed.createComponent(TenantDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.tenantForm.patchValue({
      name: 'Updated Tenant',
    });

    component.saveTenant();

    expect(tenantServiceSpy.updateTenant).toHaveBeenCalledWith(
      mockTenant.id,
      jasmine.objectContaining({ name: 'Updated Tenant' })
    );
    expect(component.editMode).toBeFalse();
  });

  it('should enable tenant', () => {
    setupNavigation({ tenant: { ...mockTenant, enabled: false } });
    fixture = TestBed.createComponent(TenantDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.enableTenant();

    expect(tenantServiceSpy.enableTenant).toHaveBeenCalledWith(mockTenant.id);
  });

  it('should disable tenant', () => {
    setupNavigation({ tenant: mockTenant });
    fixture = TestBed.createComponent(TenantDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.disableTenant();

    expect(tenantServiceSpy.disableTenant).toHaveBeenCalledWith(mockTenant.id);
  });

  it('should go back when cancelling create', () => {
    setupNavigation({
      tenant: { ...mockTenant, id: '' },
      editMode: true,
    });
    fixture = TestBed.createComponent(TenantDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.cancelEdit();

    expect(locationMock.back).toHaveBeenCalled();
  });
});
