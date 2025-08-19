import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ContractNegotiation } from '../../models/contractNegotiation';
import { ContractNegotiationState } from '../../models/enums/contractNegotiationState';
import { ContractNegotiationService } from '../../services/contract-negotiation/contract-negotiation.service';
import {
  FilterExpansionState,
  PaginationHelper,
  PaginationState,
  SortState,
} from '../../shared/utils/pagination.utils';

@Component({
  selector: 'app-contract-negotiation',
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
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './contract-negotiation.component.html',
  styleUrls: ['./contract-negotiation.component.css'],
})
export class ContractNegotiationComponent implements OnInit {
  userType!: string;
  loading = false;
  contractNegotiations: ContractNegotiation[] = [];
  selectedState: ContractNegotiationState | null = null;
  contractNegotiationStates = Object.values(ContractNegotiationState);

  // Pagination and sorting using shared utility
  paginationState: PaginationState =
    PaginationHelper.createInitialPaginationState();
  sortState: SortState = PaginationHelper.createInitialSortState();

  // Filter expansion state using shared utility
  filterExpansionState: FilterExpansionState =
    PaginationHelper.createFilterExpansionState();

  // Filters
  offerIdFilter: string = '';
  providerPidFilter: string = '';
  consumerPidFilter: string = '';

  contractNegotiationState = ContractNegotiationState;

  constructor(
    private router: Router,
    private location: Location,
    private contractNegotiationService: ContractNegotiationService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.userType = navigation.extras.state['userType'];
    } else {
      this.goBack();
    }
  }

  /**
   * Initializes the component by fetching all contract negotiations from the server based on the user type.
   * */
  ngOnInit(): void {
    this.loading = true;
    this.fetchContractNegotiations();
  }

  /**
   * Navigates back to the previous page.
   * */
  goBack(): void {
    this.location.back();
  }

  /**
   * Fetch contract negotiations with current filters and pagination
   */
  fetchContractNegotiations() {
    this.loading = true;

    const filters = {
      role: this.userType,
      state: this.selectedState || undefined,
      offerId: this.offerIdFilter || undefined,
      providerPid: this.providerPidFilter || undefined,
      consumerPid: this.consumerPidFilter || undefined,
    };

    const paginationOptions = PaginationHelper.createPaginationOptions(
      this.paginationState,
      this.sortState
    );

    this.contractNegotiationService
      .getContractNegotiationsWithFilters(filters, paginationOptions)
      .subscribe({
        next: (response) => {
          console.log('Contract Negotiations fetched');
          this.contractNegotiations = response.response.data?.content || [];
          if (response.response.data?.page) {
            this.paginationState = PaginationHelper.updateTotalElements(
              this.paginationState,
              response.response.data.page.totalElements
            );
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching contract negotiations:', error);
          this.loading = false;
        },
      });
  }

  /**
   * Apply filters and fetch contract negotiations with filtering and pagination
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
    this.fetchContractNegotiations();
  }

  /**
   * Clear all filters and fetch all contract negotiations
   */
  clearFilters() {
    // Keep the expansion panel open after clearing filters
    this.filterExpansionState = PaginationHelper.keepFilterExpansionOpen(
      this.filterExpansionState
    );

    this.selectedState = null;
    this.offerIdFilter = '';
    this.providerPidFilter = '';
    this.consumerPidFilter = '';

    // Reset to first page
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchContractNegotiations();
  }

  /**
   * Handle sort change
   */
  onSortChange(sort: Sort) {
    this.sortState = PaginationHelper.handleSortChange(
      { active: sort.active, direction: sort.direction as 'asc' | 'desc' },
      this.sortState
    );
    // Reset to first page when sorting changes
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchContractNegotiations();
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent) {
    this.paginationState = PaginationHelper.handlePageChange(
      { pageIndex: event.pageIndex, pageSize: event.pageSize },
      this.paginationState
    );
    this.fetchContractNegotiations();
  }

  /**
   * Gets the display name for the contract negotiation state.
   * @param state The contract negotiation state.
   * @returns The display name of the contract negotiation state.
   */
  getStateDisplayName(state: ContractNegotiationState): string {
    return state;
  }

  /**
   * Handle the approve event of the contract negotiation
   * @param contractNegotiation The contract negotiation
   * */
  onApprove(contractNegotiation: ContractNegotiation) {
    this.contractNegotiationService
      .approveNegotiation(contractNegotiation['@id'])
      .subscribe({
        next: () => {
          this.fetchContractNegotiations();
        },
        error: (error) => {
          console.error('Error approving contract negotiation:', error);
        },
      });
  }

  /**
   * Handle the accept event of the contract negotiation
   * @param contractNegotiation The contract negotiation
   */
  onAccept(contractNegotiation: ContractNegotiation) {
    this.contractNegotiationService
      .acceptNegotiation(contractNegotiation['@id'])
      .subscribe({
        next: () => {
          this.fetchContractNegotiations();
        },
        error: (error) => {
          console.error('Error accepting contract negotiation:', error);
        },
      });
  }
  /**
   * Handle the reject event of the contract negotiation
   * @param contractNegotiation The contract negotiation
   * */
  onVerify(contractNegotiation: ContractNegotiation) {
    this.contractNegotiationService
      .verifyNegotiation(contractNegotiation['@id'])
      .subscribe({
        next: () => {
          this.fetchContractNegotiations();
        },
        error: (error) => {
          console.error('Error verifying contract negotiation:', error);
        },
      });
  }

  /**
   * Handle the finalize event of the contract negotiation
   * @param contractNegotiation The contract negotiation
   * */
  onFinalize(contractNegotiation: ContractNegotiation) {
    this.contractNegotiationService
      .finalizeNegotiation(contractNegotiation['@id'])
      .subscribe({
        next: () => {
          this.fetchContractNegotiations();
        },
        error: (error) => {
          console.error('Error finalizing contract negotiation:', error);
        },
      });
  }

  /**
   * Handle the terminate event of the contract negotiation
   * @param contractNegotiation The contract negotiation
   * */
  onTerminate(contractNegotiation: ContractNegotiation) {
    this.contractNegotiationService
      .terminateNegotiation(contractNegotiation['@id'])
      .subscribe({
        next: () => {
          this.fetchContractNegotiations();
        },
        error: (error) => {
          console.error('Error terminating contract negotiation:', error);
        },
      });
  }
}
