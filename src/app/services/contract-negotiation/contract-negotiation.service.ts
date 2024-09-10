import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ContractNegotiation } from '../../models/contractNegotiation';
import { GenericApiResponse } from '../../models/genericApiResponse';
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
   * @param http
   * */
  constructor(
    private http: HttpClient,
    private snackBarService: SnackbarService
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
    return this.http
      .post<GenericApiResponse<ContractNegotiation>>(
        this.apiUrl,
        negotiation,
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
            return response.data;
          } else {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
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
          if (response.success) {
            return response.data;
          } else {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
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
        this.apiUrl + '?role=provider',
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<ContractNegotiation[]>) => {
          if (response.success) {
            return response.data;
          } else {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
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
          if (response.success) {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return response.data;
          } else {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
      );
  }

  /**
   * Verify contract negotiation
   * @param negotiationId
   * @returns Observable<ContractNegotiation>
   * @example contractNegotiationService.verifyNegotiation(negotiationId).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   *
   * */
  verifyNegotiation(negotiationId: string): Observable<ContractNegotiation> {
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
            return response.data;
          } else {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
      );
  }

  /**
   * Finalize contract negotiation
   * @param negotiationId
   * @returns Observable<ContractNegotiation>
   * @example contractNegotiationService.finalizeNegotiation(negotiationId).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   *
   */
  finalizeNegotiation(negotiationId: string): Observable<ContractNegotiation> {
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
            return response.data;
          } else {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
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
          if (response.success) {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return response.data;
          } else {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
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

  /**
   * Handle errors
   * @param error
   * @returns throwError
   * */
  errorHandler(error: any) {
    console.log('ERR', error);
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    this.snackBarService.openSnackBar(
      'An error occurred: ' + errorMessage,
      'OK',
      'center',
      'bottom',
      'snackbar-error'
    );
    console.log(errorMessage);
    return throwError(() => {
      return errorMessage;
    });
  }
}
