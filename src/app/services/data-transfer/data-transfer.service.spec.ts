import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { DataTransfer } from '../../models/dataTransfer';
import { DataTransferState } from '../../models/enums/dataTransferState';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { MOCK_DATA_TRANSFER } from '../../test-utils/test-utils';
import { SnackbarService } from '../snackbar/snackbar.service';
import { DataTransferService } from './data-transfer.service';

describe('DataTransferService', () => {
  let service: DataTransferService;
  let httpMock: HttpTestingController;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  const mockDataTransfer = MOCK_DATA_TRANSFER;

  beforeEach(() => {
    const snackbarSpy = jasmine.createSpyObj('SnackbarService', [
      'openSnackBar',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DataTransferService,
        { provide: SnackbarService, useValue: snackbarSpy },
      ],
    });

    service = TestBed.inject(DataTransferService);
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

  describe('requestDataTransfer', () => {
    it('should request a data transfer successfully', () => {
      const transferProcessId = 'test-transfer-process-id';
      const format = 'HTTP_PULL';
      const mockResponse: GenericApiResponse<DataTransfer> = {
        success: true,
        message: 'Data transfer requested successfully',
        data: { ...mockDataTransfer, state: DataTransferState.REQUESTED },
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.requestDataTransfer(transferProcessId, format).subscribe({
        next: (response) => {
          expect(response).toEqual({
            ...mockDataTransfer,
            state: DataTransferState.REQUESTED,
          });
        },
      });

      const req = httpMock.expectOne(environment.DATA_TRANSFER_API_URL());
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ transferProcessId, format });
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when requesting data transfer fails', () => {
      const transferProcessId = 'test-transfer-process-id';
      const format = 'HTTP_PULL';
      const errorResponse: GenericApiResponse<DataTransfer> = {
        success: false,
        message: 'Failed to request data transfer',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.requestDataTransfer(transferProcessId, format).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(environment.DATA_TRANSFER_API_URL());
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to request data transfer',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getAllProviderDataTransfers', () => {
    it('should retrieve all provider data transfers successfully', () => {
      const mockTransfers = [
        mockDataTransfer,
        { ...mockDataTransfer, '@id': 'test-transfer-process-id-2' },
      ];
      const mockResponse: GenericApiResponse<DataTransfer[]> = {
        success: true,
        message: 'Fetched provider data transfers',
        data: mockTransfers,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllProviderDataTransfers().subscribe({
        next: (response) => {
          expect(response).toEqual(mockTransfers);
          expect(response.length).toBe(2);
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATA_TRANSFER_API_URL()}?role=provider`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving provider data transfers fails', () => {
      const errorResponse: GenericApiResponse<DataTransfer[]> = {
        success: false,
        message: 'Failed to fetch provider data transfers',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllProviderDataTransfers().subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATA_TRANSFER_API_URL()}?role=provider`
      );
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to fetch provider data transfers',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getAllConsumerDataTransfers', () => {
    it('should retrieve all consumer data transfers successfully', () => {
      const mockTransfers = [
        mockDataTransfer,
        { ...mockDataTransfer, '@id': 'test-transfer-process-id-2' },
      ];
      const mockResponse: GenericApiResponse<DataTransfer[]> = {
        success: true,
        message: 'Fetched consumer data transfers',
        data: mockTransfers,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllConsumerDataTransfers().subscribe({
        next: (response) => {
          expect(response).toEqual(mockTransfers);
          expect(response.length).toBe(2);
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATA_TRANSFER_API_URL()}?role=consumer`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving consumer data transfers fails', () => {
      const errorResponse: GenericApiResponse<DataTransfer[]> = {
        success: false,
        message: 'Failed to fetch consumer data transfers',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllConsumerDataTransfers().subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATA_TRANSFER_API_URL()}?role=consumer`
      );
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to fetch consumer data transfers',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('startDataTransfer', () => {
    it('should start data transfer successfully', () => {
      const transferProcessId = 'test-transfer-process-id';
      const requestedTransfer = {
        ...mockDataTransfer,
        state: DataTransferState.REQUESTED,
      };
      const mockResponse: GenericApiResponse<DataTransfer> = {
        success: true,
        message: 'Data transfer started successfully',
        data: { ...requestedTransfer, state: DataTransferState.STARTED },
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.startDataTransfer(transferProcessId).subscribe({
        next: (response) => {
          expect(response).toEqual({
            ...requestedTransfer,
            state: DataTransferState.STARTED,
          });
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATA_TRANSFER_API_URL()}/${transferProcessId}/start`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when starting data transfer fails', () => {
      const transferProcessId = 'test-transfer-process-id';
      const errorResponse: GenericApiResponse<DataTransfer> = {
        success: false,
        message: 'Failed to start data transfer',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.startDataTransfer(transferProcessId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATA_TRANSFER_API_URL()}/${transferProcessId}/start`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to start data transfer',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('completeDataTransfer', () => {
    it('should complete data transfer successfully', () => {
      const transferProcessId = 'test-transfer-process-id';
      const startedTransfer = {
        ...mockDataTransfer,
        state: DataTransferState.STARTED,
      };
      const mockResponse: GenericApiResponse<DataTransfer> = {
        success: true,
        message: 'Data transfer completed successfully',
        data: { ...startedTransfer, state: DataTransferState.COMPLETED },
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.completeDataTransfer(transferProcessId).subscribe({
        next: (response) => {
          expect(response).toEqual({
            ...startedTransfer,
            state: DataTransferState.COMPLETED,
          });
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATA_TRANSFER_API_URL()}/${transferProcessId}/complete`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when completing data transfer fails', () => {
      const transferProcessId = 'test-transfer-process-id';
      const errorResponse: GenericApiResponse<DataTransfer> = {
        success: false,
        message: 'Failed to complete data transfer',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.completeDataTransfer(transferProcessId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATA_TRANSFER_API_URL()}/${transferProcessId}/complete`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to complete data transfer',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('suspendDataTransfer', () => {
    it('should suspend data transfer successfully', () => {
      const transferProcessId = 'test-transfer-process-id';
      const startedTransfer = {
        ...mockDataTransfer,
        state: DataTransferState.STARTED,
      };
      const mockResponse: GenericApiResponse<DataTransfer> = {
        success: true,
        message: 'Data transfer suspended successfully',
        data: { ...startedTransfer, state: DataTransferState.SUSPENDED },
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.suspendDataTransfer(transferProcessId).subscribe({
        next: (response) => {
          expect(response).toEqual({
            ...startedTransfer,
            state: DataTransferState.SUSPENDED,
          });
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATA_TRANSFER_API_URL()}/${transferProcessId}/suspend`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when suspending data transfer fails', () => {
      const transferProcessId = 'test-transfer-process-id';
      const errorResponse: GenericApiResponse<DataTransfer> = {
        success: false,
        message: 'Failed to suspend data transfer',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.suspendDataTransfer(transferProcessId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATA_TRANSFER_API_URL()}/${transferProcessId}/suspend`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to suspend data transfer',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('terminateDataTransfer', () => {
    it('should terminate data transfer successfully', () => {
      const transferProcessId = 'test-transfer-process-id';
      const startedTransfer = {
        ...mockDataTransfer,
        state: DataTransferState.STARTED,
      };
      const mockResponse: GenericApiResponse<DataTransfer> = {
        success: true,
        message: 'Data transfer terminated successfully',
        data: { ...startedTransfer, state: DataTransferState.TERMINATED },
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.terminateDataTransfer(transferProcessId).subscribe({
        next: (response) => {
          expect(response).toEqual({
            ...startedTransfer,
            state: DataTransferState.TERMINATED,
          });
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATA_TRANSFER_API_URL()}/${transferProcessId}/terminate`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when terminating data transfer fails', () => {
      const transferProcessId = 'test-transfer-process-id';
      const errorResponse: GenericApiResponse<DataTransfer> = {
        success: false,
        message: 'Failed to terminate data transfer',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.terminateDataTransfer(transferProcessId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATA_TRANSFER_API_URL()}/${transferProcessId}/terminate`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to terminate data transfer',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });
});
