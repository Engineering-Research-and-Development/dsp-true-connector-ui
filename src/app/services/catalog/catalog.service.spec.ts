import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Catalog } from '../../models/catalog';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { MOCK_CATALOG } from '../../test-utils/test-utils';
import { SnackbarService } from '../snackbar/snackbar.service';
import { CatalogService } from './catalog.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  const mockCatalog: Catalog = MOCK_CATALOG;

  beforeEach(() => {
    const snackbarSpy = jasmine.createSpyObj('SnackbarService', [
      'openSnackBar',
    ]);

    TestBed.configureTestingModule({
    imports: [],
    providers: [
        CatalogService,
        { provide: SnackbarService, useValue: snackbarSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
});

    service = TestBed.inject(CatalogService);
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

  describe('createCatalog', () => {
    it('should create a catalog successfully', () => {
      const mockResponse: GenericApiResponse<Catalog> = {
        success: true,
        message: 'Catalog created successfully',
        data: mockCatalog,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.createCatalog(mockCatalog).subscribe({
        next: (response) => {
          expect(response).toEqual(mockCatalog);
        },
      });

      const req = httpMock.expectOne(environment.CATALOG_API_URL());
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCatalog);
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when creating catalog fails', () => {
      const errorResponse: GenericApiResponse<Catalog> = {
        success: false,
        message: 'Failed to create catalog',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.createCatalog(mockCatalog).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(environment.CATALOG_API_URL());
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to create catalog',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getAllCatalogs', () => {
    it('should retrieve all catalogs successfully', () => {
      const mockCatalogs = [
        mockCatalog,
        { ...mockCatalog, '@id': 'test-catalog-id-2' },
      ];
      const mockResponse: GenericApiResponse<Catalog[]> = {
        success: true,
        message: 'Fetched catalog',
        data: mockCatalogs,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllCatalogs().subscribe({
        next: (response) => {
          expect(response).toEqual(mockCatalogs);
          expect(response.length).toBe(2);
        },
      });

      const req = httpMock.expectOne(environment.CATALOG_API_URL());
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving catalogs fails', () => {
      const errorResponse: GenericApiResponse<Catalog[]> = {
        success: false,
        message: 'Catalog not found',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllCatalogs().subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(environment.CATALOG_API_URL());
      req.flush(errorResponse, {
        status: 404,
        statusText: 'Not Found',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Catalog not found',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getCatalogById', () => {
    it('should retrieve a specific catalog successfully', () => {
      const catalogId = 'test-catalog-id';
      const mockResponse: GenericApiResponse<Catalog> = {
        success: true,
        message: 'Fetched catalog',
        data: mockCatalog,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getCatalogById(catalogId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockCatalog);
        },
      });

      const req = httpMock.expectOne(
        `${environment.CATALOG_API_URL()}/${catalogId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when catalog is not found', () => {
      const catalogId = 'test-catalog-id';
      const errorResponse: GenericApiResponse<Catalog> = {
        success: false,
        message: `Catalog with id: ${catalogId} not found`,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getCatalogById(catalogId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.CATALOG_API_URL()}/${catalogId}`
      );
      req.flush(errorResponse, {
        status: 404,
        statusText: 'Not Found',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        `An error occurred: Catalog with id: ${catalogId} not found`,
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('updateCatalog', () => {
    it('should update a catalog successfully', () => {
      const updatedCatalog = { ...mockCatalog, title: 'Updated Test Catalog' };
      const mockResponse: GenericApiResponse<Catalog> = {
        success: true,
        message: 'Catalog updated',
        data: updatedCatalog,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateCatalog(updatedCatalog).subscribe({
        next: (response) => {
          expect(response).toEqual(updatedCatalog);
          expect(response.title).toBe('Updated Test Catalog');
        },
      });

      const req = httpMock.expectOne(
        `${environment.CATALOG_API_URL()}/${updatedCatalog['@id']}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedCatalog);
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when updating catalog fails', () => {
      const errorResponse: GenericApiResponse<Catalog> = {
        success: false,
        message: `Catalog could not be updated`,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.updateCatalog(mockCatalog).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.CATALOG_API_URL()}/${mockCatalog['@id']}`
      );
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal server error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        `An error occurred: Catalog could not be updated`,
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('deleteCatalog', () => {
    it('should delete a catalog successfully', () => {
      const catalogId = 'test-catalog-id';
      const mockResponse: GenericApiResponse<void> = {
        success: true,
        message: 'Catalog deleted successfully',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.deleteCatalog(catalogId).subscribe({
        next: (response) => {
          expect(response).toBe(mockResponse.message);
        },
      });

      const req = httpMock.expectOne(
        `${environment.CATALOG_API_URL()}/${catalogId}`
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

    it('should handle error when deleting catalog fails', () => {
      const catalogId = 'test-catalog-id';
      const errorResponse: GenericApiResponse<void> = {
        success: false,
        message: 'Catalog could not be deleted',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.deleteCatalog(catalogId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.CATALOG_API_URL()}/${catalogId}`
      );
      req.flush(errorResponse, {
        status: 500,
        statusText: 'Internal server error',
      });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Catalog could not be deleted',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });
});
