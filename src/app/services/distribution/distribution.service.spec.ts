import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Distribution } from '../../models/distribution';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { MOCK_DISTRIBUTION } from '../../test-utils/test-utils';
import { SnackbarService } from '../snackbar/snackbar.service';
import { DistributionService } from './distribution.service';

describe('DistributionService', () => {
  let service: DistributionService;
  let httpMock: HttpTestingController;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  const mockDistribution: Distribution = MOCK_DISTRIBUTION;

  beforeEach(() => {
    const snackbarSpy = jasmine.createSpyObj('SnackbarService', [
      'openSnackBar',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DistributionService,
        { provide: SnackbarService, useValue: snackbarSpy },
      ],
    });

    service = TestBed.inject(DistributionService);
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

  describe('createDistribution', () => {
    it('should create a distribution successfully', () => {
      const mockResponse: GenericApiResponse<Distribution> = {
        success: true,
        message: 'Distribution saved',
        data: mockDistribution,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.createDistribution(mockDistribution).subscribe({
        next: (response) => {
          expect(response).toEqual(mockDistribution);
        },
      });

      const req = httpMock.expectOne(environment.DISTRIBUTION_API_URL());
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDistribution);
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when creating distribution fails', () => {
      const errorResponse: GenericApiResponse<Distribution> = {
        success: false,
        message: 'Distribution could not be saved',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.createDistribution(mockDistribution).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(environment.DISTRIBUTION_API_URL());
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Distribution could not be saved',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getAllDistributions', () => {
    it('should retrieve all distributions successfully', () => {
      const mockDistributions = [
        mockDistribution,
        { ...mockDistribution, '@id': 'test-distribution-id-2' },
      ];
      const mockResponse: GenericApiResponse<Distribution[]> = {
        success: true,
        message: 'Fetched all distributions',
        data: mockDistributions,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllDistributions().subscribe({
        next: (response) => {
          expect(response).toEqual(mockDistributions);
          expect(response.length).toBe(2);
        },
      });

      const req = httpMock.expectOne(environment.DISTRIBUTION_API_URL());
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving distributions fails', () => {
      const errorResponse: GenericApiResponse<Distribution[]> = {
        success: false,
        message: 'Distributions not found',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllDistributions().subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(environment.DISTRIBUTION_API_URL());
      req.flush(errorResponse, {
        status: 404,
        statusText: 'Not Found',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Distributions not found',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getDistributionById', () => {
    it('should retrieve a specific distribution successfully', () => {
      const distributionId = 'test-distribution-id';
      const mockResponse: GenericApiResponse<Distribution> = {
        success: true,
        message: 'Fetched distribution',
        data: mockDistribution,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getDistributionById(distributionId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockDistribution);
        },
      });

      const req = httpMock.expectOne(
        `${environment.DISTRIBUTION_API_URL()}/${distributionId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when distribution is not found', () => {
      const distributionId = 'test-distribution-id';
      const errorResponse: GenericApiResponse<Distribution> = {
        success: false,
        message: `Distribution with id: ${distributionId} not found`,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getDistributionById(distributionId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DISTRIBUTION_API_URL()}/${distributionId}`
      );
      req.flush(errorResponse, {
        status: 404,
        statusText: 'Not Found',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        `An error occurred: Distribution with id: ${distributionId} not found`,
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('updateDistribution', () => {
    it('should update a distribution successfully', () => {
      const distributionId = 'test-distribution-id';
      const updatedDistribution = {
        ...mockDistribution,
        title: 'Updated Test Distribution',
      };
      const mockResponse: GenericApiResponse<Distribution> = {
        success: true,
        message: 'Distribution updated',
        data: updatedDistribution,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service
        .updateDistribution(distributionId, updatedDistribution)
        .subscribe({
          next: (response) => {
            expect(response).toEqual(updatedDistribution);
            expect(response.title).toBe('Updated Test Distribution');
          },
        });

      const req = httpMock.expectOne(
        `${environment.DISTRIBUTION_API_URL()}/${distributionId}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedDistribution);
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when updating distribution fails', () => {
      const distributionId = 'test-distribution-id';
      const errorResponse: GenericApiResponse<Distribution> = {
        success: false,
        message: 'Distribution could not be updated',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateDistribution(distributionId, mockDistribution).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DISTRIBUTION_API_URL()}/${distributionId}`
      );
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Distribution could not be updated',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('deleteDistribution', () => {
    it('should delete a distribution successfully', () => {
      const distributionId = 'test-distribution-id';
      const mockResponse: GenericApiResponse<void> = {
        success: true,
        message: 'Distribution deleted successfully',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.deleteDistribution(distributionId).subscribe({
        next: (response) => {
          expect(response).toBe(mockResponse.message);
        },
      });

      const req = httpMock.expectOne(
        `${environment.DISTRIBUTION_API_URL()}/${distributionId}`
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

    it('should handle error when deleting distribution fails', () => {
      const distributionId = 'test-distribution-id';
      const errorResponse: GenericApiResponse<void> = {
        success: false,
        message: 'Distribution could not be deleted',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.deleteDistribution(distributionId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DISTRIBUTION_API_URL()}/${distributionId}`
      );
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Distribution could not be deleted',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });
});
