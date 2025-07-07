import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
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
  private downloadingTransfers = new Set<string>();

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
   * Check if a transfer is currently being downloaded
   * @param transferId - The id of the transfer
   * @returns boolean - true if the transfer is being downloaded, false otherwise
   * @example dataTransferService.isDownloading('1234');
   */
  isDownloading(transferId: string): boolean {
    return this.downloadingTransfers.has(transferId);
  }

  /**
   * Mark a transfer as downloading
   * @param transferId - The id of the transfer
   * @example dataTransferService.markAsDownloading('1234');
   */
  private markAsDownloading(transferId: string): void {
    this.downloadingTransfers.add(transferId);
  }

  /**
   * Mark a transfer as completed
   * @param transferId - The id of the transfer
   * @example dataTransferService.markAsCompleted('1234');
   */
  private markAsCompleted(transferId: string): void {
    this.downloadingTransfers.delete(transferId);
  }

  /**
   * Cleanup completed data transfers
   * @param dataTransfers - The list of data transfers to check
   * @example dataTransferService.cleanupCompleted(dataTransfers);
   */
  cleanupCompleted(dataTransfers: DataTransfer[]): void {
    dataTransfers.forEach((transfer) => {
      if (transfer.downloaded === true) {
        this.downloadingTransfers.delete(transfer['@id']);
      }
    });
  }

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
   * Get all data transfers with advanced filtering options
   * @param role optional role to filter transfer processes by (e.g., 'consumer' or 'provider')
   * @param state optional state to filter transfer processes by
   * @param datasetId optional dataset identifier to filter transfer processes by
   * @param providerPid optional provider PID to filter transfer processes by
   * @param consumerPid optional consumer PID to filter transfer processes by
   * @returns Observable<DataTransfer[]>
   * @example dataTransferService.getAllDataTransfersWithFilters('consumer', 'STARTED', 'dataset123').subscribe({ next: console.log, error: console.error });
   */
  getAllDataTransfersWithFilters(
    role?: string,
    state?: string,
    datasetId?: string,
    providerPid?: string,
    consumerPid?: string
  ): Observable<DataTransfer[]> {
    const queryParams: string[] = [];

    if (role) {
      queryParams.push(`role=${encodeURIComponent(role)}`);
    }
    if (state) {
      queryParams.push(`state=${encodeURIComponent(state)}`);
    }
    if (datasetId) {
      queryParams.push(`datasetId=${encodeURIComponent(datasetId)}`);
    }
    if (providerPid) {
      queryParams.push(`providerPid=${encodeURIComponent(providerPid)}`);
    }
    if (consumerPid) {
      queryParams.push(`consumerPid=${encodeURIComponent(consumerPid)}`);
    }

    const queryString =
      queryParams.length > 0 ? '?' + queryParams.join('&') : '';

    return this.http
      .get<GenericApiResponse<any[]>>(
        this.apiUrl + queryString,
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
   * Terminate the data transfer
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
   */
  downloadArtifact(transferProcessId: string): Observable<boolean> {
    this.markAsDownloading(transferProcessId);

    return this.http
      .get<GenericApiResponse<any[]>>(
        this.apiUrl + '/' + transferProcessId + '/download',
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<any[]>) => {
          if (response.success) {
            this.markAsCompleted(transferProcessId);
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return true;
          } else {
            this.markAsCompleted(transferProcessId);
            throw new Error(response.message);
          }
        }),
        catchError((error) => {
          const isTimeout =
            error.status === 504 ||
            error.status === 408 ||
            error.status === 0 ||
            error.name === 'TimeoutError' ||
            error.error?.includes?.('timeout') ||
            error.message?.toLowerCase().includes('timeout');

          if (isTimeout) {
            this.snackBarService.openSnackBar(
              'Download is taking longer than expected. The process is still running in the background.',
              'OK',
              'center',
              'bottom',
              'snackbar-info'
            );
            return of(false);
          } else {
            this.markAsCompleted(transferProcessId);
            return this.errorHandlerService.handleError(error);
          }
        })
      );
  }

  /**
   * Get presigned URL for artifact download
   * @param transferProcessId Base64.urlEncoded(consumerPid|providerPid) from TransferProcess message
   * @returns Observable<string>
   */
  getPresignedUrl(transferProcessId: string): Observable<string> {
    return this.http
      .get<GenericApiResponse<string>>(
        this.apiUrl + '/' + transferProcessId + '/view',
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<string>) => {
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
   * View artifact after it has been downloaded
   * @param presignedUrl
   * @returns   Observable<any>
   */
  viewArtifact(presignedUrl: string): Observable<any> {
    console.log('Downloading artifact for process id:', presignedUrl);
    return this.http
      .get(presignedUrl, {
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
