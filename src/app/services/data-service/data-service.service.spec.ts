import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { DataService } from '../../models/dataService';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { MOCK_DATA_SERVICE } from '../../test-utils/test-utils';
import { SnackbarService } from '../snackbar/snackbar.service';
import { DataServiceService } from './data-service.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DataServiceService', () => {
  let service: DataServiceService;
  let httpMock: HttpTestingController;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  const mockDataService: DataService = MOCK_DATA_SERVICE;

  beforeEach(() => {
    const snackbarSpy = jasmine.createSpyObj('SnackbarService', [
      'openSnackBar',
    ]);

    TestBed.configureTestingModule({
    imports: [],
    providers: [
        DataServiceService,
        { provide: SnackbarService, useValue: snackbarSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
});

    service = TestBed.inject(DataServiceService);
    httpMock = TestBed.inject(HttpTestingController);
    snackbarService = TestBed.inject(
      SnackbarService
    ) as jasmine.SpyObj<SnackbarService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createDataService', () => {
    it('should create a data service successfully', () => {
      const mockResponse: GenericApiResponse<DataService> = {
        success: true,
        message: 'Data service saved',
        data: mockDataService,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.createDataService(mockDataService).subscribe({
        next: (response) => {
          expect(response).toEqual(mockDataService);
        },
      });

      const req = httpMock.expectOne(environment.DATASERVICE_API_URL());
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDataService);
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when creating data service fails', () => {
      const errorResponse: GenericApiResponse<DataService> = {
        success: false,
        message: 'Data service could not be saved',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.createDataService(mockDataService).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(environment.DATASERVICE_API_URL());
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Data service could not be saved',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getAllDataServices', () => {
    it('should retrieve all data services successfully', () => {
      const mockDataServices = [
        mockDataService,
        { ...mockDataService, '@id': 'test-data-service-id-2' },
      ];
      const mockResponse: GenericApiResponse<DataService[]> = {
        success: true,
        message: 'Fetched all data service',
        data: mockDataServices,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllDataServices().subscribe({
        next: (response) => {
          expect(response).toEqual(mockDataServices);
          expect(response.length).toBe(2);
        },
      });

      const req = httpMock.expectOne(environment.DATASERVICE_API_URL());
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving data services fails', () => {
      const errorResponse: GenericApiResponse<DataService[]> = {
        success: false,
        message: 'Data services not found',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllDataServices().subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(environment.DATASERVICE_API_URL());
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal server error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Data services not found',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getDataServiceById', () => {
    it('should retrieve a specific data service successfully', () => {
      const dataServiceId = 'test-data-service-id';
      const mockResponse: GenericApiResponse<DataService> = {
        success: true,
        message: 'Fetched data service',
        data: mockDataService,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getDataServiceById(dataServiceId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockDataService);
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATASERVICE_API_URL()}/${dataServiceId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when data service is not found', () => {
      const dataServiceId = 'test-data-service-id';
      const errorResponse: GenericApiResponse<DataService> = {
        success: false,
        message: `Data service with id: ${dataServiceId} not found`,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getDataServiceById(dataServiceId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATASERVICE_API_URL()}/${dataServiceId}`
      );
      req.flush(errorResponse, {
        status: 404,
        statusText: 'Not Found',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        `An error occurred: Data service with id: ${dataServiceId} not found`,
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('updateDataService', () => {
    it('should update a data service successfully', () => {
      const dataServiceId = 'test-data-service-id';
      const updatedDataService = {
        ...mockDataService,
        title: 'Updated Test Data Service',
      };
      const mockResponse: GenericApiResponse<DataService> = {
        success: true,
        message: 'Data service updated',
        data: updatedDataService,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateDataService(dataServiceId, updatedDataService).subscribe({
        next: (response) => {
          expect(response).toEqual(updatedDataService);
          expect(response.title).toBe('Updated Test Data Service');
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATASERVICE_API_URL()}/${dataServiceId}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedDataService);
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when updating data service fails', () => {
      const dataServiceId = 'test-data-service-id';
      const errorResponse: GenericApiResponse<DataService> = {
        success: false,
        message: 'Data service could not be updated',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateDataService(dataServiceId, mockDataService).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATASERVICE_API_URL()}/${dataServiceId}`
      );
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Data service could not be updated',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('deleteDataService', () => {
    it('should delete a data service successfully', () => {
      const dataServiceId = 'test-data-service-id';
      const mockResponse: GenericApiResponse<void> = {
        success: true,
        message: 'Data service deleted successfully',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.deleteDataService(dataServiceId).subscribe({
        next: (response) => {
          expect(response).toBe(mockResponse.message);
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATASERVICE_API_URL()}/${dataServiceId}`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when deleting data service fails', () => {
      const dataServiceId = 'test-data-service-id';
      const errorResponse: GenericApiResponse<void> = {
        success: false,
        message: 'Data service could not be deleted',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.deleteDataService(dataServiceId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATASERVICE_API_URL()}/${dataServiceId}`
      );
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Data service could not be deleted',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });
});
