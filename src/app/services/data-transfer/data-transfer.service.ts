import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap, timer } from 'rxjs';
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

  // Polling configuration
  private readonly POLLING_INTERVALS = [3000, 6000, 12000, 30000, 60000]; // 3s, 6s, 12s, 30s, 60s
  private readonly MAX_POLLING_ATTEMPTS = 20; // Maximum total polling attempts

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
   * @param transferProcessId Base64.urlEncoded(consumerPid|providerPid) from TransferProcess message
   */
  downloadArtifact(transferProcessId: string): Observable<boolean> {
    this.markAsDownloading(transferProcessId);

    return this.http
      .get<GenericApiResponse<string>>(
        this.apiUrl + '/' + transferProcessId + '/download',
        this.httpOptions
      )
      .pipe(
        switchMap((response: GenericApiResponse<string>) => {
          if (response.success) {
            this.snackBarService.openSnackBar(
              'Download started successfully. Please wait...',
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );

            // Start polling for completion
            return this.pollForDownloadCompletion(transferProcessId).pipe(
              tap((completed: boolean) => {
                this.markAsCompleted(transferProcessId);
                if (completed) {
                  this.snackBarService.openSnackBar(
                    'Download completed successfully!',
                    'OK',
                    'center',
                    'bottom',
                    'snackbar-success'
                  );
                } else {
                  this.snackBarService.openSnackBar(
                    'Download is taking longer than expected. Please check the transfer status manually.',
                    'OK',
                    'center',
                    'bottom',
                    'snackbar-warning'
                  );
                }
              })
            );
          } else {
            this.markAsCompleted(transferProcessId);
            throw new Error(response.message);
          }
        }),
        catchError((error) => {
          this.markAsCompleted(transferProcessId);
          return this.errorHandlerService.handleError(error);
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
      .get(this.apiUrl + '/' + transferProcessId + '/view', {
        responseType: 'text',
      })
      .pipe(
        map((presignedUrl: string) => {
          return presignedUrl;
        }),
        catchError((error) => {
          console.log('Error getting presigned URL:', error);

          if (error.error && typeof error.error === 'string') {
            try {
              const parsedError = JSON.parse(error.error);
              if (parsedError.message) {
                const specificError = new Error(parsedError.message);
                return this.errorHandlerService.handleError(specificError);
              }
            } catch (parseError) {
              console.log('Could not parse error as JSON:', parseError);
            }
          }

          return this.errorHandlerService.handleError(error);
        })
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

  /** TEMPORARY HELPER METHODS FOR CHECKING TRANSFER STATUS */
  /**
   * Get transfer status for polling
   * @param transferProcessId - The id of the transfer process
   * @returns Observable<DataTransfer | null>
   */
  private getTransferStatus(
    transferProcessId: string
  ): Observable<DataTransfer | null> {
    return this.http
      .get<GenericApiResponse<DataTransfer[]>>(this.apiUrl, this.httpOptions)
      .pipe(
        map((response: GenericApiResponse<DataTransfer[]>) => {
          if (response.success && response.data) {
            const transfer = response.data.find(
              (t) => t['@id'] === transferProcessId
            );
            return transfer || null;
          }
          return null;
        }),
        catchError(() => of(null))
      );
  }

  /**
   * Poll for download completion
   * @param transferProcessId - The id of the transfer process
   * @returns Observable<boolean> - true when download completes, false on timeout/error
   */
  private pollForDownloadCompletion(
    transferProcessId: string
  ): Observable<boolean> {
    let attemptCount = 0;

    const checkStatus = (): Observable<boolean> => {
      if (attemptCount >= this.MAX_POLLING_ATTEMPTS) {
        return of(false);
      }

      // Calculate delay based on attempt count
      const intervalIndex = Math.min(
        attemptCount,
        this.POLLING_INTERVALS.length - 1
      );
      const delayTime = this.POLLING_INTERVALS[intervalIndex];

      attemptCount++;

      return timer(delayTime).pipe(
        switchMap(() => this.getTransferStatus(transferProcessId)),
        switchMap((transfer: DataTransfer | null) => {
          if (!transfer) {
            // Transfer not found, continue polling or timeout
            return attemptCount >= this.MAX_POLLING_ATTEMPTS
              ? of(false)
              : checkStatus();
          }

          if (transfer.downloaded === true) {
            return of(true); // Download completed
          }

          // Continue polling
          return attemptCount >= this.MAX_POLLING_ATTEMPTS
            ? of(false)
            : checkStatus();
        })
      );
    };

    return checkStatus();
  }
}
