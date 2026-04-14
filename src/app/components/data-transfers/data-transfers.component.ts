import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute } from '@angular/router';
import { merge, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataTransfer } from '../../models/dataTransfer';
import { DataTransferState } from '../../models/enums/dataTransferState';
import { DataTransferService } from '../../services/data-transfer/data-transfer.service';
import { ProxyService } from '../../services/proxy/proxy.service';
import {
  FilterExpansionState,
  PaginationHelper,
  PaginationState,
  SortState,
} from '../../shared/utils/pagination.utils';

@Component({
  selector: 'app-data-transfers',
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatListModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatToolbarModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatPaginatorModule,
    MatMenuModule,
  ],
  templateUrl: './data-transfers.component.html',
  styleUrl: './data-transfers.component.css',
})
export class DataTransfersComponent implements OnInit, OnDestroy {
  userType!: string;
  loading = false;
  dataTransfers: DataTransfer[] = [];
  selectedState: DataTransferState | null = null;
  dataTransferStates = Object.values(DataTransferState);
  datasetIdFilter: string = '';
  providerPidFilter: string = '';
  consumerPidFilter: string = '';

  // Pagination and sorting using shared utility
  paginationState: PaginationState =
    PaginationHelper.createInitialPaginationState();
  sortState: SortState = PaginationHelper.createInitialSortState();

  // Filter expansion state using shared utility - filters collapsed by default
  filterExpansionState: FilterExpansionState =
    PaginationHelper.createFilterExpansionState(false);

  // Sort expansion state - sort collapsed by default
  sortExpansionState: FilterExpansionState =
    PaginationHelper.createFilterExpansionState(false);

  // Sort options
  sortColumns = [
    { value: 'created', label: 'Creation Date' },
    { value: 'modified', label: 'Last Modified' },
  ];

