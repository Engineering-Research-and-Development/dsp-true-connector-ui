import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Artifact } from '../../models/artifact';
import { Dataset } from '../../models/dataset';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { SnackbarService } from '../snackbar/snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class DatasetService {
  datasetApiUrl = environment.DATASET_API_URL();

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
   * Create a new dataset with mandatory artifact
   * @param dataset Dataset object
   * @param file Optional file to upload (required if externalURL not provided)
   * @param externalURL Optional external URL (required if file not provided)
   * @param authorization Optional authorization for external URL
   * @returns Observable<Dataset>
   */
  createDataset(
    dataset: Dataset,
    file?: File,
    externalURL?: string,
    authorization?: string
  ): Observable<Dataset> {
    const formData = new FormData();
    formData.append('dataset', JSON.stringify(dataset));

    // Add file or external URL if provided
    if (file) {
      formData.append('file', file);
    } else if (externalURL) {
      formData.append('url', externalURL);
      if (authorization) {
        console.log('authorization', authorization);
        formData.append('authorization', authorization);
      }
    }

    console.log('formData', formData.getAll('dataset'));
    return this.http
      .post<GenericApiResponse<Dataset>>(this.datasetApiUrl, formData)
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
   */
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
   * Get a dataset by ID
   * @param id Dataset ID
   * @returns Observable<Dataset>
   */
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
   * Update a dataset with optional new artifact
   * @param id Dataset ID
   * @param dataset Dataset object with updated data
   * @param file Optional new file to upload
   * @param externalURL Optional new external URL
   * @param authorization Optional authorization for new external URL
   * @returns Observable<Dataset>
   */
  updateDataset(
    id: string,
    dataset: Dataset,
    file?: File,
    externalURL?: string,
    authorization?: string
  ): Observable<Dataset> {
    const formData = new FormData();
    formData.append('dataset', JSON.stringify(dataset));

    console.log('dataset', dataset);
    console.log('file', file);
    console.log('externalURL', externalURL);
    console.log('authorization', authorization);
    console.log('formData', formData.getAll('dataset'));
    // Add file or external URL if provided
    if (file) {
      formData.append('file', file);
    } else if (externalURL) {
      formData.append('url', externalURL);
      if (authorization) {
        formData.append('authorization', authorization);
      }
    }
    return this.http
      .put<GenericApiResponse<Dataset>>(this.datasetApiUrl + '/' + id, formData)
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
   * @param id Dataset ID
   * @returns Observable<string>
   */
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
   * @param id Dataset ID
   * @returns Observable<string[]>
   */
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
   * Get artifact from dataset
   * @param id Dataset ID
   * @returns Observable<Artifact[]>
   */
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
