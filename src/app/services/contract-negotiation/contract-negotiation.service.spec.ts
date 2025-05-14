import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ContractNegotiation } from '../../models/contractNegotiation';
import { ContractNegotiationState } from '../../models/enums/contractNegotiationState';
import { GenericApiResponse } from '../../models/genericApiResponse';
import {
  MOCK_CONTRACT_NEGOTIATION,
  MOCK_CONTRACT_NEGOTIATION_ACCEPTED,
  MOCK_CONTRACT_NEGOTIATION_AGREED,
  MOCK_CONTRACT_NEGOTIATION_FINALIZED,
  MOCK_CONTRACT_NEGOTIATION_REQUESTED,
  MOCK_CONTRACT_NEGOTIATION_TERMINATED,
  MOCK_CONTRACT_NEGOTIATION_VERIFIED,
} from '../../test-utils/test-utils';
import { SnackbarService } from '../snackbar/snackbar.service';
import { ContractNegotiationService } from './contract-negotiation.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ContractNegotiationService', () => {
  let service: ContractNegotiationService;
  let httpMock: HttpTestingController;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  beforeEach(() => {
    const snackbarSpy = jasmine.createSpyObj('SnackbarService', [
      'openSnackBar',
    ]);

    TestBed.configureTestingModule({
    imports: [],
    providers: [
        ContractNegotiationService,
        { provide: SnackbarService, useValue: snackbarSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
});

    service = TestBed.inject(ContractNegotiationService);
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

  describe('startNegotiation', () => {
    it('should start a contract negotiation successfully', () => {
      const mockResponse: GenericApiResponse<ContractNegotiation> = {
        success: true,
        message: 'Contract negotiation started successfully',
        data: MOCK_CONTRACT_NEGOTIATION_REQUESTED,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.startNegotiation(MOCK_CONTRACT_NEGOTIATION).subscribe({
        next: (response) => {
          expect(response).toEqual(MOCK_CONTRACT_NEGOTIATION_REQUESTED);
        },
      });

      const req = httpMock.expectOne(environment.NEGOTIATION_API_URL());
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(MOCK_CONTRACT_NEGOTIATION);
      req.flush(mockResponse);

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        mockResponse.message,
        'OK',
        'center',
        'bottom',
        'snackbar-success'
      );
    });

    it('should handle error when starting negotiation fails', () => {
      const errorResponse: GenericApiResponse<ContractNegotiation> = {
        success: false,
        message: 'Failed to start contract negotiation',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.startNegotiation(MOCK_CONTRACT_NEGOTIATION).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(environment.NEGOTIATION_API_URL());
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to start contract negotiation',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getAllNegotiationsAsProvider', () => {
    it('should retrieve all provider negotiations successfully', () => {
      const mockNegotiations = [
        MOCK_CONTRACT_NEGOTIATION,
        { ...MOCK_CONTRACT_NEGOTIATION, '@id': 'test-negotiation-id-2' },
      ];
      const mockResponse: GenericApiResponse<ContractNegotiation[]> = {
        success: true,
        message: 'Fetched provider negotiations',
        data: mockNegotiations,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllNegotiationsAsProvider().subscribe({
        next: (response) => {
          expect(response).toEqual(mockNegotiations);
          expect(response.length).toBe(2);
        },
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}?role=provider`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving provider negotiations fails', () => {
      const errorResponse: GenericApiResponse<ContractNegotiation[]> = {
        success: false,
        message: 'Failed to fetch provider negotiations',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllNegotiationsAsProvider().subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}?role=provider`
      );
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to fetch provider negotiations',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('getAllNegotiationsAsConsumer', () => {
    it('should retrieve all consumer negotiations successfully', () => {
      const mockNegotiations = [
        MOCK_CONTRACT_NEGOTIATION,
        { ...MOCK_CONTRACT_NEGOTIATION, '@id': 'test-negotiation-id-2' },
      ];
      const mockResponse: GenericApiResponse<ContractNegotiation[]> = {
        success: true,
        message: 'Fetched consumer negotiations',
        data: mockNegotiations,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllNegotiationsAsConsumer().subscribe({
        next: (response) => {
          expect(response).toEqual(mockNegotiations);
          expect(response.length).toBe(2);
        },
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}?role=consumer`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving consumer negotiations fails', () => {
      const errorResponse: GenericApiResponse<ContractNegotiation[]> = {
        success: false,
        message: 'Failed to fetch consumer negotiations',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.getAllNegotiationsAsConsumer().subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}?role=consumer`
      );
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to fetch consumer negotiations',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('acceptNegotiation', () => {
    it('should accept negotiation successfully', () => {
      const negotiationId = 'test-negotiation-id';
      const mockResponse: GenericApiResponse<ContractNegotiation> = {
        success: true,
        message: 'Contract negotiation accepted successfully',
        data: MOCK_CONTRACT_NEGOTIATION_ACCEPTED,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.acceptNegotiation(negotiationId).subscribe({
        next: (response) => {
          expect(response).toEqual(MOCK_CONTRACT_NEGOTIATION_ACCEPTED);
          expect(response.state).toBe(ContractNegotiationState.ACCEPTED);
        },
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}/${negotiationId}/accept`
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

    it('should handle error when accepting negotiation fails', () => {
      const negotiationId = 'test-negotiation-id';
      const errorResponse: GenericApiResponse<ContractNegotiation> = {
        success: false,
        message: 'Failed to accept contract negotiation',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.acceptNegotiation(negotiationId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}/${negotiationId}/accept`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to accept contract negotiation',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('approveNegotiation', () => {
    it('should approve negotiation successfully', () => {
      const negotiationId = 'test-negotiation-id';
      const mockResponse: GenericApiResponse<ContractNegotiation> = {
        success: true,
        message: 'Contract negotiation approved successfully',
        data: MOCK_CONTRACT_NEGOTIATION_AGREED,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.approveNegotiation(negotiationId).subscribe({
        next: (response) => {
          expect(response).toEqual(MOCK_CONTRACT_NEGOTIATION_AGREED);
          expect(response.state).toBe(ContractNegotiationState.AGREED);
        },
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}/${negotiationId}/approve`
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

    it('should handle error when approving negotiation fails', () => {
      const negotiationId = 'test-negotiation-id';
      const errorResponse: GenericApiResponse<ContractNegotiation> = {
        success: false,
        message: 'Failed to approve contract negotiation',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.approveNegotiation(negotiationId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}/${negotiationId}/approve`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to approve contract negotiation',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('verifyNegotiation', () => {
    it('should verify negotiation successfully', () => {
      const negotiationId = 'test-negotiation-id';
      const mockResponse: GenericApiResponse<ContractNegotiation> = {
        success: true,
        message: 'Contract negotiation verified successfully',
        data: MOCK_CONTRACT_NEGOTIATION_VERIFIED,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.verifyNegotiation(negotiationId).subscribe({
        next: (response) => {
          expect(response).toBe(true);
        },
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}/${negotiationId}/verify`
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

    it('should handle error when verifying negotiation fails', () => {
      const negotiationId = 'test-negotiation-id';
      const errorResponse: GenericApiResponse<ContractNegotiation> = {
        success: false,
        message: 'Failed to verify contract negotiation',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.verifyNegotiation(negotiationId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}/${negotiationId}/verify`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to verify contract negotiation',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('finalizeNegotiation', () => {
    it('should finalize negotiation successfully', () => {
      const negotiationId = 'test-negotiation-id';
      const mockResponse: GenericApiResponse<ContractNegotiation> = {
        success: true,
        message: 'Contract negotiation finalized successfully',
        data: MOCK_CONTRACT_NEGOTIATION_FINALIZED,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.finalizeNegotiation(negotiationId).subscribe({
        next: (response) => {
          expect(response).toBe(true);
        },
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}/${negotiationId}/finalize`
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

    it('should handle error when finalizing negotiation fails', () => {
      const negotiationId = 'test-negotiation-id';
      const errorResponse: GenericApiResponse<ContractNegotiation> = {
        success: false,
        message: 'Failed to finalize contract negotiation',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.finalizeNegotiation(negotiationId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}/${negotiationId}/finalize`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to finalize contract negotiation',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('terminateNegotiation', () => {
    it('should terminate negotiation successfully', () => {
      const negotiationId = 'test-negotiation-id';
      const mockResponse: GenericApiResponse<ContractNegotiation> = {
        success: true,
        message: 'Contract negotiation terminated successfully',
        data: MOCK_CONTRACT_NEGOTIATION_TERMINATED,
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.terminateNegotiation(negotiationId).subscribe({
        next: (response) => {
          expect(response).toEqual(MOCK_CONTRACT_NEGOTIATION_TERMINATED);
          expect(response.state).toBe(ContractNegotiationState.TERMINATED);
        },
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}/${negotiationId}/terminate`
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

    it('should handle error when terminating negotiation fails', () => {
      const negotiationId = 'test-negotiation-id';
      const errorResponse: GenericApiResponse<ContractNegotiation> = {
        success: false,
        message: 'Failed to terminate contract negotiation',
        timestamp: '2025-01-13T15:14:06+01:00',
      };

      service.terminateNegotiation(negotiationId).subscribe({
        error: (error) => {},
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}/${negotiationId}/terminate`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
        'An error occurred: Failed to terminate contract negotiation',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    });
  });

  describe('checkContractAgreement', () => {
    it('should check contract agreement successfully', () => {
      const negotiationId = 'test-negotiation-id';
      const mockResponse = true;

      service.checkContractAgreement(negotiationId).subscribe({
        next: (response) => {
          expect(response).toBe(true);
        },
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}/check/${negotiationId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when checking contract agreement fails', () => {
      const negotiationId = 'test-negotiation-id';
      const errorResponse = false;

      service.checkContractAgreement(negotiationId).subscribe({
        next: (response) => {
          expect(response).toBe(false);
        },
      });

      const req = httpMock.expectOne(
        `${environment.NEGOTIATION_API_URL()}/check/${negotiationId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(errorResponse);
    });
  });
});
