import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Dataset } from '../../models/dataset';
import { SnackbarService } from '../snackbar/snackbar.service';
import { GenericApiResponse } from './../../models/genericApiResponse';

/**
 * Dataset Service to manage the dataset data
 * */
@Injectable({
  providedIn: 'root',
})
export class DatasetService {
  datasetApiUrl = environment.DATASET_API_URL();

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
   * Create a new dataset
   * @param dataset
   * @returns Observable<Dataset>
   * @example datasetService.createDataset(dataset).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  createDataset(dataset: Dataset): Observable<Dataset> {
    return this.http
      .post<GenericApiResponse<Dataset>>(
        this.datasetApiUrl,
        dataset,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Dataset>) => {
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
   * Get all datasets
   * @returns Observable<Dataset[]>
   * @example datasetService.getAllDatasets().subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getAllDatasets(): Observable<Dataset[]> {
    return this.http
      .get<GenericApiResponse<Dataset[]>>(this.datasetApiUrl, this.httpOptions)
      .pipe(
        map((response: GenericApiResponse<Dataset[]>) => {
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
   * Get a dataset
   * @returns Observable<Dataset>
   * @example datasetService.getDataset(id).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getDatasetById(id: string): Observable<Dataset> {
    return this.http
      .get<GenericApiResponse<Dataset>>(
        this.datasetApiUrl + '/' + id,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Dataset>) => {
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
   * Update a dataset
   * @param id
   * @param dataset
   * @returns Observable<Dataset>
   * @example datasetService.updateDataset(id, dataset).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  updateDataset(id: string, dataset: Dataset): Observable<Dataset> {
    return this.http
      .put<GenericApiResponse<Dataset>>(
        this.datasetApiUrl + '/' + id,
        dataset,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Dataset>) => {
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
   * Delete a dataset
   * @param id
   * @returns Observable<Dataset>
   * @example datasetService.deleteDataset(id).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  deleteDataset(id: string): Observable<string> {
    return this.http
      .delete<GenericApiResponse<Dataset>>(
        this.datasetApiUrl + '/' + id,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Dataset>) => {
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
   * Handle the error
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
