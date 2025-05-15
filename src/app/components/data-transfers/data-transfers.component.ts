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
    ],
    templateUrl: './data-transfers.component.html',
    styleUrl: './data-transfers.component.css'
})
export class DataTransfersComponent {
  userType!: string;
  loading = false;
  dataTransfers: DataTransfer[] = [];
  filteredDataTransfers: DataTransfer[] = [];
  selectedStates: DataTransferState[] = [];
  dataTransferStates = Object.values(DataTransferState);

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
   * Navigate back to the previous page
   * */
  goBack(): void {
    this.location.back();
  }

  /**
   * Fetch all Data Transfers for the provider
   */
  getProviderDataTransfers() {
    this.dataTransferService.getAllProviderDataTransfers().subscribe({
      next: (data) => {
        console.log('Data Transfers fetched');

        this.dataTransfers = data;
        this.filterDataTransfers();
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
    this.dataTransferService.getAllConsumerDataTransfers().subscribe({
      next: (data) => {
        this.dataTransfers = data;
        this.filterDataTransfers();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching consumer dataTransfers:', error);
        this.loading = false;
      },
    });
  }

  /**
   * Handle the change event of the Data Transfer states filter
   * @param selected The selected Data Transfer states
   */
  toggleStateSelection(state: DataTransferState): void {
    const index = this.selectedStates.indexOf(state);
    if (index > -1) {
      this.selectedStates.splice(index, 1);
    } else {
      this.selectedStates.push(state);
    }
    this.filterDataTransfers();
  }

  /**
   * Filter the  Data Transfers based on the selected states
   */
  filterDataTransfers() {
    if (this.selectedStates.length > 0) {
      this.filteredDataTransfers = this.dataTransfers.filter((dataTransfer) =>
        this.selectedStates.includes(dataTransfer.state)
      );
    } else {
      this.filteredDataTransfers = this.dataTransfers;
    }
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
      next: () => {
        this.fetchDataTransfersByRole();
      },
      error: (error) => {
        console.error('Error downloading artifact:', error);
      },
    });
  }

  /**
   * Handle the view event of data transfer
   * @param dataTransfer The data transfer object
   * */
  onView(dataTransfer: DataTransfer) {
    this.dataTransferService.viewArtifact(dataTransfer['@id']).subscribe({
      next: () => {
        this.fetchDataTransfersByRole();
      },
      error: (error) => {
        console.error('Error viewing data transfer:', error);
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
