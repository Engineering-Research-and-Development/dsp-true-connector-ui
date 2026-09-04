import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { DashboardSummaryResponse } from '../../models/dashboard';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { AuditService } from '../../services/audit/audit.service';
import { AuditEventType } from '../../models/auditEventType';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { UserService } from '../../services/user/user.service';
import { TenantService } from '../../services/tenant/tenant.service';
import { User } from '../../models/user';
import { Tenant } from '../../models/tenant';
import { UserRole } from '../../models/enums/user-role.enum';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardServiceSpy: jasmine.SpyObj<DashboardService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let tenantServiceSpy: jasmine.SpyObj<TenantService>;
  let auditServiceSpy: jasmine.SpyObj<AuditService>;

  const adminUser: User = {
    id: 'u1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    tenantId: 'tenant-1',
    enabled: true,
    expired: false,
    locked: false,
  };

  const superAdminUser: User = {
    ...adminUser,
    id: 'u2',
    email: 'superadmin@example.com',
    role: UserRole.SUPER_ADMIN,
    tenantId: null,
  };

  const mockEventTypes: AuditEventType[] = [
    { code: 'Protocol negotiation requested', description: 'Protocol negotiation requested' },
    { code: 'Transfer requested', description: 'Transfer requested' },
    { code: 'APPLICATION_LOGIN', description: 'Application login' },
  ];

  const mockTenants: Tenant[] = [
    {
      id: 'tenant-1',
      name: 'Tenant One',
      description: '',
      participantId: 'p1',
      automaticNegotiation: false,
      automaticTransfer: false,
      enabled: true,
      bucketName: 'bucket-1',
    },
    {
      id: 'tenant-2',
      name: 'Tenant Two',
      description: '',
      participantId: 'p2',
      automaticNegotiation: false,
      automaticTransfer: false,
      enabled: true,
      bucketName: 'bucket-2',
    },
  ];

  const mockSummary: DashboardSummaryResponse = {
    negotiations: {
      totalCount: 18,
      byState: [
        { key: 'REQUESTED', count: 4 },
        { key: 'FINALIZED', count: 5 },
      ],
      byRoleAndState: [
        { key: 'CONSUMER:REQUESTED', count: 2 },
        { key: 'PROVIDER:REQUESTED', count: 2 },
      ],
      byTenant: null,
    },
    transfers: {
      totalCount: 14,
      byState: [
        { key: 'STARTED', count: 4 },
        { key: 'COMPLETED', count: 4 },
      ],
      byRoleAndState: [{ key: 'CONSUMER:STARTED', count: 3 }],
      byFormat: [
        { key: 'HTTP_PULL', count: 9 },
        { key: 'HTTP_PUSH', count: 4 },
      ],
      downloadedCount: 4,
      downloadInProgressCount: 1,
      byTenant: null,
    },
    events: {
      totalCount: 26,
      byEventType: [
        { key: 'Protocol negotiation requested', count: 6 },
      ],
      byRole: [{ key: 'ROLE_API', count: 11 }],
      overTime: [
        {
          bucketStart: '2026-05-20T13:00:00Z',
          key: 'Transfer requested',
          count: 1,
        },
        {
          bucketStart: '2026-05-20T14:00:00Z',
          key: 'Transfer requested',
          count: 2,
        },
      ],
      byTenant: null,
    },
    runtime: {
      processCpuUsage: 0.37,
      systemCpuUsage: 0.61,
      heapUsedBytes: 402653184,
      heapMaxBytes: 1073741824,
      nonHeapUsedBytes: 125829120,
      liveThreadCount: 48,
      uptimeMilliseconds: 86400123,
    },
  };

  const emptySummary: DashboardSummaryResponse = {
    negotiations: {
      totalCount: 0,
      byState: [],
      byRoleAndState: [],
      byTenant: null,
    },
    transfers: {
      totalCount: 0,
      byState: [],
      byRoleAndState: [],
      byFormat: [],
      downloadedCount: 0,
      downloadInProgressCount: 0,
      byTenant: null,
    },
    events: {
      totalCount: 0,
      byEventType: [],
      byRole: [],
      overTime: [],
      byTenant: null,
    },
    runtime: {
      processCpuUsage: -1,
      systemCpuUsage: -1,
      heapUsedBytes: 0,
      heapMaxBytes: -1,
      nonHeapUsedBytes: 0,
      liveThreadCount: 0,
      uptimeMilliseconds: 0,
    },
  };

  beforeEach(async () => {
    dashboardServiceSpy = jasmine.createSpyObj('DashboardService', [
      'getSummary',
    ]);
    snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', [
      'openSnackBar',
    ]);
    userServiceSpy = jasmine.createSpyObj('UserService', ['getCurrentUser']);
    tenantServiceSpy = jasmine.createSpyObj('TenantService', [
      'getAllTenantsList',
    ]);
    auditServiceSpy = jasmine.createSpyObj('AuditService', [
      'getAuditEventTypes',
    ]);
    dashboardServiceSpy.getSummary.and.returnValue(of(mockSummary));
    userServiceSpy.getCurrentUser.and.returnValue(of(adminUser));
    tenantServiceSpy.getAllTenantsList.and.returnValue(of(mockTenants));
    auditServiceSpy.getAuditEventTypes.and.returnValue(of(mockEventTypes));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, BrowserAnimationsModule],
      providers: [
        provideCharts(withDefaultRegisterables()),
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: TenantService, useValue: tenantServiceSpy },
        { provide: AuditService, useValue: auditServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.removeItem('dashboardSelectedTenantId');
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load the summary on init and render KPI cards', () => {
    fixture.detectChanges();

    expect(dashboardServiceSpy.getSummary).toHaveBeenCalled();
    expect(component.summary).toEqual(mockSummary);

    const kpiValues = fixture.nativeElement.querySelectorAll('.kpi-value');
    const kpiText = Array.from(kpiValues).map((el: any) =>
      el.textContent.trim()
    );
    expect(kpiText).toContain('18');
    expect(kpiText).toContain('14');
    expect(kpiText).toContain('26');
  });

  it('should render the empty state without errors', () => {
    dashboardServiceSpy.getSummary.and.returnValue(of(emptySummary));
    fixture.detectChanges();

    expect(component.summary).toEqual(emptySummary);
    const kpiValues = fixture.nativeElement.querySelectorAll('.kpi-value');
    const kpiText = Array.from(kpiValues).map((el: any) =>
      el.textContent.trim()
    );
    expect(kpiText).toContain('0');
  });

  it('should split role/state keys correctly into table rows', () => {
    fixture.detectChanges();

    expect(component.negotiationRoleStateRows).toEqual([
      { role: 'CONSUMER', state: 'REQUESTED', count: 2 },
      { role: 'PROVIDER', state: 'REQUESTED', count: 2 },
    ]);
  });

  it('should build negotiation/transfer state pie charts with semantic colors', () => {
    fixture.detectChanges();

    expect(component.negotiationStateChartData.labels).toEqual([
      'REQUESTED',
      'FINALIZED',
    ]);
    expect(
      component.negotiationStateChartData.datasets[0].backgroundColor
    ).toEqual(['#42a5f5', '#4caf50']);

    expect(component.transferStateChartData.labels).toEqual([
      'STARTED',
      'COMPLETED',
    ]);
    expect(
      component.transferStateChartData.datasets[0].backgroundColor
    ).toEqual(['#5c6bc0', '#4caf50']);
  });

  it('should resolve reserved semantic colors for known states', () => {
    expect(component.getStateColor('COMPLETED')).toBe('#4caf50');
    expect(component.getStateColor('finalized')).toBe('#4caf50');
    expect(component.getStateColor('TERMINATED')).toBe('#e53935');
    expect(component.getStateColor('SUSPENDED')).toBe('#fdd835');
  });

  it('should fall back to the chart palette for unmapped states', () => {
    expect(component.getStateColor('SOME_UNKNOWN_STATE')).toBeTruthy();
  });

  it('should resolve friendly display names for known event type codes, falling back to the raw code otherwise', () => {
    fixture.detectChanges();
    expect(component.getEventTypeDisplayName('APPLICATION_LOGIN')).toBe(
      'Application login'
    );
    expect(component.getEventTypeDisplayName('SOME_UNKNOWN_CODE')).toBe(
      'SOME_UNKNOWN_CODE'
    );
  });

  it('should silently fall back to raw codes when fetching event types fails', () => {
    auditServiceSpy.getAuditEventTypes.and.returnValue(
      throwError(() => new Error('network error'))
    );

    fixture.detectChanges();

    expect(component.eventTypes).toEqual([]);
    expect(component.getEventTypeDisplayName('APPLICATION_LOGIN')).toBe(
      'APPLICATION_LOGIN'
    );
  });

  it('should render friendly event type names in the timeline chart legend once event types are loaded', () => {
    const applicationEventSummary = {
      ...mockSummary,
      events: {
        ...mockSummary.events,
        overTime: [
          {
            bucketStart: '2026-05-20T13:00:00Z',
            key: 'APPLICATION_LOGIN',
            count: 3,
          },
        ],
      },
    };
    dashboardServiceSpy.getSummary.and.returnValue(
      of(applicationEventSummary)
    );

    fixture.detectChanges();

    expect(component.eventsTimelineChartData.datasets[0].label).toBe(
      'Application login'
    );
  });

  it('should render friendly event type names in the Event Type table', () => {
    const applicationEventSummary = {
      ...mockSummary,
      events: {
        ...mockSummary.events,
        byEventType: [{ key: 'APPLICATION_LOGIN', count: 5 }],
      },
    };
    dashboardServiceSpy.getSummary.and.returnValue(
      of(applicationEventSummary)
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Application login');
  });

  it('should show a role-aware Advanced Filters description', () => {
    userServiceSpy.getCurrentUser.and.returnValue(of(superAdminUser));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Filter statistics by date range, bucket, and tenant'
    );
  });

  it('should hide tenant mention from the Advanced Filters description for non-SUPER_ADMIN users', () => {
    userServiceSpy.getCurrentUser.and.returnValue(of(adminUser));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Filter statistics by date range and bucket'
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Filter statistics by date range, bucket, and tenant'
    );
  });

  it('should map overTime into timeline chart datasets', () => {
    fixture.detectChanges();

    expect(component.eventsTimelineChartData.datasets.length).toBe(1);
    expect(component.eventsTimelineChartData.datasets[0].data).toEqual([
      1, 2,
    ]);
    // Bucket labels should be short (no full locale date-time string) so the
    // x-axis doesn't overflow with overlapping text.
    expect(component.eventsTimelineChartData.labels?.length).toBe(2);
    (component.eventsTimelineChartData.labels as string[]).forEach((label) => {
      expect(label.length).toBeLessThan(20);
    });
  });

  it('should assign a unique color to every event type in the timeline chart, even beyond the fixed palette size', () => {
    const manyEventTypesSummary = {
      ...mockSummary,
      events: {
        ...mockSummary.events,
        overTime: Array.from({ length: 12 }, (_, i) => ({
          bucketStart: '2026-05-20T13:00:00Z',
          key: `Event type ${i}`,
          count: i + 1,
        })),
      },
    };
    dashboardServiceSpy.getSummary.and.returnValue(of(manyEventTypesSummary));

    fixture.detectChanges();

    const datasets = component.eventsTimelineChartData.datasets;
    expect(datasets.length).toBe(12);
    const borderColors = datasets.map((d) => d.borderColor);
    expect(new Set(borderColors).size).toBe(12);
  });

  it('should expose empty-state flags based on summary data', () => {
    fixture.detectChanges();
    expect(component.hasNegotiationsData).toBeTrue();
    expect(component.hasTransfersData).toBeTrue();
    expect(component.hasEventsData).toBeTrue();

    dashboardServiceSpy.getSummary.and.returnValue(of(emptySummary));
    component.refresh();
    fixture.detectChanges();

    expect(component.hasNegotiationsData).toBeFalse();
    expect(component.hasTransfersData).toBeFalse();
    expect(component.hasEventsData).toBeFalse();

    const emptyStateEls =
      fixture.nativeElement.querySelectorAll('.empty-state');
    expect(emptyStateEls.length).toBeGreaterThan(0);
  });

  it('should re-fetch the summary with the selected bucket when refreshed', () => {
    fixture.detectChanges();
    dashboardServiceSpy.getSummary.calls.reset();

    component.bucket = 'day';
    component.refresh();

    expect(dashboardServiceSpy.getSummary).toHaveBeenCalledWith(
      jasmine.objectContaining({ bucket: 'day' })
    );
  });

  it('should show an error snackbar when the summary request fails', () => {
    dashboardServiceSpy.getSummary.and.returnValue(
      throwError(() => new Error('boom'))
    );

    fixture.detectChanges();

    expect(snackbarServiceSpy.openSnackBar).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should render download status cards from scalar counts', () => {
    fixture.detectChanges();

    const statusCards = fixture.nativeElement.querySelectorAll(
      '.status-card .kpi-value'
    );
    const statusValues = Array.from(statusCards).map((el: any) =>
      el.textContent.trim()
    );
    expect(statusValues).toEqual(['4', '1']);
  });

  it('should not show the tenant selector for ADMIN users', () => {
    fixture.detectChanges();

    expect(component.isSuperAdmin).toBeFalse();
    expect(tenantServiceSpy.getAllTenantsList).not.toHaveBeenCalled();
    expect(component.tenants.length).toBe(0);
  });

  it('should show the tenant selector and load tenants for SUPER_ADMIN users', () => {
    userServiceSpy.getCurrentUser.and.returnValue(of(superAdminUser));

    fixture.detectChanges();

    expect(component.isSuperAdmin).toBeTrue();
    expect(tenantServiceSpy.getAllTenantsList).toHaveBeenCalled();
    expect(component.tenants).toEqual(mockTenants);
    expect(component.selectedTenantId).toBeNull();
  });

  it('should persist and send the selected tenant when a SUPER_ADMIN changes it', () => {
    userServiceSpy.getCurrentUser.and.returnValue(of(superAdminUser));
    fixture.detectChanges();
    dashboardServiceSpy.getSummary.calls.reset();

    component.selectedTenantId = 'tenant-2';
    component.onTenantChange();

    expect(localStorage.getItem('dashboardSelectedTenantId')).toBe(
      'tenant-2'
    );
    expect(dashboardServiceSpy.getSummary).toHaveBeenCalledWith(
      jasmine.objectContaining({ tenantId: 'tenant-2' })
    );
  });

  it('should restore a previously persisted tenant selection on init', () => {
    localStorage.setItem('dashboardSelectedTenantId', 'tenant-2');
    userServiceSpy.getCurrentUser.and.returnValue(of(superAdminUser));

    fixture.detectChanges();

    expect(component.selectedTenantId).toBe('tenant-2');
  });

  it('should bound the From Date picker max by the selected To Date', () => {
    fixture.detectChanges();

    expect(component.maxFromDate).toBeNull();

    const toDate = new Date('2024-06-15');
    component.toDateFilter = toDate;

    expect(component.maxFromDate).toBe(toDate);
  });

  it('should bound the To Date picker min by the selected From Date', () => {
    fixture.detectChanges();

    expect(component.minToDate).toBeNull();

    const fromDate = new Date('2024-06-01');
    component.fromDateFilter = fromDate;

    expect(component.minToDate).toBe(fromDate);
  });
});

