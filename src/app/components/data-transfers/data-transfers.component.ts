import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { DataTransfer } from '../../models/dataTransfer';
import { DataTransferState } from '../../models/enums/dataTransferState';
import { DataTransferService } from '../../services/data-transfer/data-transfer.service';

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
    NgxSkeletonLoaderModule,
    MatInputModule,
    MatToolbarModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './data-transfers.component.html',
  styleUrl: './data-transfers.component.css',
})
export class DataTransfersComponent {
  userType!: string;
  loading = false;
  dataTransfers: DataTransfer[] = [];
  filteredDataTransfers: DataTransfer[] = [];
  selectedState: DataTransferState | null = null;
  dataTransferStates = Object.values(DataTransferState);
  datasetIdFilter: string = '';
  providerPidFilter: string = '';
  consumerPidFilter: string = '';

  // Expansion panel state
  filtersExpanded: boolean = false;

  dataTransferState = DataTransferState;

  constructor(
    private router: Router,
    private location: Location,
    private dataTransferService: DataTransferService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.userType = navigation.extras.state['userType'];
    } else {
      this.goBack();
    }
  }

  /**
   * Initialize the component and checks for which role to fetch the dataTransfers
   */
  ngOnInit(): void {
    this.fetchDataTransfersByRole();
    this.loading = true;
  }

  fetchDataTransfersByRole() {
    if (this.userType === 'provider') {
      this.getProviderDataTransfers();
    } else if (this.userType === 'consumer') {
      this.getConsumerDataTransfers();
    }
  }

  /**
   * Apply filters and fetch data transfers with filtering
   */
  applyFilters() {
    // Keep the expansion panel open when applying filters
    this.filtersExpanded = true;

    // Check if any filters are applied
    const hasFilters =
      this.selectedState !== null ||
      this.datasetIdFilter.trim() ||
      this.providerPidFilter.trim() ||
      this.consumerPidFilter.trim();

    if (hasFilters) {
      // Use filtering method when filters are applied
      this.loading = true;
      this.dataTransferService
        .getAllDataTransfersWithFilters(
          this.userType,
          this.selectedState || undefined,
          this.datasetIdFilter || undefined,
          this.providerPidFilter || undefined,
          this.consumerPidFilter || undefined
        )
        .subscribe({
          next: (data) => {
            console.log('Data Transfers fetched with filters');
            this.dataTransfers = data;
            this.filteredDataTransfers = data;
            this.dataTransferService.cleanupCompleted(data);
            this.loading = false;
          },
          error: (error) => {
            console.error('Error fetching filtered dataTransfers:', error);
            this.loading = false;
          },
        });
    } else {
      // No filters applied, use original method
      this.fetchDataTransfersByRole();
    }
  }

  /**
   * Clear all filters and fetch all data transfers
   */
  clearFilters() {
    // Keep the expansion panel open after clearing filters
    this.filtersExpanded = true;

    this.selectedState = null;
    this.datasetIdFilter = '';
    this.providerPidFilter = '';
    this.consumerPidFilter = '';
    this.fetchDataTransfersByRole();
  }

  /**
   * Fetch all Data Transfers for the provider
   */
  getProviderDataTransfers() {
    this.loading = true;
    this.dataTransferService.getAllProviderDataTransfers().subscribe({
      next: (data) => {
        console.log('Provider Data Transfers fetched');
        this.dataTransfers = data;
        this.filteredDataTransfers = data;
        this.dataTransferService.cleanupCompleted(data);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching provider dataTransfers:', error);
        this.loading = false;
      },
    });
  }

  /**
   * Fetch all Data Transfers for the consumer
   * */
  getConsumerDataTransfers() {
    this.loading = true;
    this.dataTransferService.getAllConsumerDataTransfers().subscribe({
      next: (data) => {
        console.log('Consumer Data Transfers fetched');
        this.dataTransfers = data;
        this.filteredDataTransfers = data;
        this.dataTransferService.cleanupCompleted(data);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching consumer dataTransfers:', error);
        this.loading = false;
      },
    });
  }

  /**
   * Navigate back to the previous page
   * */
  goBack(): void {
    this.location.back();
  }

  /**
   * Check if the data transfer is downloading
   * @param transferId The ID of the data transfer
   * @returns True if the data transfer is downloading, false otherwise
   * */
  isDownloading(transferId: string): boolean {
    return this.dataTransferService.isDownloading(transferId);
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
          this.getConsumerDataTransfers();
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
        this.fetchDataTransfersByRole();
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
        this.fetchDataTransfersByRole();

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
        this.fetchDataTransfersByRole();
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
        this.dataTransferService.viewArtifact(presignedUrl).subscribe({
          next: () => {
            this.fetchDataTransfersByRole();
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
          this.fetchDataTransfersByRole();
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
          this.fetchDataTransfersByRole();
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
          this.fetchDataTransfersByRole();
        },
        error: (error) => {
          console.error('Error suspending contract dataTransfer:', error);
        },
      });
  }
}
