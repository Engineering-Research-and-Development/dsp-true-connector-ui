import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { DashboardSummaryResponse } from '../../models/dashboard';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

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
      countsByDownloadFlag: [{ key: 'DOWNLOADED_TRUE', count: 4 }],
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

  const mockResponse: GenericApiResponse<DashboardSummaryResponse> = {
    success: true,
    message: 'Dashboard summary fetched',
    timestamp: '2026-05-21T12:00:00+02:00',
    data: mockSummary,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSummary', () => {
    it('should return dashboard summary data', () => {
      service.getSummary().subscribe({
        next: (summary) => {
          expect(summary).toEqual(mockSummary);
        },
      });

      const req = httpMock.expectOne(
        `${environment.DASHBOARD_API_URL()}/summary`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      req.flush(mockResponse);
    });

    it('should call API with from/to/bucket query parameters', () => {
      service
        .getSummary({
          from: '2026-05-20T12:00:00Z',
          to: '2026-05-21T12:00:00Z',
          bucket: 'day',
        })
        .subscribe();

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${environment.DASHBOARD_API_URL()}/summary` &&
          request.params.get('from') === '2026-05-20T12:00:00Z' &&
          request.params.get('to') === '2026-05-21T12:00:00Z' &&
          request.params.get('bucket') === 'day'
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should not set query parameters when none are provided', () => {
      service.getSummary().subscribe();

      const req = httpMock.expectOne((request) => {
        return (
          request.url === `${environment.DASHBOARD_API_URL()}/summary` &&
          request.params.keys().length === 0
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw when the response contains no data', () => {
      service.getSummary().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(
        `${environment.DASHBOARD_API_URL()}/summary`
      );
      req.flush({
        success: true,
        message: 'No data',
        timestamp: '2026-05-21T12:00:00+02:00',
      });
    });

    it('should handle HTTP error', () => {
      service.getSummary().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(
        `${environment.DASHBOARD_API_URL()}/summary`
      );
      req.flush('Server error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });
});
