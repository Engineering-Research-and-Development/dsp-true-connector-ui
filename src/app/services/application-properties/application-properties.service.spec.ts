import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationProperty } from '../../models/applicationProperty';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { SnackbarService } from '../snackbar/snackbar.service';
import { ApplicationPropertiesService } from './application-properties.service';

// Mock ApplicationProperty data following the test-utils pattern
export const MOCK_APPLICATION_PROPERTY_DAPS: ApplicationProperty = {
  key: 'daps.url',
  value: 'https://daps.example.com',
  sampleValue: 'https://daps.example.com',
  mandatory: true,
  group: 'DAPS',
  label: 'DAPS URL',
  tooltip: 'The URL of the DAPS (Dynamic Attribute Provisioning Service)',
  type: 'string',
};

export const MOCK_APPLICATION_PROPERTY_SECURITY: ApplicationProperty = {
  key: 'security.authentication.enabled',
  value: 'true',
  sampleValue: 'true',
  mandatory: false,
  group: 'Security',
  label: 'Authentication Enabled',
  tooltip: 'Enable or disable authentication for the connector',
  type: 'boolean',
};

export const MOCK_APPLICATION_PROPERTY_GENERAL: ApplicationProperty = {
  key: 'connector.name',
  value: 'Test Connector',
  sampleValue: 'My Connector',
  mandatory: true,
  group: 'General',
  label: 'Connector Name',
  tooltip: 'The display name for this connector instance',
  type: 'string',
};

export const MOCK_APPLICATION_PROPERTIES = [
  MOCK_APPLICATION_PROPERTY_DAPS,
  MOCK_APPLICATION_PROPERTY_SECURITY,
  MOCK_APPLICATION_PROPERTY_GENERAL,
];

