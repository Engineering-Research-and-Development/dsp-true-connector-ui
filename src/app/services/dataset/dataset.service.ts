import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Artifact } from '../../models/artifact';
import { Dataset } from '../../models/dataset';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
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
   * Get all datasets
   * @returns Observable<Dataset[]>
   * @example datasetService.getAllDatasets().subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getAllDatasets(): Observable<Dataset[]> {
    return this.http
      .get<GenericApiResponse<Dataset[]>>(this.datasetApiUrl, this.httpOptions)
      .pipe(
        map((response: GenericApiResponse<Dataset[]>) => {
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
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

  /**
   * Get all formats from dataset
   * @param id
   * @returns Observable<string[]>
   * @example datasetService.getAllFormats(id).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getAllFormats(id: string): Observable<string[]> {
    return this.http
      .get<GenericApiResponse<string[]>>(
        this.datasetApiUrl + '/' + id + '/formats',
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<string[]>) => {
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
   * Get all artifacts from dataset
   * @param id
   * @returns Observable<Artifact[]>
   * @example datasetService.getAllArtifacts(id).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getArtifact(id: string): Observable<Artifact[]> {
    return this.http
      .get<GenericApiResponse<Artifact[]>>(
        this.datasetApiUrl + '/' + id + '/artifact',
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Artifact[]>) => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }
}