  dataTransferState = DataTransferState;
  readonly defaultRequestFormats: string[] = ['HttpData-PULL', 'HttpData-PUSH'];
  requestFormatsMap: Record<string, string[]> = {};
  requestFormatsLoading: Record<string, boolean> = {};
  requestFormatsLoaded: Record<string, boolean> = {};
  private destroy$ = new Subject<void>();
  private previousUserType: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private dataTransferService: DataTransferService,
    private proxyService: ProxyService
  ) {}

  /**
   * Load request formats for a specific data transfer
   * @param dataTransfer The data transfer object
   */
  loadRequestFormats(dataTransfer: DataTransfer): void {
    const transferId = dataTransfer['@id'];
    if (this.requestFormatsMap[transferId] || this.requestFormatsLoading[transferId]) {
      return;
    }

    const callbackAddress = dataTransfer.callbackAddress;
    const datasetId = dataTransfer.datasetId;

    if (!callbackAddress || !datasetId) {
      this.requestFormatsMap[transferId] = this.defaultRequestFormats;
      this.requestFormatsLoaded[transferId] = true;
      this.requestFormatsLoading[transferId] = false;
      return;
    }

    this.requestFormatsLoading[transferId] = true;
    this.requestFormatsLoaded[transferId] = false;
    this.proxyService
      .getRemoteDatasetFormats(callbackAddress, datasetId)
      .subscribe({
        next: (formats) => {
          const resolved = formats && formats.length > 0 ? formats : this.defaultRequestFormats;
          this.requestFormatsMap[transferId] = [...resolved].sort();
          this.requestFormatsLoading[transferId] = false;
          this.requestFormatsLoaded[transferId] = true;
        },
        error: (error) => {
          console.error('Error fetching dataset formats:', error);
          this.requestFormatsMap[transferId] = this.defaultRequestFormats;
          this.requestFormatsLoading[transferId] = false;
          this.requestFormatsLoaded[transferId] = true;
        },
      });
  }

  /**
   * Initialize the component and checks for which role to fetch the dataTransfers
   * Subscribes to query parameter changes to detect role switches between consumer and provider.
   */
  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const newUserType = params['userType'];
        if (!newUserType) {
          this.goBack();
          return;
        }
        
        // If userType has changed, reset filters and pagination
        if (this.previousUserType !== null && this.previousUserType !== newUserType) {
          this.selectedState = null;
          this.datasetIdFilter = '';
          this.providerPidFilter = '';
          this.consumerPidFilter = '';
          this.paginationState = PaginationHelper.createInitialPaginationState();
          this.sortState = PaginationHelper.createInitialSortState();
          this.filterExpansionState = PaginationHelper.createFilterExpansionState(false);
          this.sortExpansionState = PaginationHelper.createFilterExpansionState(false);
          this.requestFormatsMap = {};
          this.requestFormatsLoading = {};
          this.requestFormatsLoaded = {};
        }
        
        this.userType = newUserType;
        this.previousUserType = newUserType;
        this.loading = true;
        this.fetchDataTransfers();
      });
  }

  /**
   * Cleanup subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Navigate back to the previous page
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Fetch data transfers with current filters and pagination
   */
  fetchDataTransfers() {
    this.loading = true;

    const filters = {
      role: this.userType,
      state: this.selectedState || undefined,
      datasetId: this.datasetIdFilter || undefined,
      providerPid: this.providerPidFilter || undefined,
      consumerPid: this.consumerPidFilter || undefined,
    };

    const paginationOptions = PaginationHelper.createPaginationOptions(
      this.paginationState,
      this.sortState
    );

    this.dataTransferService
      .getDataTransfersWithFilters(filters, paginationOptions)
      .subscribe({
        next: (response) => {
          console.log('Data Transfers fetched');
          this.dataTransfers = response.response.data?.content || [];
          if (response.response.data?.page) {
            this.paginationState = PaginationHelper.updateTotalElements(
              this.paginationState,
              response.response.data.page.totalElements
            );
          }
          this.dataTransferService.cleanupCompleted(this.dataTransfers);
          // Sync backend downloading flag to in-memory state so the spinner
          // is restored correctly after a page refresh. Only track IDs not
          // already known to avoid redundant sessionStorage writes.
          this.dataTransfers
            .filter((t) => t.downloading === true && !this.dataTransferService.isDownloading(t['@id']))
            .forEach((t) => this.dataTransferService.ensureTrackedAsDownloading(t['@id']));
          // Resume polling for any transfers that were downloading before a page refresh.
          // Merge all streams and trigger a single refresh to avoid concurrent overlapping fetches.
          const pollingStreams = this.dataTransfers
            .filter((t) => this.dataTransferService.isDownloading(t['@id']))
            .map((t) => this.dataTransferService.resumePollingIfNeeded(t['@id']));
          if (pollingStreams.length > 0) {
            merge(...pollingStreams)
              .pipe(takeUntil(this.destroy$))
              .subscribe({ complete: () => this.fetchDataTransfers() });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching data transfers:', error);
          this.loading = false;
        },
      });
  }

  /**
   * Apply filters and fetch data transfers with filtering and pagination
   */
  applyFilters() {
    // Keep the expansion panel open when applying filters
    this.filterExpansionState = PaginationHelper.keepFilterExpansionOpen(
      this.filterExpansionState
    );
    // Reset to first page when applying filters
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchDataTransfers();
  }

  /**
   * Clear all filters and fetch all data transfers
   */
  clearFilters() {
    // Keep the expansion panel open after clearing filters
    this.filterExpansionState = PaginationHelper.keepFilterExpansionOpen(
      this.filterExpansionState
    );

    this.selectedState = null;
    this.datasetIdFilter = '';
    this.providerPidFilter = '';
    this.consumerPidFilter = '';

    // Reset to first page
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchDataTransfers();
  }

  /**
   * Handle sort column change
   */
  onSortColumnChange(column: string) {
    this.sortState = PaginationHelper.handleSortChange(
      { active: column, direction: this.sortState.sortDirection },
      this.sortState
    );
    // Reset to first page when sorting changes
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchDataTransfers();
  }

  /**
   * Handle sort direction change
   */
  onSortDirectionChange(direction: 'asc' | 'desc') {
    this.sortState = PaginationHelper.handleSortChange(
      { active: this.sortState.sortColumn, direction },
      this.sortState
    );
    // Reset to first page when sorting changes
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchDataTransfers();
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent) {
    this.paginationState = PaginationHelper.handlePageChange(
      { pageIndex: event.pageIndex, pageSize: event.pageSize },
      this.paginationState
    );
    // Collapse panels when changing pages
    this.filterExpansionState.filtersExpanded = false;
    this.sortExpansionState.filtersExpanded = false;
    this.fetchDataTransfers();
  }

  /**
   * Check if the data transfer is downloading (in-memory or backend flag)
   * @param transfer The data transfer object
   * @returns True if the data transfer is downloading, false otherwise
   * */
  isDownloading(transfer: DataTransfer): boolean {
    return this.dataTransferService.isDownloading(transfer['@id']) || transfer.downloading === true;
  }

  /**
   * Check if the data transfer is being viewed
   * @param transferId The ID of the data transfer
   * @returns True if the data transfer is being viewed, false otherwise
   * */
  isViewing(transferId: string): boolean {
    return this.dataTransferService.isViewing(transferId);
  }

  /**
   * Get the display name of the Data Transfer state
   * @param state The Data Transfer state
   * @returns The display name
   */
  getStateDisplayName(state: DataTransferState): string {
    return state;
  }

  /**
   * Handle the request event of the data transfer
   * @param dataTransfer The data transfer object
   * @param format The requested format
   * */
  onRequest(dataTransfer: DataTransfer, format: string) {
    this.dataTransferService
      .requestDataTransfer(dataTransfer['@id'], format)
      .subscribe({
        next: () => {
          this.fetchDataTransfers();
        },
        error: (error) => {
          console.error('Error requesting data transfer:', error);
        },
      });
  }

  /**
   * Handle the start event of the data transfer
   * @param dataTransfer The data transfer object
   */
  onStart(dataTransfer: DataTransfer) {
    this.dataTransferService.startDataTransfer(dataTransfer['@id']).subscribe({
      next: () => {
        this.fetchDataTransfers();
      },
      error: (error) => {
        console.error('Error starting data transfer:', error);
      },
    });
  }
  /**
   * Handle the download event of  data transfer
   * @param dataTransfer The data transfer object
   * */
  onDownload(dataTransfer: DataTransfer) {
    this.dataTransferService.downloadArtifact(dataTransfer['@id']).subscribe({
      next: (completed: boolean) => {
        // Refresh the transfer list to reflect any status changes
        this.fetchDataTransfers();

        if (!completed) {
          console.warn(
            'Download polling timed out for transfer:',
            dataTransfer['@id']
          );
        }
      },
      error: (error) => {
        console.error('Error downloading artifact:', error);
        // Refresh the transfer list in case of error to sync UI state
        this.fetchDataTransfers();
      },
    });
  }

  /**
   * Handle the push event of data transfer (provider pushes data to consumer)
   * @param dataTransfer The data transfer object
   * */
  onPush(dataTransfer: DataTransfer) {
    this.dataTransferService.pushArtifact(dataTransfer['@id']).subscribe({
      next: (completed: boolean) => {
        // Refresh the transfer list to reflect any status changes
        this.fetchDataTransfers();

        if (!completed) {
          console.warn(
            'Push polling timed out for transfer:',
            dataTransfer['@id']
          );
        }
      },
      error: (error) => {
        console.error('Error pushing artifact:', error);
        // Refresh the transfer list in case of error to sync UI state
        this.fetchDataTransfers();
      },
    });
  }

  /**
   * Handle the view event of data transfer
   * @param dataTransfer The data transfer object
   * */
  onView(dataTransfer: DataTransfer) {
    this.dataTransferService.getPresignedUrl(dataTransfer['@id']).subscribe({
      next: (presignedUrl) => {
        this.dataTransferService.viewArtifact(presignedUrl, dataTransfer['@id']).subscribe({
          next: () => {
            this.fetchDataTransfers();
          },
          error: (error) => {
            console.error('Error viewing data transfer:', error);
          },
        });
      },
      error: (error) => {
        console.error('Error getting presigned URL:', error);
      },
    });
  }
  /**
   * Handle the complete event of data transfer
   * @param dataTransfer The data transfer object
   * */
  onComplete(dataTransfer: DataTransfer) {
    this.dataTransferService
      .completeDataTransfer(dataTransfer['@id'])
      .subscribe({
        next: () => {
          this.fetchDataTransfers();
        },
        error: (error) => {
          console.error('Error finalizing contract dataTransfer:', error);
        },
      });
  }

  /**
   * Handle the terminate event of the contract dataTransfer
   * @param dataTransfer The data transfer object
   * */
  onTerminate(dataTransfer: DataTransfer) {
    this.dataTransferService
      .terminateDataTransfer(dataTransfer['@id'])
      .subscribe({
        next: () => {
          this.fetchDataTransfers();
        },
        error: (error) => {
          console.error('Error terminating contract dataTransfer:', error);
        },
      });
  }

  onSuspend(dataTransfer: DataTransfer) {
    this.dataTransferService
      .suspendDataTransfer(dataTransfer['@id'])
      .subscribe({
        next: () => {
          this.fetchDataTransfers();
        },
        error: (error) => {
          console.error('Error suspending contract dataTransfer:', error);
        },
      });
  }
}
