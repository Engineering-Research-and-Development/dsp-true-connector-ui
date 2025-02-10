import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DataTransfer } from '../../models/dataTransfer';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { SnackbarService } from '../snackbar/snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class DataTransferService {
  private apiUrl = environment.DATA_TRANSFER_API_URL();

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
   * Request for a new data transfer to be created
   * @param agreement
   * @returns Observable<DataTransfer>
   * @example dataTransferService.requestDataTransfer(agreement).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  requestDataTransfer(
    transferProcessId: string,
    format: string
  ): Observable<DataTransfer> {
    return this.http
      .post<GenericApiResponse<any>>(
        this.apiUrl,
        {
          transferProcessId: transferProcessId,
          format: format,
        },
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<DataTransfer>) => {
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
   * Get all data transfers for the provider
   * @returns Observable<DataTransfer>
   * @example dataTransferService.getAllDataTransfers().subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getAllProviderDataTransfers(): Observable<DataTransfer[]> {
    return this.http
      .get<GenericApiResponse<any[]>>(
        this.apiUrl + '?role=provider',
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<any[]>) => {
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
   * Get all data transfers for the consumer
   * @returns Observable<DataTransfer>
   * @example dataTransferService.getAllDataTransfers().subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getAllConsumerDataTransfers(): Observable<DataTransfer[]> {
    return this.http
      .get<GenericApiResponse<any[]>>(
        this.apiUrl + '?role=consumer',
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<DataTransfer[]>) => {
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
   * Start the data transfer
   * @param transferProcessId - The id of the transfer process
   * @returns Observable<DataTransfer>
   * @example dataTransferService.startDataTransfer('1234').subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  startDataTransfer(transferProcessId: string): Observable<DataTransfer> {
    return this.http
      .put<GenericApiResponse<any>>(
        this.apiUrl + '/' + transferProcessId + '/start',
        null,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<DataTransfer>) => {
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
   * Complete the data transfer
   * @param transferProcessId - The id of the transfer process
   * @returns Observable<DataTransfer>
   * @example dataTransferService.completeDataTransfer('1234').subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  completeDataTransfer(transferProcessId: string): Observable<DataTransfer> {
    return this.http
      .put<GenericApiResponse<any>>(
        this.apiUrl + '/' + transferProcessId + '/complete',
        null,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<DataTransfer>) => {
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
   * Suspend the data transfer
   * @param transferProcessId - The id of the transfer process
   * @returns Observable<DataTransfer>
   * @example dataTransferService.suspendDataTransfer('1234').subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  suspendDataTransfer(transferProcessId: string): Observable<DataTransfer> {
    return this.http
      .put<GenericApiResponse<any>>(
        this.apiUrl + '/' + transferProcessId + '/suspend',
        null,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<DataTransfer>) => {
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
   * Resume the data transfer
   * @param transferProcessId - The id of the transfer process
   * @returns Observable<DataTransfer>
   * @example
   * */
  terminateDataTransfer(transferProcessId: string): Observable<DataTransfer> {
    return this.http
      .put<GenericApiResponse<any>>(
        this.apiUrl + '/' + transferProcessId + '/terminate',
        null,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<DataTransfer>) => {
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
   * Download artifact
   * @param transactionId Base64.urlEncoded(consumerPid|providerPid) from TransferProcess message
   * @param callbackAddress The callback address to send the artifact to
   */
  downloadArtifact(endpoint: string): Observable<any> {
    console.log('Downloading artifact from:', endpoint);
    return this.http
      .get(endpoint, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response: any) => {
          const blob = response.body;
          const contentDisposition = response.headers.get(
            'Content-Disposition'
          );

          let filename = 'download';
          if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
              contentDisposition
            );
            if (matches != null && matches[1]) {
              filename = matches[1].replace(/['"]/g, '');
            }
          }

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(url);
          return response;
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }
}
