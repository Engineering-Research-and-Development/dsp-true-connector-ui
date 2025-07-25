import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuditEvent } from '../../models/auditEvent';
import { AuditEventType } from '../../models/auditEventType';
import {
  GenericApiResponse,
  PagedAPIResponse,
} from '../../models/genericApiResponse';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let httpMock: HttpTestingController;

  const mockAuditEvent: AuditEvent = {
    id: 'audit-event-1',
    eventType: 'USER_LOGIN',
    username: 'testuser',
    timestamp: '2025-01-13T15:14:06+01:00',
    description: 'User logged into the system',
    details: {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
    },
    source: 'authentication-module',
    ipAddress: '192.168.1.1',
  };

  const mockAuditEvents: AuditEvent[] = [
    mockAuditEvent,
    {
      id: 'audit-event-2',
      eventType: 'CONTRACT_NEGOTIATION_STARTED',
      username: 'testuser2',
      timestamp: '2025-01-13T16:14:06+01:00',
      description: 'Contract negotiation started',
      details: {
        contractNegotiation: {
          providerPid: 'provider-123',
          consumerPid: 'consumer-456',
        },
      },
      source: 'negotiation-module',
      ipAddress: '192.168.1.2',
    },
  ];

  const mockAuditEventTypes: AuditEventType[] = [
    { code: 'USER_LOGIN', description: 'User Login' },
    { code: 'USER_LOGOUT', description: 'User Logout' },
    {
      code: 'CONTRACT_NEGOTIATION_STARTED',
      description: 'Contract Negotiation Started',
    },
    { code: 'DATA_TRANSFER_COMPLETED', description: 'Data Transfer Completed' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllAuditEvents', () => {
    it('should return audit events from paginated response', () => {
      const mockPagedResponse: PagedAPIResponse<AuditEvent> = {
        response: {
          success: true,
          message: 'Audit events retrieved successfully',
          data: {
            links: [],
            content: mockAuditEvents,
            page: {
              totalElements: 2,
              totalPages: 1,
              size: 20,
              number: 0,
            },
          },
          timestamp: '2025-01-13T15:14:06+01:00',
        },
      };

      service.getAllAuditEvents().subscribe({
        next: (events: AuditEvent[]) => {
          expect(events).toEqual(mockAuditEvents);
          expect(events.length).toBe(2);
        },
      });

      const req = httpMock.expectOne(environment.AUDIT_API_URL());
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      req.flush(mockPagedResponse);
    });

    it('should return empty array when no data in response', () => {
      const mockPagedResponse: PagedAPIResponse<AuditEvent> = {
        response: {
          success: true,
          message: 'No audit events found',
          timestamp: '2025-01-13T15:14:06+01:00',
        },
      };

      service.getAllAuditEvents().subscribe({
        next: (events: AuditEvent[]) => {
          expect(events).toEqual([]);
          expect(events.length).toBe(0);
        },
      });

      const req = httpMock.expectOne(environment.AUDIT_API_URL());
      req.flush(mockPagedResponse);
    });

    it('should handle HTTP error', () => {
      service.getAllAuditEvents().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(environment.AUDIT_API_URL());
      req.flush('Server error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });

  describe('getAuditEventsWithFilters', () => {
    it('should call API with correct pagination parameters', () => {
      const filters = {};
      const pagination = {
        page: 1,
        size: 10,
        sort: 'username',
        direction: 'asc' as const,
      };

      const mockPagedResponse: PagedAPIResponse<AuditEvent> = {
        response: {
          success: true,
          message: 'Filtered audit events retrieved',
          data: {
            links: [],
            content: mockAuditEvents,
            page: { totalElements: 2, totalPages: 1, size: 10, number: 1 },
          },
          timestamp: '2025-01-13T15:14:06+01:00',
        },
      };

      service.getAuditEventsWithFilters(filters, pagination).subscribe({
        next: (response: PagedAPIResponse<AuditEvent>) => {
          expect(response).toEqual(mockPagedResponse);
        },
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === environment.AUDIT_API_URL() &&
          request.params.get('page') === '1' &&
          request.params.get('size') === '10' &&
          request.params.get('sort') === 'username,asc'
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockPagedResponse);
    });

    it('should use default pagination and sorting parameters', () => {
      service.getAuditEventsWithFilters().subscribe();

      const req = httpMock.expectOne((request) => {
        return (
          request.url === environment.AUDIT_API_URL() &&
          request.params.get('sort') === 'timestamp,desc'
        );
      });
      req.flush({
        response: {
          success: true,
          data: {
            links: [],
            content: [],
            page: { totalElements: 0, totalPages: 0, size: 20, number: 0 },
          },
          message: 'Success',
          timestamp: '2025-01-13T15:14:06+01:00',
        },
      });
    });

    it('should call API with all filter parameters', () => {
      const filters = {
        eventType: 'USER_LOGIN',
        username: 'testuser',
        source: 'auth-module',
        ipAddress: '192.168.1.1',
        fromDate: '2025-01-01T00:00:00Z',
        toDate: '2025-01-31T23:59:59Z',
        providerPid: 'provider-123',
        consumerPid: 'consumer-456',
      };

      service.getAuditEventsWithFilters(filters).subscribe();

      const req = httpMock.expectOne((request) => {
        return (
          request.url === environment.AUDIT_API_URL() &&
          request.params.get('eventType') === 'USER_LOGIN' &&
          request.params.get('username') === 'testuser' &&
          request.params.get('source') === 'auth-module' &&
          request.params.get('ipAddress') === '192.168.1.1' &&
          request.params.get('timestamp.from') === '2025-01-01T00:00:00Z' &&
          request.params.get('timestamp.to') === '2025-01-31T23:59:59Z' &&
          request.params.get('details.contractNegotiation.providerPid') ===
            'provider-123' &&
          request.params.get('details.contractNegotiation.consumerPid') ===
            'consumer-456'
        );
      });
      req.flush({
        response: {
          success: true,
          data: {
            links: [],
            content: mockAuditEvents,
            page: { totalElements: 2, totalPages: 1, size: 20, number: 0 },
          },
          message: 'Success',
          timestamp: '2025-01-13T15:14:06+01:00',
        },
      });
    });

    it('should handle HTTP error for filtered request', () => {
      service.getAuditEventsWithFilters({ eventType: 'INVALID' }).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(
        (request) => request.url === environment.AUDIT_API_URL()
      );
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getAuditEventById', () => {
    it('should return audit event by ID', () => {
      const eventId = 'audit-event-1';
      const mockResponse: GenericApiResponse<AuditEvent> = {
        success: true,
        message: 'Audit event retrieved successfully',
        data: mockAuditEvent,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAuditEventById(eventId).subscribe({
        next: (event: AuditEvent) => {
          expect(event).toEqual(mockAuditEvent);
          expect(event.id).toBe(eventId);
        },
      });

      const req = httpMock.expectOne(
        `${environment.AUDIT_API_URL()}/${eventId}`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      req.flush(mockResponse);
    });

    it('should throw error when audit event data is null', () => {
      const eventId = 'nonexistent-event';
      const mockResponse: GenericApiResponse<AuditEvent> = {
        success: true,
        message: 'No data found',
        data: undefined,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAuditEventById(eventId).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.message).toBe(
            `Audit event with id ${eventId} not found`
          );
        },
      });

      const req = httpMock.expectOne(
        `${environment.AUDIT_API_URL()}/${eventId}`
      );
      req.flush(mockResponse);
    });

    it('should handle HTTP error for get by ID', () => {
      const eventId = 'invalid-id';

      service.getAuditEventById(eventId).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(
        `${environment.AUDIT_API_URL()}/${eventId}`
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getAuditEventTypes', () => {
    it('should return audit event types', () => {
      const mockResponse: GenericApiResponse<AuditEventType[]> = {
        success: true,
        message: 'Audit event types retrieved successfully',
        data: mockAuditEventTypes,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAuditEventTypes().subscribe({
        next: (eventTypes: AuditEventType[]) => {
          expect(eventTypes).toEqual(mockAuditEventTypes);
          expect(eventTypes.length).toBe(4);
          expect(eventTypes[0].code).toBe('USER_LOGIN');
          expect(eventTypes[0].description).toBe('User Login');
        },
      });

      const req = httpMock.expectOne(`${environment.AUDIT_API_URL()}/types`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      req.flush(mockResponse);
    });

    it('should return empty array when no event types data', () => {
      const mockResponse: GenericApiResponse<AuditEventType[]> = {
        success: true,
        message: 'No event types found',
        data: undefined,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAuditEventTypes().subscribe({
        next: (eventTypes: AuditEventType[]) => {
          expect(eventTypes).toEqual([]);
          expect(eventTypes.length).toBe(0);
        },
      });

      const req = httpMock.expectOne(`${environment.AUDIT_API_URL()}/types`);
      req.flush(mockResponse);
    });

    it('should handle HTTP error for get event types', () => {
      service.getAuditEventTypes().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.AUDIT_API_URL()}/types`);
      req.flush('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });
});