describe('ApplicationPropertiesService', () => {
  let service: ApplicationPropertiesService;
  let httpMock: HttpTestingController;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>;
  const propertiesApiUrl = environment.PROPERTIES_API_URL();

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
        ApplicationPropertiesService,
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ApplicationPropertiesService);
    httpMock = TestBed.inject(HttpTestingController);
    snackbarService = TestBed.inject(
      SnackbarService
    ) as jasmine.SpyObj<SnackbarService>;
    errorHandlerService = TestBed.inject(
      ErrorHandlerService
    ) as jasmine.SpyObj<ErrorHandlerService>;

    // Mock the return value of handleError to prevent actual error handling logic during tests
    errorHandlerService.handleError.and.callFake((error) => {
      console.error('Caught by mock handleError:', error?.message || error);
      return throwError(() => error);
    });
  });

  afterEach(() => {
    httpMock.verify(); // Verifies that no requests are outstanding
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- GET PROPERTIES ---
  describe('getProperties', () => {
    it('should retrieve all properties successfully (without filter)', () => {
      const mockResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: true,
        message: 'Properties retrieved successfully',
        data: MOCK_APPLICATION_PROPERTIES,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getProperties().subscribe({
        next: (response) => {
          expect(response).toEqual(MOCK_APPLICATION_PROPERTIES);
          expect(response.length).toBe(3);
          expect(response[0].key).toBe('daps.url');
          expect(response[1].key).toBe('security.authentication.enabled');
          expect(response[2].key).toBe('connector.name');
        },
      });

      const req = httpMock.expectOne(propertiesApiUrl + '/');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.params.keys().length).toBe(0); // No parameters

      req.flush(mockResponse);

      // No snackbar expected for GET requests
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });

    it('should retrieve filtered properties successfully (with key prefix)', () => {
      const dapsProperties = [MOCK_APPLICATION_PROPERTY_DAPS];
      const mockResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: true,
        message: 'Filtered properties retrieved successfully',
        data: dapsProperties,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getProperties('daps').subscribe({
        next: (response) => {
          expect(response).toEqual(dapsProperties);
          expect(response.length).toBe(1);
          expect(response[0].key).toBe('daps.url');
          expect(response[0].group).toBe('DAPS');
        },
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === propertiesApiUrl + '/' &&
          request.params.get('key_prefix') === 'daps'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.params.get('key_prefix')).toBe('daps');

      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });

    it('should handle empty key prefix by ignoring filter', () => {
      const mockResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: true,
        message: 'All properties retrieved',
        data: MOCK_APPLICATION_PROPERTIES,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      // Test with empty string
      service.getProperties('').subscribe({
        next: (response) => {
          expect(response).toEqual(MOCK_APPLICATION_PROPERTIES);
        },
      });

      const req1 = httpMock.expectOne(propertiesApiUrl + '/');
      expect(req1.request.params.keys().length).toBe(0); // No parameters should be added
      req1.flush(mockResponse);

      // Test with whitespace string
      service.getProperties('   ').subscribe({
        next: (response) => {
          expect(response).toEqual(MOCK_APPLICATION_PROPERTIES);
        },
      });

      const req2 = httpMock.expectOne(propertiesApiUrl + '/');
      expect(req2.request.params.keys().length).toBe(0); // No parameters should be added
      req2.flush(mockResponse);
    });

    it('should handle successful response with no data', () => {
      const mockResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: true,
        message: 'No properties found',
        data: [],
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getProperties().subscribe({
        next: (response) => {
          expect(response).toEqual([]);
          expect(response.length).toBe(0);
        },
      });

      const req = httpMock.expectOne(propertiesApiUrl + '/');
      req.flush(mockResponse);
    });

    it('should handle error response from server', () => {
      const errorResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: false,
        message: 'Properties could not be retrieved',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getProperties().subscribe({
        error: (error) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
        },
      });

      const req = httpMock.expectOne(propertiesApiUrl + '/');
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });

    it('should handle HTTP error', () => {
      service.getProperties().subscribe({
        error: (error) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
        },
      });

      const req = httpMock.expectOne(propertiesApiUrl + '/');
      req.error(new ProgressEvent('Network error'));
    });
  });

  // --- UPDATE PROPERTIES ---
  describe('updateProperties', () => {
    it('should update properties successfully', () => {
      const updatedProperties = [
        {
          ...MOCK_APPLICATION_PROPERTY_DAPS,
          value: 'https://new-daps.example.com',
        },
        { ...MOCK_APPLICATION_PROPERTY_SECURITY, value: 'false' },
      ];

      const mockResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: true,
        message: 'Properties updated successfully',
        data: updatedProperties,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateProperties(updatedProperties).subscribe({
        next: (response) => {
          expect(response).toEqual(updatedProperties);
          expect(response.length).toBe(2);
          expect(response[0].value).toBe('https://new-daps.example.com');
          expect(response[1].value).toBe('false');
        },
      });

      const req = httpMock.expectOne(propertiesApiUrl + '/');
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.body).toEqual(updatedProperties);

      req.flush(mockResponse);

      // Check if snackbar was called correctly
      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle empty properties array', () => {
      const emptyProperties: ApplicationProperty[] = [];
      const mockResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: true,
        message: 'No properties to update',
        data: emptyProperties,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateProperties(emptyProperties).subscribe({
        next: (response) => {
          expect(response).toEqual([]);
          expect(response.length).toBe(0);
        },
      });

      const req = httpMock.expectOne(propertiesApiUrl + '/');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual([]);

      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle single property update', () => {
      const singleProperty = [
        {
          ...MOCK_APPLICATION_PROPERTY_GENERAL,
          value: 'Updated Connector Name',
        },
      ];
      const mockResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: true,
        message: 'Property updated successfully',
        data: singleProperty,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateProperties(singleProperty).subscribe({
        next: (response) => {
          expect(response).toEqual(singleProperty);
          expect(response[0].value).toBe('Updated Connector Name');
        },
      });

      const req = httpMock.expectOne(propertiesApiUrl + '/');
      expect(req.request.body).toEqual(singleProperty);
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalled();
    });

    it('should handle error response from server', () => {
      const propertiesToUpdate = [MOCK_APPLICATION_PROPERTY_DAPS];
      const errorResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: false,
        message: 'Properties could not be updated',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateProperties(propertiesToUpdate).subscribe({
        error: (error) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
        },
      });

      const req = httpMock.expectOne(propertiesApiUrl + '/');
      req.flush(errorResponse, {
        status: 400,
        statusText: 'Bad Request',
      });

      // No snackbar should be called on error
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });

    it('should handle HTTP error during update', () => {
      const propertiesToUpdate = [MOCK_APPLICATION_PROPERTY_SECURITY];

      service.updateProperties(propertiesToUpdate).subscribe({
        error: (error) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
        },
      });

      const req = httpMock.expectOne(propertiesApiUrl + '/');
      req.error(new ProgressEvent('Network error'));

      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });

    it('should handle validation errors in properties', () => {
      const invalidProperties = [
        { ...MOCK_APPLICATION_PROPERTY_DAPS, value: '' }, // Empty mandatory field
      ];

      const errorResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: false,
        message: 'Validation failed: mandatory property cannot be empty',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateProperties(invalidProperties).subscribe({
        error: (error) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
        },
      });

      const req = httpMock.expectOne(propertiesApiUrl + '/');
      req.flush(errorResponse, {
        status: 422,
        statusText: 'Unprocessable Entity',
      });
    });
  });

  // --- INTEGRATION TESTS ---
  describe('Integration scenarios', () => {
    it('should handle complete workflow: get -> update -> get', () => {
      // First get all properties
      const initialResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: true,
        message: 'Properties retrieved',
        data: MOCK_APPLICATION_PROPERTIES,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getProperties().subscribe({
        next: (response) => {
          expect(response.length).toBe(3);
        },
      });

      const getReq = httpMock.expectOne(propertiesApiUrl + '/');
      getReq.flush(initialResponse);

      // Then update some properties
      const updatedProperties = [
        {
          ...MOCK_APPLICATION_PROPERTY_DAPS,
          value: 'https://updated-daps.com',
        },
      ];

      const updateResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: true,
        message: 'Properties updated',
        data: updatedProperties,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateProperties(updatedProperties).subscribe({
        next: (response) => {
          expect(response[0].value).toBe('https://updated-daps.com');
        },
      });

      const updateReq = httpMock.expectOne(propertiesApiUrl + '/');
      expect(updateReq.request.method).toBe('PUT');
      updateReq.flush(updateResponse);

      // Finally get properties again to verify update
      const finalResponse: GenericApiResponse<ApplicationProperty[]> = {
        success: true,
        message: 'Updated properties retrieved',
        data: [
          {
            ...MOCK_APPLICATION_PROPERTY_DAPS,
            value: 'https://updated-daps.com',
          },
          MOCK_APPLICATION_PROPERTY_SECURITY,
          MOCK_APPLICATION_PROPERTY_GENERAL,
        ],
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getProperties().subscribe({
        next: (response) => {
          expect(response[0].value).toBe('https://updated-daps.com');
        },
      });

      const finalGetReq = httpMock.expectOne(propertiesApiUrl + '/');
      finalGetReq.flush(finalResponse);

      // Verify snackbar was called only for update
      expect(snackbarService.openSnackBar).toHaveBeenCalledTimes(1);
    });
  });
});
