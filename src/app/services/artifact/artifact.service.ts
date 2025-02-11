import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Artifact } from '../../models/artifact';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { ErrorHandlerService } from '../error-handler/error-handler.service';

@Injectable({
  providedIn: 'root',
})
export class ArtifactService {
  artifactApiUrl = environment.ARTIFACTS_API_URL();

  /**
   * Constructor in order to use the HttpClient and set the httpOptions
   * @param http
   * @param errorHandlerService
   * */
  constructor(
    private http: HttpClient,
    private errorHandlerService: ErrorHandlerService
  ) {}
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  /**
   * List all artifacts
   * @returns Observable<Artifact[]>
   * @example artifactService.listArtifacts().subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getAllArtifacts(): Observable<Artifact[]> {
    return this.http
      .get<GenericApiResponse<Artifact[]>>(
        this.artifactApiUrl,
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

  /**
   * Get an artifact by id
   * @param id
   * @returns Observable<Artifact>
   * @example artifactService.getArtifactById(id).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getArtifactById(id: string): Observable<Artifact[]> {
    return this.http
      .get<GenericApiResponse<Artifact[]>>(
        this.artifactApiUrl + '/' + id,
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

  /**
   * Upload dataset file
   * @param file - The file to upload
   * @param dataSetId - The dataset id to upload the file to
   * @returns Observable<any>
   * @example datasetService.uploadDatasetFile(file).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  uploadDatasetFile(file: File, dataSetId: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post(this.artifactApiUrl + '/upload/' + dataSetId, formData, {
        responseType: 'text',
      })
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

  downloadArtifact(
    transactionId: string,
    callbackAddress: string
  ): Observable<any> {
    return this.http
      .get(callbackAddress + '/artifacts/' + transactionId, {
        responseType: 'blob',
      })
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }
}
