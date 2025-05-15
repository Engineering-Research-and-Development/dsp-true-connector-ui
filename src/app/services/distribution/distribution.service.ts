import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Distribution } from '../../models/distribution';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
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
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return response.message;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }
}
