import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Artifact } from '../../models/artifact';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { MOCK_ARTIFACT } from '../../test-utils/test-utils';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { ArtifactService } from './artifact.service';

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
      imports: [HttpClientTestingModule],
      providers: [
        ArtifactService,
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
      ],
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

  describe('getAllArtifacts', () => {
    it('should retrieve all artifacts successfully', () => {
      const mockArtifacts = [
        MOCK_ARTIFACT,
        { ...MOCK_ARTIFACT, '@id': 'urn:uuid:test-artifact-id-2' },
      ];
      const mockResponse: GenericApiResponse<Artifact[]> = {
        success: true,
        message: 'Stored artifacts',
        data: mockArtifacts,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllArtifacts().subscribe({
        next: (response) => {
          expect(response).toEqual(mockArtifacts);
          expect(response.length).toBe(2);
        },
      });

      const req = httpMock.expectOne(environment.ARTIFACTS_API_URL());
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving artifacts fails', () => {
      const errorResponse: GenericApiResponse<Artifact[]> = {
        success: false,
        message: 'Artifact and file not found',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllArtifacts().subscribe({
        error: () => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
        },
      });

      const req = httpMock.expectOne(environment.ARTIFACTS_API_URL());
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getArtifactById', () => {
    it('should retrieve artifact by id successfully', () => {
      const artifactId = 'test-artifact-id';
      const mockResponse: GenericApiResponse<Artifact[]> = {
        success: true,
        message: 'Stored artifacts',
        data: [MOCK_ARTIFACT],
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getArtifactById(artifactId).subscribe({
        next: (response) => {
          expect(response).toEqual([MOCK_ARTIFACT]);
        },
      });

      const req = httpMock.expectOne(
        `${environment.ARTIFACTS_API_URL()}/${artifactId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when artifact is not found', () => {
      const artifactId = 'test-artifact-id';
      const errorResponse: GenericApiResponse<Artifact[]> = {
        success: false,
        message: 'Artifact and file not found',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getArtifactById(artifactId).subscribe({
        error: () => {
          expect(errorHandlerService.handleError).toHaveBeenCalled();
        },
      });

      const req = httpMock.expectOne(
        `${environment.ARTIFACTS_API_URL()}/${artifactId}`
      );
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });
    });
  });

  //TODO cover logic for upload and download after changes to sync with BE adding external artifact
});
