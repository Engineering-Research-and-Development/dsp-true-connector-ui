import { TenantService } from "./tenant.service";
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { SnackbarService } from "../snackbar/snackbar.service";
import { ErrorHandlerService } from "../error-handler/error-handler.service";
import { GenericApiResponse, PagedAPIResponse } from "../../models/genericApiResponse";
import { Tenant } from "../../models/tenant";
import { MOCK_TENANT } from '../../test-utils/test-utils';
import { environment } from "../../../environments/environment";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('TenantService', () => {
  let service: TenantService;
  let httpMock: HttpTestingController;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>;
  const mockTenant: Tenant = MOCK_TENANT;

  beforeEach(() => {
      const snackbarSpy = jasmine.createSpyObj('SnackbarService', [
        'openSnackBar',
      ]);
      const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', [
        'handleError',
      ]);
  
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          TenantService,
          { provide: SnackbarService, useValue: snackbarSpy },
          { provide: ErrorHandlerService, useValue: errorHandlerSpy },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
        ],
      });
  
      service = TestBed.inject(TenantService);
      httpMock = TestBed.inject(HttpTestingController);
      snackbarService = TestBed.inject(
        SnackbarService
      ) as jasmine.SpyObj<SnackbarService>;
      errorHandlerService = TestBed.inject(
        ErrorHandlerService
      ) as jasmine.SpyObj<ErrorHandlerService>;
      errorHandlerService.handleError.and.callFake((error) => {
        let errorMessage = '';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        snackbarService.openSnackBar(
          `An error occurred: ${errorMessage}`,
          'OK',
          'center',
          'bottom',
          'snackbar-error'
        );
        return throwError(() => error);
      });
    });

  describe('getAllTenants', () => {
    it('should retrieve all tenants successfully with default pagination', () => {
      const mockTenants = [
        { id: 'test-tenant-id-1', name: 'Tenant 1', description: 'Description 1', automaticNegotiation: true, automaticTransfer: true, enabled: true, participantId: 'participant-1', bucketName: 'bucket-1' },
        { id: 'test-tenant-id-2', name: 'Tenant 2', description: 'Description 2', automaticNegotiation: true, automaticTransfer: true, enabled: false, participantId: 'participant-2', bucketName: 'bucket-2' },
      ];
      const mockResponse: PagedAPIResponse<Tenant> = {
        response: {
          success: true,
          message: 'Fetched all tenants',
          data: {
            links: [],
            content: mockTenants,
            page: {
              size: 20,
              totalElements: 2,
              totalPages: 1,
              number: 0,
            },
          },
          timestamp: '2026-08-13T15:14:06+01:00',
        },
      };

      service.getAllTenants().subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.response.data?.content.length).toBe(2);
        },
      });

      const req = httpMock.expectOne(req => {
        return req.url === environment.TENANT_API_URL() &&
               req.params.get('sort') === 'name,asc';
      });
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBeNull();
      expect(req.request.params.get('size')).toBeNull();
      req.flush(mockResponse);
    });

    it('should send provided pagination and sorting parameters', () => {
      const mockResponse: PagedAPIResponse<Tenant> = {
        response: {
          success: true,
          message: 'Fetched all tenants',
          data: {
            links: [],
            content: [],
            page: {
              size: 10,
              totalElements: 0,
              totalPages: 0,
              number: 2,
            },
          },
          timestamp: '2026-08-13T15:14:06+01:00',
        },
      };

      service
        .getAllTenants({ page: 2, size: 10, sort: 'description', direction: 'desc' })
        .subscribe();

      const req = httpMock.expectOne(req => {
        return req.url === environment.TENANT_API_URL() &&
               req.params.get('page') === '2' &&
               req.params.get('size') === '10' &&
               req.params.get('sort') === 'description,desc';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTenantById', () => {
    it('should retrieve a tenant by ID successfully', () => {
      const tenantId = 'test-tenant-id';
      const mockResponse: GenericApiResponse<Tenant> = {
            success: true,
            message: 'Fetched tenant',
            data: mockTenant,
            timestamp: '2025-01-13T15:14:06+01:00',
            };

      service.getTenantById(tenantId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockTenant);
        },
      });

      const req = httpMock.expectOne(
        `${environment.TENANT_API_URL()}/${tenantId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when tenant is not found', () => {
      const tenantId = 'non-existent-tenant-id';
      const mockErrorResponse: GenericApiResponse<Tenant> = {
              success: false,
              message: `Tenant with id: ${tenantId} not found`,
              timestamp: '2025-01-13T15:14:06+01:00',
            };

      service.getTenantById(tenantId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(`${environment.TENANT_API_URL()}/${tenantId}`);
      req.flush(mockErrorResponse, { status: 404, statusText: 'Not Found' });
      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        `An error occurred: Tenant with id: ${tenantId} not found`,
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('createTenant', () => {
    it('should create a tenant successfully', () => {
     const mockResponse: GenericApiResponse<Tenant> = {
             success: true,
             message: 'Tenant saved',
             data: mockTenant,
             timestamp: '2025-01-13T15:14:06+01:00',
           };

      service.createTenant(mockTenant).subscribe({
        next: (response) => {
          expect(response).toEqual(mockTenant);
        },
      });

      const req = httpMock.expectOne(environment.TENANT_API_URL());
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockTenant);
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when creating a tenant fails', () => {
      const mockErrorResponse = {
        success: false,
        message: 'Tenant could not be saved',
        timestamp: '2026-08-13T15:14:06+01:00',
      };

      service.createTenant(mockTenant).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(environment.TENANT_API_URL());
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockTenant);

      req.flush(mockErrorResponse, {
        status: 400,
        statusText: 'Bad Request',
      });
    
      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Tenant could not be saved',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('updateTenant', () => {
    it('should update a tenant successfully', () => {
      const tenantId = 'test-tenant-id';
      const mockResponse: GenericApiResponse<Tenant> = {
        success: true,
        message: 'Tenant updated',
        data: mockTenant,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateTenant(tenantId, mockTenant).subscribe({
        next: (response) => {
          expect(response).toEqual(mockTenant);
        },
      });

      const req = httpMock.expectOne(`${environment.TENANT_API_URL()}/${tenantId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockTenant);
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when updating a tenant fails', () => {
      const tenantId = 'test-tenant-id';
      const mockErrorResponse = {
        success: false,
        message: 'Tenant could not be updated',
        timestamp: '2026-08-13T15:14:06+01:00',
      };

      service.updateTenant(tenantId, mockTenant).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(`${environment.TENANT_API_URL()}/${tenantId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockTenant);
      req.flush(mockErrorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Tenant could not be updated',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('enableTenant', () => {
    it('should enable a tenant successfully', () => {
      const tenantId = 'test-tenant-id';
      const mockResponse: GenericApiResponse<Tenant> = {
        success: true,
        message: 'Tenant enabled',
        data: { ...mockTenant, enabled: true },
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.enableTeanant(tenantId).subscribe({
        next: (response) => {
          expect(response.enabled).toBe(true);
        },
      });

      const req = httpMock.expectOne(`${environment.TENANT_API_URL()}/${tenantId}/enable`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'Tenant enabled',
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });
  });

  describe('disableTenant', () => {
    it('should disable a tenant successfully', () => {
      const tenantId = 'test-tenant-id';
      const mockResponse: GenericApiResponse<Tenant> = {
        success: true,
        message: 'Tenant disabled',
        data: { ...mockTenant, enabled: false },
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.disableTenant(tenantId).subscribe({
        next: (response) => {
          expect(response.enabled).toBe(false);
        },
      });

      const req = httpMock.expectOne(`${environment.TENANT_API_URL()}/${tenantId}/disable`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'Tenant disabled',
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });
  });

  describe('deleteTenant', () => {
    it('should delete a tenant successfully', () => {
      const tenantId = 'test-tenant-id';
      const mockResponse: GenericApiResponse<Tenant> = {
        success: true,
        message: 'Tenant deleted',
        data: mockTenant,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.deleteTenant(tenantId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockTenant);
        },
      });

      const req = httpMock.expectOne(`${environment.TENANT_API_URL()}/${tenantId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'Tenant deleted',
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when deleting a tenant fails', () => {
      const tenantId = 'test-tenant-id';
      const mockErrorResponse = {
        success: false,
        message: 'Tenant could not be deleted',
        timestamp: '2026-08-13T15:14:06+01:00',
      };

      service.deleteTenant(tenantId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(`${environment.TENANT_API_URL()}/${tenantId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockErrorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Tenant could not be deleted',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });
});
