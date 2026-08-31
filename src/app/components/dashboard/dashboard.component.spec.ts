import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { DashboardSummaryResponse } from '../../models/dashboard';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardServiceSpy: jasmine.SpyObj<DashboardService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockSummary: DashboardSummaryResponse = {
    negotiations: {
      total: 18,
      countsByState: [
        { key: 'REQUESTED', count: 4 },
        { key: 'FINALIZED', count: 5 },
      ],
      countsByRoleAndState: [
        { key: 'CONSUMER:REQUESTED', count: 2 },
        { key: 'PROVIDER:REQUESTED', count: 2 },
      ],
    },
    transfers: {
      total: 14,
      countsByState: [
        { key: 'STARTED', count: 4 },
        { key: 'COMPLETED', count: 4 },
      ],
      countsByRoleAndState: [{ key: 'CONSUMER:STARTED', count: 3 }],
      countsByFormat: [
        { key: 'HTTP_PULL', count: 9 },
        { key: 'HTTP_PUSH', count: 4 },
      ],
      countsByDownloadFlag: [
        { key: 'DOWNLOADED_TRUE', count: 4 },
        { key: 'DOWNLOADED_FALSE', count: 10 },
      ],
    },
    events: {
      total: 26,
      countsByEventType: [
        { key: 'Protocol negotiation requested', count: 6 },
      ],
      countsByRole: [{ key: 'ROLE_API', count: 11 }],
      countsOverTime: [
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
    negotiations: { total: 0, countsByState: [], countsByRoleAndState: [] },
    transfers: {
      total: 0,
      countsByState: [],
      countsByRoleAndState: [],
      countsByFormat: [],
      countsByDownloadFlag: [],
    },
    events: {
      total: 0,
      countsByEventType: [],
      countsByRole: [],
      countsOverTime: [],
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
    dashboardServiceSpy.getSummary.and.returnValue(of(mockSummary));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, BrowserAnimationsModule],
      providers: [
        provideCharts(withDefaultRegisterables()),
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
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
    expect(kpiText).toContain('37%');
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
    expect(kpiText).toContain('N/A');
  });

  it('should split role/state keys correctly into table rows', () => {
    fixture.detectChanges();

    expect(component.negotiationRoleStateRows).toEqual([
      { role: 'CONSUMER', state: 'REQUESTED', count: 2 },
      { role: 'PROVIDER', state: 'REQUESTED', count: 2 },
    ]);
  });

  it('should map countsOverTime into timeline chart datasets', () => {
    fixture.detectChanges();

    expect(component.eventsTimelineChartData.datasets.length).toBe(1);
    expect(component.eventsTimelineChartData.datasets[0].data).toEqual([
      1, 2,
    ]);
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
});
