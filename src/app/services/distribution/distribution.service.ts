import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Distribution } from '../../models/distribution';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { SnackbarService } from '../snackbar/snackbar.service';

/**
 * Distribution Service to manage the distribution data
 * */
@Injectable({
  providedIn: 'root',
})
export class DistributionService {
  DistributionApiUrl = environment.DISTRIBUTION_API_URL();

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
   * Create a new distribution
   * @param Distribution
   * @returns Observable<Distribution>
   * @example DistributionService.createDistribution(Distribution).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  createDistribution(Distribution: Distribution): Observable<Distribution> {
    return this.http
      .post<GenericApiResponse<Distribution>>(
        this.DistributionApiUrl,
        Distribution,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Distribution>) => {
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
   * Get all distributions
   * @returns Observable<Distribution[]>
   * @example DistributionService.getAllDistributions().subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getAllDistributions(): Observable<Distribution[]> {
    return this.http
      .get<GenericApiResponse<Distribution[]>>(
        this.DistributionApiUrl,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Distribution[]>) => {
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
   * Get a distribution
   * @returns Observable<Distribution>
   * @example DistributionService.getDistribution(id).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getDistributionById(id: string): Observable<Distribution> {
    return this.http
      .get<GenericApiResponse<Distribution>>(
        this.DistributionApiUrl + '/' + id,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Distribution>) => {
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
   * Update a distribution
   * @param id
   * @param Distribution
   * @returns Observable<Distribution>
   * @example DistributionService.updateDistribution(id, Distribution).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  updateDistribution(
    id: string,
    Distribution: Distribution
  ): Observable<Distribution> {
    return this.http
      .put<GenericApiResponse<Distribution>>(
        this.DistributionApiUrl + '/' + id,
        Distribution,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Distribution>) => {
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
   * Delete a distribution
   * @param id
   * @returns Observable<Distribution>
   * @example DistributionService.deleteDistribution(id).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  deleteDistribution(id: string): Observable<string> {
    return this.http
      .delete<GenericApiResponse<Distribution>>(
        this.DistributionApiUrl + '/' + id,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Distribution>) => {
          if (response.success) {
            return response.message;
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
   * Error handler
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
