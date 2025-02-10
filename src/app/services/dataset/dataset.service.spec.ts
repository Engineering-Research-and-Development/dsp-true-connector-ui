import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Artifact } from '../../models/artifact';
import { Dataset } from '../../models/dataset';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { MOCK_ARTIFACT, MOCK_DATASET } from '../../test-utils/test-utils';
import { SnackbarService } from '../snackbar/snackbar.service';
import { DatasetService } from './dataset.service';

describe('DatasetService', () => {
  let service: DatasetService;
  let httpMock: HttpTestingController;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  const mockDataset: Dataset = MOCK_DATASET;

  beforeEach(() => {
    const snackbarSpy = jasmine.createSpyObj('SnackbarService', [
      'openSnackBar',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DatasetService,
        { provide: SnackbarService, useValue: snackbarSpy },
      ],
    });

    service = TestBed.inject(DatasetService);
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

  describe('createDataset', () => {
    it('should create a dataset successfully', () => {
      const mockResponse: GenericApiResponse<Dataset> = {
        success: true,
        message: 'Saved dataset',
        data: mockDataset,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.createDataset(mockDataset).subscribe({
        next: (response) => {
          expect(response).toEqual(mockDataset);
        },
      });

      const req = httpMock.expectOne(environment.DATASET_API_URL());
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDataset);
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when creating dataset fails', () => {
      const errorResponse: GenericApiResponse<Dataset> = {
        success: false,
        message: 'Dataset could not be saved',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.createDataset(mockDataset).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(environment.DATASET_API_URL());
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Dataset could not be saved',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getAllDatasets', () => {
    it('should retrieve all datasets successfully', () => {
      const mockDatasets = [
        mockDataset,
        { ...mockDataset, '@id': 'test-dataset-id-2' },
      ];
      const mockResponse: GenericApiResponse<Dataset[]> = {
        success: true,
        message: 'Fetched datasets',
        data: mockDatasets,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllDatasets().subscribe({
        next: (response) => {
          expect(response).toEqual(mockDatasets);
          expect(response.length).toBe(2);
        },
      });

      const req = httpMock.expectOne(environment.DATASET_API_URL());
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving datasets fails', () => {
      const errorResponse: GenericApiResponse<Dataset[]> = {
        success: false,
        message: 'Datasets not found',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllDatasets().subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(environment.DATASET_API_URL());
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Datasets not found',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getDatasetById', () => {
    it('should retrieve a specific dataset successfully', () => {
      const datasetId = 'test-dataset-id';
      const mockResponse: GenericApiResponse<Dataset> = {
        success: true,
        message: 'Fetched dataset',
        data: mockDataset,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getDatasetById(datasetId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockDataset);
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATASET_API_URL()}/${datasetId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when dataset is not found', () => {
      const datasetId = 'test-dataset-id';
      const errorResponse: GenericApiResponse<Dataset> = {
        success: false,
        message: `Dataset with id: ${datasetId} not found`,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getDatasetById(datasetId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATASET_API_URL()}/${datasetId}`
      );
      req.flush(errorResponse, {
        status: 404,
        statusText: 'Not Found',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        `An error occurred: Dataset with id: ${datasetId} not found`,
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('updateDataset', () => {
    it('should update a dataset successfully', () => {
      const datasetId = 'test-dataset-id';
      const updatedDataset = { ...mockDataset, title: 'Updated Test Dataset' };
      const mockResponse: GenericApiResponse<Dataset> = {
        success: true,
        message: 'Dataset updated',
        data: updatedDataset,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateDataset(datasetId, updatedDataset).subscribe({
        next: (response) => {
          expect(response).toEqual(updatedDataset);
          expect(response.title).toBe('Updated Test Dataset');
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATASET_API_URL()}/${datasetId}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedDataset);
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when updating dataset fails', () => {
      const datasetId = 'test-dataset-id';
      const errorResponse: GenericApiResponse<Dataset> = {
        success: false,
        message: 'Dataset could not be updated',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateDataset(datasetId, mockDataset).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATASET_API_URL()}/${datasetId}`
      );
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Dataset could not be updated',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('deleteDataset', () => {
    it('should delete a dataset successfully', () => {
      const datasetId = 'test-dataset-id';
      const mockResponse: GenericApiResponse<void> = {
        success: true,
        message: 'Dataset deleted successfully',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.deleteDataset(datasetId).subscribe({
        next: (response) => {
          expect(response).toBe(mockResponse.message);
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATASET_API_URL()}/${datasetId}`
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

    it('should handle error when deleting dataset fails', () => {
      const datasetId = 'test-dataset-id';
      const errorResponse: GenericApiResponse<void> = {
        success: false,
        message: 'Dataset could not be deleted',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.deleteDataset(datasetId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATASET_API_URL()}/${datasetId}`
      );
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Dataset could not be deleted',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getAllFormats', () => {
    it('should retrieve all formats successfully', () => {
      const datasetId = 'test-dataset-id';
      const mockFormats = ['JSON', 'XML', 'CSV'];
      const mockResponse: GenericApiResponse<string[]> = {
        success: true,
        message: 'Fetched formats',
        data: mockFormats,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllFormats(datasetId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockFormats);
          expect(response.length).toBe(3);
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATASET_API_URL()}/${datasetId}/formats`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving formats fails', () => {
      const datasetId = 'test-dataset-id';
      const errorResponse: GenericApiResponse<string[]> = {
        success: false,
        message: `Dataset with id: ${datasetId} has no distributions with format`,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllFormats(datasetId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATASET_API_URL()}/${datasetId}/formats`
      );
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        `An error occurred: Dataset with id: ${datasetId} has no distributions with format`,
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getArtifact', () => {
    it('should retrieve artifact successfully', () => {
      const datasetId = 'test-dataset-id';
      const mockArtifacts = [
        MOCK_ARTIFACT,
        { ...MOCK_ARTIFACT, '@id': 'test-artifact-id-2' },
      ];
      const mockResponse: GenericApiResponse<Artifact[]> = {
        success: true,
        message: 'Fetched artifact',
        data: mockArtifacts,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getArtifact(datasetId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockArtifacts);
          expect(response.length).toBe(2);
        },
      });

      const req = httpMock.expectOne(
        `${environment.DATASET_API_URL()}/${datasetId}/artifact`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving artifacts fails', () => {
      const datasetId = 'test-dataset-id';
      const errorResponse: GenericApiResponse<Artifact[]> = {
        success: false,
        message: `Dataset with id: ${datasetId}  has no artifact`,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getArtifact(datasetId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.DATASET_API_URL()}/${datasetId}/artifact`
      );
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        `An error occurred: Dataset with id: ${datasetId}  has no artifact`,
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });
});
