import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs'; // <--- ADD THIS LINE
import { environment } from '../../../environments/environment';
import { Artifact } from '../../models/artifact';
import { Dataset } from '../../models/dataset';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { MOCK_ARTIFACT, MOCK_DATASET } from '../../test-utils/test-utils';
import { ErrorHandlerService } from '../error-handler/error-handler.service'; // Import ErrorHandlerService
import { SnackbarService } from '../snackbar/snackbar.service';
import { DatasetService } from './dataset.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DatasetService', () => {
  let service: DatasetService;
  let httpMock: HttpTestingController;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>; // Mock ErrorHandlerService
  const mockDataset: Dataset = MOCK_DATASET;
  const datasetApiUrl = environment.DATASET_API_URL(); // Use a constant for the URL

  beforeEach(() => {
    const snackbarSpy = jasmine.createSpyObj('SnackbarService', [
      'openSnackBar',
    ]);
    // Create a spy object for ErrorHandlerService
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'handleError',
    ]);

    TestBed.configureTestingModule({
    imports: [],
    providers: [
        DatasetService,
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
});

    service = TestBed.inject(DatasetService);
    httpMock = TestBed.inject(HttpTestingController);
    snackbarService = TestBed.inject(
      SnackbarService
    ) as jasmine.SpyObj<SnackbarService>;
    errorHandlerService = TestBed.inject(
      // Inject the mock
      ErrorHandlerService
    ) as jasmine.SpyObj<ErrorHandlerService>;
    // Mock the return value of handleError to prevent actual error handling logic during tests
    errorHandlerService.handleError.and.callFake((error) => {
      // Log the error or perform any *side effects* the real handler would
      console.error('Caught by mock handleError:', error?.message || error);

      // Return an Observable that emits the error
      // This mimics the typical behavior of re-throwing the error
      // after handling side effects.
      return throwError(() => error);
    });
  });

  afterEach(() => {
    httpMock.verify(); // Verifies that no requests are outstanding.
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- CREATE DATASET ---
  describe('createDataset', () => {
    it('should create a dataset successfully (without file/url)', () => {
      const mockResponse: GenericApiResponse<Dataset> = {
        success: true,
        message: 'Saved dataset',
        data: mockDataset,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      // Call the service method (only dataset provided)
      service.createDataset(mockDataset).subscribe({
        next: (response) => {
          expect(response).toEqual(mockDataset); // Expect the actual dataset object in the response
        },
      });

      const req = httpMock.expectOne(datasetApiUrl);
      expect(req.request.method).toBe('POST');

      // --- Test FormData ---
      expect(req.request.body).toBeInstanceOf(FormData); // Check if the body is FormData
      const formData = req.request.body as FormData;

      // Check the 'dataset' part
      const datasetPayload = formData.get('dataset');
      expect(datasetPayload).toBeTruthy(); // Make sure the key exists
      expect(typeof datasetPayload).toBe('string'); // It should be a stringified JSON
      expect(JSON.parse(datasetPayload as string)).toEqual(mockDataset); // Parse and compare

      // Check that file/url/auth keys are NOT present in this case
      expect(formData.has('file')).toBeFalse();
      expect(formData.has('url')).toBeFalse();
      expect(formData.has('authorization')).toBeFalse();
      // --- End FormData Test ---

      // Headers: HttpClient sets multipart/form-data automatically, no need to check 'Content-Type':'application/json'
      // expect(req.request.headers.get('Content-Type')).toContain('multipart/form-data'); // Optional check

      req.flush(mockResponse); // Respond with the mock success response

      // Check if snackbar was called correctly
      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should create a dataset successfully (with file)', () => {
      const mockFile = new File(['dummy content'], 'test.txt', {
        type: 'text/plain',
      });
      const mockResponse: GenericApiResponse<Dataset> = {
        success: true,
        message: 'Saved dataset with file',
        data: mockDataset,
        timestamp: '...',
      };

      service.createDataset(mockDataset, mockFile).subscribe((response) => {
        expect(response).toEqual(mockDataset);
      });

      const req = httpMock.expectOne(datasetApiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      const formData = req.request.body as FormData;

      // Check dataset part
      expect(JSON.parse(formData.get('dataset') as string)).toEqual(
        mockDataset
      );

      // Check file part
      const filePayload = formData.get('file');
      expect(filePayload).toBeTruthy();
      expect(filePayload).toBeInstanceOf(File);
      expect((filePayload as File).name).toBe(mockFile.name);
      expect((filePayload as File).size).toBe(mockFile.size);
      expect((filePayload as File).type).toBe(mockFile.type);

      expect(formData.has('url')).toBeFalse();
      expect(formData.has('authorization')).toBeFalse();

      req.flush(mockResponse);
      expect(snackbarService.openSnackBar).toHaveBeenCalled(); // Basic check
    });

    it('should create a dataset successfully (with externalURL and authorization)', () => {
      const externalURL = 'http://example.com/data';
      const authorization = 'Bearer token123';
      const mockResponse: GenericApiResponse<Dataset> = {
        success: true,
        message: 'Saved dataset with URL',
        data: mockDataset,
        timestamp: '...',
      };

      service
        .createDataset(mockDataset, undefined, externalURL, authorization)
        .subscribe((response) => {
          expect(response).toEqual(mockDataset);
        });

      const req = httpMock.expectOne(datasetApiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      const formData = req.request.body as FormData;

      // Check dataset part
      expect(JSON.parse(formData.get('dataset') as string)).toEqual(
        mockDataset
      );

      // Check URL and Auth parts
      expect(formData.get('url')).toBe(externalURL);
      expect(formData.get('authorization')).toBe(authorization);
      expect(formData.has('file')).toBeFalse();

      req.flush(mockResponse);
      expect(snackbarService.openSnackBar).toHaveBeenCalled(); // Basic check
    });

    it('should handle error when creating dataset fails', () => {
      const errorResponse: GenericApiResponse<Dataset> = {
        // Error structure from API
        success: false,
        message: 'Dataset could not be saved',
        timestamp: '2025-01-13T15:14:06+01:00',
      };
      const status = 500;
      const statusText = 'Internal Server Error';

      // Call the service method
      service.createDataset(mockDataset).subscribe({
        next: () => fail('should have failed'), // Fail if next is called
        error: (err) => {
          // Error should be handled by ErrorHandlerService,
          // verify that the handler was called.
          expect(errorHandlerService.handleError).toHaveBeenCalled();
          // Optionally check the error passed to the handler if needed
          const handledError =
            errorHandlerService.handleError.calls.mostRecent().args[0];
          expect(handledError.status).toBe(status);
          expect(handledError.error).toEqual(errorResponse); // Check the body of the error
        },
      });

      const req = httpMock.expectOne(datasetApiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData); // Still sends FormData

      // Respond with an error
      req.flush(errorResponse, { status, statusText });

      // --- Check snackbar through ErrorHandlerService ---
      // We now assume ErrorHandlerService is responsible for showing the snackbar on error.
      // So, we *don't* expect snackbarService.openSnackBar to be called directly here.
      // If ErrorHandlerService *doesn't* call the snackbar, this test passes correctly.
      // If ErrorHandlerService *does* call the snackbar, you'd need to test ErrorHandlerService itself
      // to ensure it calls snackbarService with the correct parameters based on the error.
      // For this DatasetService test, we primarily care that the error was *passed* to the handler.
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled(); // It should be called by the error handler, not directly
    });
  });

  // --- GET ALL DATASETS ---
  describe('getAllDatasets', () => {
    // This method doesn't use FormData, so its tests should remain largely the same.
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

      const req = httpMock.expectOne(datasetApiUrl);
      expect(req.request.method).toBe('GET');
      // Check headers for GET requests (using httpOptions)
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResponse);

      // Should not call snackbar on successful GET ALL
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });

    it('should handle error when retrieving datasets fails', () => {
      const errorResponse: GenericApiResponse<Dataset[]> = {
        success: false,
        message: 'Datasets not found',
        timestamp: '2025-01-13T15:14:06+01:00',
      };
      const status = 500;
      const statusText = 'Internal Server Error';

      service.getAllDatasets().subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
          const handledError =
            errorHandlerService.handleError.calls.mostRecent().args[0];
          expect(handledError.status).toBe(status);
          expect(handledError.error).toEqual(errorResponse);
        },
      });

      const req = httpMock.expectOne(datasetApiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(errorResponse, { status, statusText });

      // Expect error handler to be called, not snackbar directly
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });
  });

  // --- GET DATASET BY ID ---
  describe('getDatasetById', () => {
    // This method doesn't use FormData, so its tests should remain largely the same.
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

      const req = httpMock.expectOne(`${datasetApiUrl}/${datasetId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResponse);

      // Should not call snackbar on successful GET BY ID
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });

    it('should handle error when dataset is not found', () => {
      const datasetId = 'test-dataset-id';
      const errorResponse: GenericApiResponse<Dataset> = {
        success: false,
        message: `Dataset with id: ${datasetId} not found`,
        timestamp: '2025-01-13T15:14:06+01:00',
      };
      const status = 404;
      const statusText = 'Not Found';

      service.getDatasetById(datasetId).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
          const handledError =
            errorHandlerService.handleError.calls.mostRecent().args[0];
          expect(handledError.status).toBe(status);
          expect(handledError.error).toEqual(errorResponse);
        },
      });

      const req = httpMock.expectOne(`${datasetApiUrl}/${datasetId}`);
      expect(req.request.method).toBe('GET');
      req.flush(errorResponse, { status, statusText });

      // Expect error handler to be called, not snackbar directly
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });
  });

  // --- UPDATE DATASET ---
  describe('updateDataset', () => {
    it('should update a dataset successfully (without file/url)', () => {
      const datasetId = mockDataset['@id'] ?? 'test-dataset-id'; // Use ID from mock if available
      const updatedDataset = { ...mockDataset, title: 'Updated Test Dataset' };
      const mockResponse: GenericApiResponse<Dataset> = {
        success: true,
        message: 'Dataset updated',
        data: updatedDataset,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      // Call the service method (only id and dataset provided)
      service.updateDataset(datasetId, updatedDataset).subscribe({
        next: (response) => {
          expect(response).toEqual(updatedDataset);
          expect(response.title).toBe('Updated Test Dataset');
        },
      });

      const req = httpMock.expectOne(`${datasetApiUrl}/${datasetId}`);
      expect(req.request.method).toBe('PUT'); // Assuming PUT for update

      // --- Test FormData ---
      expect(req.request.body).toBeInstanceOf(FormData);
      const formData = req.request.body as FormData;

      // Check the 'dataset' part
      const datasetPayload = formData.get('dataset');
      expect(datasetPayload).toBeTruthy();
      expect(typeof datasetPayload).toBe('string');
      expect(JSON.parse(datasetPayload as string)).toEqual(updatedDataset); // Compare with updatedDataset

      // Check that file/url/auth keys are NOT present
      expect(formData.has('file')).toBeFalse();
      expect(formData.has('url')).toBeFalse();
      expect(formData.has('authorization')).toBeFalse();
      // --- End FormData Test ---

      // Headers: No explicit 'Content-Type':'application/json' expected
      req.flush(mockResponse); // Respond with the mock success response

      // Check if snackbar was called correctly
      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should update a dataset successfully (with file)', () => {
      const datasetId = mockDataset['@id'] ?? 'test-dataset-id';
      const updatedDataset = { ...mockDataset, title: 'Updated Title File' };
      const mockFile = new File(['new content'], 'new_file.txt', {
        type: 'text/plain',
      });
      const mockResponse: GenericApiResponse<Dataset> = {
        success: true,
        message: 'Updated dataset with file',
        data: updatedDataset,
        timestamp: '...',
      };

      service
        .updateDataset(datasetId, updatedDataset, mockFile)
        .subscribe((response) => {
          expect(response).toEqual(updatedDataset);
        });

      const req = httpMock.expectOne(`${datasetApiUrl}/${datasetId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeInstanceOf(FormData);
      const formData = req.request.body as FormData;

      // Check dataset part
      expect(JSON.parse(formData.get('dataset') as string)).toEqual(
        updatedDataset
      );

      // Check file part
      const filePayload = formData.get('file');
      expect(filePayload).toBeTruthy();
      expect(filePayload).toBeInstanceOf(File);
      expect((filePayload as File).name).toBe(mockFile.name);

      expect(formData.has('url')).toBeFalse();
      expect(formData.has('authorization')).toBeFalse();

      req.flush(mockResponse);
      expect(snackbarService.openSnackBar).toHaveBeenCalled(); // Basic check
    });

    it('should update a dataset successfully (with externalURL)', () => {
      const datasetId = mockDataset['@id'] ?? 'test-dataset-id';
      const updatedDataset = { ...mockDataset, title: 'Updated Title URL' };
      const externalURL = 'http://example.com/new_data';
      const mockResponse: GenericApiResponse<Dataset> = {
        success: true,
        message: 'Updated dataset with URL',
        data: updatedDataset,
        timestamp: '...',
      };

      // Note: Providing undefined for the file argument
      service
        .updateDataset(datasetId, updatedDataset, undefined, externalURL)
        .subscribe((response) => {
          expect(response).toEqual(updatedDataset);
        });

      const req = httpMock.expectOne(`${datasetApiUrl}/${datasetId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeInstanceOf(FormData);
      const formData = req.request.body as FormData;

      // Check dataset part
      expect(JSON.parse(formData.get('dataset') as string)).toEqual(
        updatedDataset
      );

      // Check URL part
      expect(formData.get('url')).toBe(externalURL);
      // Check Auth part (should not be present if not provided)
      expect(formData.has('authorization')).toBeFalse();
      expect(formData.has('file')).toBeFalse();

      req.flush(mockResponse);
      expect(snackbarService.openSnackBar).toHaveBeenCalled(); // Basic check
    });

    it('should handle error when updating dataset fails', () => {
      const datasetId = mockDataset['@id'] ?? 'test-dataset-id';
      const errorResponse: GenericApiResponse<Dataset> = {
        success: false,
        message: 'Dataset could not be updated',
        timestamp: '2025-01-13T15:14:06+01:00',
      };
      const status = 500;
      const statusText = 'Internal Server Error';

      // Pass the original mockDataset for the update attempt that fails
      service.updateDataset(datasetId, mockDataset).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
          const handledError =
            errorHandlerService.handleError.calls.mostRecent().args[0];
          expect(handledError.status).toBe(status);
          expect(handledError.error).toEqual(errorResponse);
        },
      });

      const req = httpMock.expectOne(`${datasetApiUrl}/${datasetId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeInstanceOf(FormData); // It still sends FormData

      req.flush(errorResponse, { status, statusText });

      // Expect error handler to be called, not snackbar directly
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });
  });

  // --- DELETE DATASET ---
  describe('deleteDataset', () => {
    // This method doesn't use FormData, uses standard JSON headers.
    it('should delete a dataset successfully', () => {
      const datasetId = 'test-dataset-id';
      const mockResponse: GenericApiResponse<void> = {
        // API might return void or the deleted object's ID/message
        success: true,
        message: 'Dataset deleted successfully',
        // data: might be null or undefined
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      // Service method expects Observable<string> (the message)
      service.deleteDataset(datasetId).subscribe({
        next: (responseMessage) => {
          expect(responseMessage).toBe(mockResponse.message); // Check if the message is returned
        },
      });

      const req = httpMock.expectOne(`${datasetApiUrl}/${datasetId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Content-Type')).toBe('application/json'); // Check header
      req.flush(mockResponse); // Respond with the mock success response

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
      const status = 500;
      const statusText = 'Internal Server Error';

      service.deleteDataset(datasetId).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
          const handledError =
            errorHandlerService.handleError.calls.mostRecent().args[0];
          expect(handledError.status).toBe(status);
          expect(handledError.error).toEqual(errorResponse);
        },
      });

      const req = httpMock.expectOne(`${datasetApiUrl}/${datasetId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(errorResponse, { status, statusText });

      // Expect error handler to be called, not snackbar directly
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });
  });

  // --- GET ALL FORMATS ---
  describe('getAllFormats', () => {
    // This method uses standard JSON headers.
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

      const req = httpMock.expectOne(`${datasetApiUrl}/${datasetId}/formats`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResponse);

      // No snackbar expected
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });

    it('should handle error when retrieving formats fails', () => {
      const datasetId = 'test-dataset-id';
      const errorResponse: GenericApiResponse<string[]> = {
        success: false,
        message: `Dataset with id: ${datasetId} has no distributions with format`,
        timestamp: '2025-01-13T15:14:06+01:00',
      };
      const status = 404;
      const statusText = 'Not Found';

      service.getAllFormats(datasetId).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
          const handledError =
            errorHandlerService.handleError.calls.mostRecent().args[0];
          expect(handledError.status).toBe(status);
          expect(handledError.error).toEqual(errorResponse);
        },
      });

      const req = httpMock.expectOne(`${datasetApiUrl}/${datasetId}/formats`);
      expect(req.request.method).toBe('GET');
      req.flush(errorResponse, { status, statusText });

      // Expect error handler to be called, not snackbar directly
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });
  });

  // --- GET ARTIFACT ---
  describe('getArtifact', () => {
    // This method uses standard JSON headers.
    it('should retrieve artifact successfully', () => {
      const datasetId = 'test-dataset-id';
      const mockArtifacts = [
        MOCK_ARTIFACT,
        { ...MOCK_ARTIFACT, id: 'urn:uuid:test-artifact-id-2' }, // Use 'id' as per Artifact interface
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

      const req = httpMock.expectOne(`${datasetApiUrl}/${datasetId}/artifact`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResponse);

      // No snackbar expected
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });

    it('should handle error when retrieving artifacts fails', () => {
      const datasetId = 'test-dataset-id';
      const errorResponse: GenericApiResponse<Artifact[]> = {
        success: false,
        message: `Dataset with id: ${datasetId} has no artifact`, // Note the space difference in log vs code
        timestamp: '2025-01-13T15:14:06+01:00',
      };
      const status = 404;
      const statusText = 'Not Found';

      service.getArtifact(datasetId).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
          const handledError =
            errorHandlerService.handleError.calls.mostRecent().args[0];
          expect(handledError.status).toBe(status);
          // Adjust expected error message if needed based on actual API response
          // Using .toContain if the exact message might vary slightly (e.g., whitespace)
          expect(handledError.error.message).toContain(
            `Dataset with id: ${datasetId}`
          );
          expect(handledError.error.message).toContain('has no artifact');
          // Or use exact match if confident:
          // expect(handledError.error).toEqual(errorResponse);
        },
      });

      const req = httpMock.expectOne(`${datasetApiUrl}/${datasetId}/artifact`);
      expect(req.request.method).toBe('GET');
      req.flush(errorResponse, { status, statusText });

      // Expect error handler to be called, not snackbar directly
      expect(snackbarService.openSnackBar).not.toHaveBeenCalled();
    });
  });
});
