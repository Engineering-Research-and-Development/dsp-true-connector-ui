import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Catalog } from '../../models/catalog';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { MOCK_CATALOG } from '../../test-utils/test-utils';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { SnackbarService } from '../snackbar/snackbar.service';
import { ProxyService } from './proxy.service';

describe('ProxyService', () => {
  let service: ProxyService;
  let httpMock: HttpTestingController;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(() => {
    const snackbarSpy = jasmine.createSpyObj('SnackbarService', [
      'openSnackBar',
    ]);
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'handleError',
    ]);
    errorHandlerSpy.handleError.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ProxyService,
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
      ],
    });

    service = TestBed.inject(ProxyService);
    httpMock = TestBed.inject(HttpTestingController);
    snackbarService = TestBed.inject(
      SnackbarService
    ) as jasmine.SpyObj<SnackbarService>;
    errorHandlerService = TestBed.inject(
      ErrorHandlerService
    ) as jasmine.SpyObj<ErrorHandlerService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRemoteCatalog', () => {
    it('should retrieve remote catalog successfully', () => {
      const remoteUrl = 'https://remote-connector.com';
      const mockResponse: GenericApiResponse<Catalog> = {
        success: true,
        message: 'Fetched catalog',
        data: MOCK_CATALOG,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getRemoteCatalog(remoteUrl).subscribe({
        next: (response) => {
          expect(response).toEqual(MOCK_CATALOG);
        },
      });

      const req = httpMock.expectOne(`${environment.PROXY_API_URL()}/catalogs`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        'Forward-To': remoteUrl,
      });
      req.flush(mockResponse);
    });

    it('should handle unsuccessful response with snackbar notification', () => {
      const remoteUrl = 'https://remote-connector.com';
      const mockResponse: GenericApiResponse<Catalog> = {
        success: false,
        message: 'Failed to fetch remote catalog',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getRemoteCatalog(remoteUrl).subscribe({
        error: () => {
          expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
            mockResponse.message,
            'OK',
            'center',
            'bottom',
            'snackbar-error'
          );
        },
      });

      const req = httpMock.expectOne(`${environment.PROXY_API_URL()}/catalogs`);
      req.flush(mockResponse);
    });

    it('should handle error response from remote server', () => {
      const remoteUrl = 'https://remote-connector.com';
      const errorResponse = {
        status: 500,
        statusText: 'Internal Server Error',
      };

      service.getRemoteCatalog(remoteUrl).subscribe({
        error: (error) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
        },
      });

      const req = httpMock.expectOne(`${environment.PROXY_API_URL()}/catalogs`);
      req.flush('Error', errorResponse);
    });

    it('should send request with correct headers', () => {
      const remoteUrl = 'https://remote-connector.com';
      const mockResponse: GenericApiResponse<Catalog> = {
        success: true,
        message: 'Remote catalog fetched successfully',
        data: MOCK_CATALOG,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getRemoteCatalog(remoteUrl).subscribe();

      const req = httpMock.expectOne(`${environment.PROXY_API_URL()}/catalogs`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResponse);
    });
  });

  describe('getRemoteDatasetFormats', () => {
    it('should retrieve dataset formats successfully', () => {
      const remoteUrl = 'https://remote-connector.com';
      const dataSetId = 'test-dataset-id';
      const mockFormats = ['CSV', 'JSON', 'XML'];
      const mockResponse: GenericApiResponse<String[]> = {
        success: true,
        message: 'Fetched formats successfully',
        data: mockFormats,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getRemoteDatasetFormats(remoteUrl, dataSetId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockFormats);
        },
      });

      const req = httpMock.expectOne(
        `${environment.PROXY_API_URL()}/datasets/${dataSetId}/formats`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        'Forward-To': remoteUrl,
      });
      req.flush(mockResponse);
    });

    it('should handle error when fetching formats fails', () => {
      const remoteUrl = 'https://remote-connector.com';
      const dataSetId = 'test-dataset-id';
      const mockResponse: GenericApiResponse<String[]> = {
        success: false,
        message: 'Failed to fetch formats',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getRemoteDatasetFormats(remoteUrl, dataSetId).subscribe({
        error: () => {
          expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
            mockResponse.message,
            'OK',
            'center',
            'bottom',
            'snackbar-error'
          );
        },
      });

      const req = httpMock.expectOne(
        `${environment.PROXY_API_URL()}/datasets/${dataSetId}/formats`
      );
      req.flush(mockResponse);
    });
  });
});
