import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { ArtifactService } from './artifact.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ArtifactService', () => {
  let service: ArtifactService;
  let httpMock: HttpTestingController;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(() => {
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'handleError',
    ]);
    errorHandlerSpy.handleError.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    TestBed.configureTestingModule({
    imports: [],
    providers: [
        ArtifactService,
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
});

    service = TestBed.inject(ArtifactService);
    httpMock = TestBed.inject(HttpTestingController);
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

  describe('downloadArtifact', () => {
    it('should download artifact successfully', () => {
      const transactionId = 'test-transaction-id';
      const callbackAddress = 'https://api.example.com';
      const mockBlob = new Blob(['test data'], {
        type: 'application/octet-stream',
      });

      service.downloadArtifact(transactionId, callbackAddress).subscribe({
        next: (response) => {
          expect(response).toEqual(mockBlob);
          expect(response instanceof Blob).toBeTrue();
        },
      });

      const req = httpMock.expectOne(
        `${callbackAddress}/artifacts/${transactionId}`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('should handle error when download fails', () => {
      const transactionId = 'test-transaction-id';
      const callbackAddress = 'https://api.example.com';
      const errorResponse = new ProgressEvent('error');

      service.downloadArtifact(transactionId, callbackAddress).subscribe({
        error: (error) => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
          expect(error.message).toBe('Test error');
        },
      });

      const req = httpMock.expectOne(
        `${callbackAddress}/artifacts/${transactionId}`
      );
      req.error(errorResponse);
    });
  });
});
