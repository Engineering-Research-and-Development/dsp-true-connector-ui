import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContractNegotiation } from '../../models/contractNegotiation';
import {
  GenericApiResponse,
  PagedAPIResponse,
} from '../../models/genericApiResponse';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { SnackbarService } from '../snackbar/snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class ContractNegotiationService {
  private apiUrl = environment.NEGOTIATION_API_URL();

  /**
   * Constructor in order to use the HttpClient and set the httpOptions
   * @param http - HttpClient
   * @param snackBarService - service to show snack bar messages
   * @param errorHandlerService - service to handle errors
   * */
  constructor(
    private http: HttpClient,
    private snackBarService: SnackbarService,
    private errorHandlerService: ErrorHandlerService
  ) {}
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  /**
   * Start contract negotiation
   * @param negotiation
   * @returns Observable<ContractNegotiation>
   * @example contractNegotiationService.startNegotiation(negotiation).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  startNegotiation(negotiation: any): Observable<ContractNegotiation> {
    console.log('negotiation', negotiation);
    return this.http
      .post<GenericApiResponse<ContractNegotiation>>(
        this.apiUrl,
        negotiation,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<ContractNegotiation>) => {
          if (response.success && response.data) {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return response.data;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

  /**
   * Get all contract negotiations with filters and pagination
   * @param filters - Filter options for contract negotiations
   * @param pagination - Pagination options
   * @returns Observable<PagedAPIResponse<ContractNegotiation>>
   * @example contractNegotiationService.getContractNegotiationsWithFilters({role: 'provider'}, {page: 0, size: 20}).subscribe({next: console.log});
   */
  getContractNegotiationsWithFilters(
    filters: {
      role?: string;
      state?: string;
      offerId?: string;
      providerPid?: string;
      consumerPid?: string;
    } = {},
    pagination: {
      page?: number;
      size?: number;
      sort?: string;
      direction?: 'asc' | 'desc';
    } = {}
  ): Observable<PagedAPIResponse<ContractNegotiation>> {
    let params = new HttpParams();

    // Add pagination parameters
    if (pagination.page !== undefined) {
      params = params.set('page', pagination.page.toString());
    }
    if (pagination.size !== undefined) {
      params = params.set('size', pagination.size.toString());
    }

    // Add sorting parameters
    const sortField = pagination.sort || 'timestamp';
    const sortDirection = pagination.direction || 'desc';
    params = params.set('sort', `${sortField},${sortDirection}`);

    // Add filter parameters
    if (filters.role) {
      params = params.set('role', filters.role);
    }
    if (filters.state) {
      params = params.set('state', filters.state);
    }
    if (filters.offerId) {
      params = params.set('offerId', filters.offerId);
    }
    if (filters.providerPid) {
      params = params.set('providerPid', filters.providerPid);
    }
    if (filters.consumerPid) {
      params = params.set('consumerPid', filters.consumerPid);
    }

    return this.http.get<PagedAPIResponse<ContractNegotiation>>(
      `${this.apiUrl}`,
      {
        ...this.httpOptions,
        params,
      }
    );
  }

  /**
   * Accept offered contract negotiation
   * @param negotiationId
   * @returns Observable<ContractNegotiation>
   * @example contractNegotiationService.acceptNegotiation(negotiationId).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  acceptNegotiation(negotiationId: string): Observable<ContractNegotiation> {
    return this.http
      .put<GenericApiResponse<ContractNegotiation>>(
        this.apiUrl + '/' + negotiationId + '/accept',
        null,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<ContractNegotiation>) => {
          if (response.success && response.data) {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return response.data;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

  /**
   * Approve contract negotiation
   * @param negotiationId
   * @returns Observable<ContractNegotiation>
   * @example contractNegotiationService.approveNegotiation(negotiationId).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   *
   * */
  approveNegotiation(negotiationId: string): Observable<ContractNegotiation> {
    return this.http
      .put<GenericApiResponse<ContractNegotiation>>(
        this.apiUrl + '/' + negotiationId + '/approve',
        null,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<ContractNegotiation>) => {
          if (response.success && response.data) {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return response.data;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

  /**
   * Verify contract negotiation
   * @param negotiationId
   * @returns Observable<boolean>
   * @example contractNegotiationService.verifyNegotiation(negotiationId).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   *
   * */
  verifyNegotiation(negotiationId: string): Observable<boolean> {
    return this.http
      .put<GenericApiResponse<ContractNegotiation>>(
        this.apiUrl + '/' + negotiationId + '/verify',
        null,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<ContractNegotiation>) => {
          if (response.success) {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return true;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

  /**
   * Finalize contract negotiation
   * @param negotiationId
   * @returns Observable<boolean>
   * @example contractNegotiationService.finalizeNegotiation(negotiationId).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   *
   */
  finalizeNegotiation(negotiationId: string): Observable<boolean> {
    return this.http
      .put<GenericApiResponse<ContractNegotiation>>(
        this.apiUrl + '/' + negotiationId + '/finalize',
        null,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<ContractNegotiation>) => {
          if (response.success) {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return true;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

  /**
   * Terminate contract negotiation
   * @param negotiationId
   * @returns Observable<ContractNegotiation>
   * @example contractNegotiationService.terminateNegotiation(negotiationId).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   *
   */
  terminateNegotiation(negotiationId: string): Observable<ContractNegotiation> {
    return this.http
      .put<GenericApiResponse<ContractNegotiation>>(
        this.apiUrl + '/' + negotiationId + '/terminate',
        null,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<ContractNegotiation>) => {
          if (response.success && response.data) {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return response.data;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }
}
