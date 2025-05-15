import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContractNegotiation } from '../../models/contractNegotiation';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { SnackbarService } from '../snackbar/snackbar.service';

const headers = new HttpHeaders({
  'Content-Type': 'application/json',
});

const options = { headers };

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
   * Get all contract negotiations as provider
   * @returns Observable<ContractNegotiation[]>
   * @example contractNegotiationService.getAllNegotiationsAsProvider().subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   *
   */
  getAllNegotiationsAsProvider(): Observable<ContractNegotiation[]> {
    return this.http
      .get<GenericApiResponse<ContractNegotiation[]>>(
        this.apiUrl + '?role=provider',
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<ContractNegotiation[]>) => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

  /**
   * Get all contract negotiations as consumer
   * @returns Observable<ContractNegotiation[]>
   * @example contractNegotiationService.getAllNegotiationsAsConsumer().subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   *
   */
  getAllNegotiationsAsConsumer(): Observable<ContractNegotiation[]> {
    return this.http
      .get<GenericApiResponse<ContractNegotiation[]>>(
        this.apiUrl + '?role=consumer',
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<ContractNegotiation[]>) => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
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
    console.log('negotiationId', negotiationId);
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
   * @returns Observable<ContractNegotiation>
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
   * @returns Observable<ContractNegotiation>
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

  /**
   * Check if contract agreement is valid
   * @param negotiationId
   * @returns Observable<any>
   * @example contractNegotiationService.checkContractAgreement(negotiationId).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   *
   * */
  checkContractAgreement(negotiationId: string): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + '/check/' + negotiationId,
      this.httpOptions
    );
  }
}
