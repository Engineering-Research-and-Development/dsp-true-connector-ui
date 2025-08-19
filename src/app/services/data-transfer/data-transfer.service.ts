import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DataTransfer } from '../../models/dataTransfer';
import {
  GenericApiResponse,
  PagedAPIResponse,
} from '../../models/genericApiResponse';
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
   * @param transferProcessId
   * @param format
   * @returns Observable<DataTransfer>
   * @example dataTransferService.requestDataTransfer(transferProcessId, format).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
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
   * Get all data transfers with filters and pagination
   * @param filters - Filter options for data transfers
   * @param pagination - Pagination options
   * @returns Observable<PagedAPIResponse<DataTransfer>>
   * @example dataTransferService.getDataTransfersWithFilters({role: 'provider'}, {page: 0, size: 20}).subscribe({next: console.log});
   */
  getDataTransfersWithFilters(
    filters: {
      role?: string;
      state?: string;
      datasetId?: string;
      providerPid?: string;
      consumerPid?: string;
    } = {},
    pagination: {
      page?: number;
      size?: number;
      sort?: string;
      direction?: 'asc' | 'desc';
    } = {}
  ): Observable<PagedAPIResponse<DataTransfer>> {
    let params = new HttpParams();

    // Add pagination parameters
    if (pagination.page !== undefined) {
      params = params.set('page', pagination.page.toString());
    }
    if (pagination.size !== undefined) {
      params = params.set('size', pagination.size.toString());
    }

    // Add sorting parameters
    const sortField = pagination.sort || 'timestamp';
    const sortDirection = pagination.direction || 'desc';
    params = params.set('sort', `${sortField},${sortDirection}`);

    // Add filter parameters
    if (filters.role) {
      params = params.set('role', filters.role);
    }
    if (filters.state) {
      params = params.set('state', filters.state);
    }
    if (filters.datasetId) {
      params = params.set('datasetId', filters.datasetId);
    }
    if (filters.providerPid) {
      params = params.set('providerPid', filters.providerPid);
    }
    if (filters.consumerPid) {
      params = params.set('consumerPid', filters.consumerPid);
    }

    return this.http.get<PagedAPIResponse<DataTransfer>>(`${this.apiUrl}`, {
      ...this.httpOptions,
      params,
    });
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
   * @example dataTransferService.terminateDataTransfer('1234').subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
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

  /**
   * Get transfer status for polling
   * @param transferProcessId - The id of the transfer process
   * @returns Observable<DataTransfer | null>
   */
  private getTransferStatus(
    transferProcessId: string
  ): Observable<DataTransfer | null> {
    return this.http
      .get<PagedAPIResponse<DataTransfer>>(this.apiUrl, this.httpOptions)
      .pipe(
        map((response: PagedAPIResponse<DataTransfer>) => {
          if (response.response.success && response.response.data) {
            const transfer = response.response.data.content.find(
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
