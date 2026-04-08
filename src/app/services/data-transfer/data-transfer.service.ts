import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, EMPTY, finalize, map, Observable, of, switchMap, tap, timer } from 'rxjs';
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
  private viewingTransfers = new Set<string>();
  /** Tracks transfers whose polling observable is currently active in memory. */
  private activelyPolling = new Set<string>();
  private readonly DOWNLOADING_STORAGE_KEY = 'downloading_transfers';

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
  ) {
    this.restoreDownloadingState();
  }

  private saveDownloadingState(): void {
    sessionStorage.setItem(
      this.DOWNLOADING_STORAGE_KEY,
      JSON.stringify([...this.downloadingTransfers])
    );
  }

  private restoreDownloadingState(): void {
    const stored = sessionStorage.getItem(this.DOWNLOADING_STORAGE_KEY);
    if (stored) {
      try {
        const ids: string[] = JSON.parse(stored);
        ids.forEach((id) => this.downloadingTransfers.add(id));
      } catch {
        sessionStorage.removeItem(this.DOWNLOADING_STORAGE_KEY);
      }
    }
  }
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
   * Check if a transfer is currently being viewed
   * @param transferId - The id of the transfer
   * @returns boolean - true if the transfer is being viewed, false otherwise
   * @example dataTransferService.isViewing('1234');
   */
  isViewing(transferId: string): boolean {
    return this.viewingTransfers.has(transferId);
  }

  /**
   * Mark a transfer as downloading
   * @param transferId - The id of the transfer
   * @example dataTransferService.markAsDownloading('1234');
   */
  private markAsDownloading(transferId: string): void {
    this.downloadingTransfers.add(transferId);
    this.activelyPolling.add(transferId);
    this.saveDownloadingState();
  }

  /**
   * Mark a transfer as completed
   * @param transferId - The id of the transfer
   * @example dataTransferService.markAsCompleted('1234');
   */
  private markAsCompleted(transferId: string): void {
    this.downloadingTransfers.delete(transferId);
    this.activelyPolling.delete(transferId);
    this.saveDownloadingState();
  }

  /**
   * Ensure a transfer is tracked as downloading based on the backend flag.
   * Does NOT add to activelyPolling — that is handled separately by resumePollingIfNeeded.
   * @param transferId - The id of the transfer
   */
  ensureTrackedAsDownloading(transferId: string): void {
    this.downloadingTransfers.add(transferId);
    this.saveDownloadingState();
  }

  /**
   * Cleanup completed data transfers and remove stale downloading entries.
   * Clears a transfer from the tracking set when the backend reports it as
   * fully downloaded (downloaded===true) or no longer downloading (downloading===false).
   * @param dataTransfers - The list of data transfers to check
   * @example dataTransferService.cleanupCompleted(dataTransfers);
   */
  cleanupCompleted(dataTransfers: DataTransfer[]): void {
    dataTransfers.forEach((transfer) => {
      if (transfer.downloaded === true || transfer.downloading === false) {
        this.downloadingTransfers.delete(transfer['@id']);
      }
    });
    this.saveDownloadingState();
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
    console.log('Requesting data transfer with ID:', transferProcessId, 'and format:', format);
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
            const isPush = format.toUpperCase().includes('PUSH');
            const successMessage = isPush
              ? 'Push transfer request initiated successfully!'
              : 'Transfer request initiated successfully!';

            this.snackBarService.openSnackBar(
              successMessage,
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
        }),
        finalize(() => this.activelyPolling.delete(transferProcessId))
      );
  }

  /**
   * Push artifact to consumer
   * @param transferProcessId Base64.urlEncoded(consumerPid|providerPid) from TransferProcess message
   */
  pushArtifact(transferProcessId: string): Observable<boolean> {
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
              'Push transfer started successfully. Please wait...',
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
                    'Data push completed successfully!',
                    'OK',
                    'center',
                    'bottom',
                    'snackbar-success'
                  );
                } else {
                  this.snackBarService.openSnackBar(
                    'Data push is taking longer than expected. Please check the transfer status manually.',
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
        }),
        finalize(() => this.activelyPolling.delete(transferProcessId))
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
   * View artifact - downloads file from presigned URL
   * Provides immediate feedback and disables button during download
   * @param presignedUrl - The presigned S3 URL
   * @param transferId - The transfer ID to track viewing state
   * @returns Observable<any>
   */
  viewArtifact(presignedUrl: string, transferId: string): Observable<any> {
    // Check if already viewing this transfer
    if (this.viewingTransfers.has(transferId)) {
      this.snackBarService.openSnackBar(
        'Download already in progress for this transfer.',
        'OK',
        'center',
        'bottom',
        'snackbar-warning'
      );
      return of(false);
    }

    // Mark as viewing
    this.viewingTransfers.add(transferId);

    // Show immediate feedback to user
    this.snackBarService.openSnackBar(
      'Starting download...',
      'OK',
      'center',
      'bottom',
      'snackbar-success'
    );

    // Extract filename from URL parameters
    let filename = 'download';
    try {
      const url = new URL(presignedUrl);
      const contentDisposition = url.searchParams.get('response-content-disposition');
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
          contentDisposition
        );
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
    } catch (e) {
      console.warn('Could not extract filename from URL:', e);
    }

    // Directly trigger download using the presigned URL
    // This avoids CORS issues since we're not making an XHR request
    const link = document.createElement('a');
    link.href = presignedUrl;
    link.download = filename;
    link.target = '_blank'; // Open in new tab as fallback
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Mark as completed
    this.viewingTransfers.delete(transferId);

    this.snackBarService.openSnackBar(
      'Download initiated successfully!',
      'OK',
      'center',
      'bottom',
      'snackbar-success'
    );

    return of(true);
  }

  /**
   * Resume polling for a transfer that was in progress before a page refresh.
   * Returns EMPTY if the transfer is not downloading or polling is already active.
   * @param transferId - The id of the transfer
   * @returns Observable<boolean> - emits true/false when polling completes, or EMPTY if no action needed
   */
  resumePollingIfNeeded(transferId: string): Observable<boolean> {
    if (!this.downloadingTransfers.has(transferId) || this.activelyPolling.has(transferId)) {
      return EMPTY;
    }
    this.activelyPolling.add(transferId);
    return this.pollForDownloadCompletion(transferId).pipe(
      tap((completed: boolean) => {
        this.markAsCompleted(transferId);
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
      }),
      catchError(() => {
        this.markAsCompleted(transferId);
        return of(false);
      }),
      finalize(() => this.activelyPolling.delete(transferId))
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
