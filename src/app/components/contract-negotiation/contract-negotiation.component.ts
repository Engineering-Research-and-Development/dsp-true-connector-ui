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
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
    MatProgressSpinnerModule,
    MatInputModule,
    MatToolbarModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatSelectModule,
    MatPaginatorModule,
  ],
  templateUrl: './contract-negotiation.component.html',
  styleUrls: ['./contract-negotiation.component.css'],
})
export class ContractNegotiationComponent implements OnInit, OnDestroy {
  userType!: string;
  loading = false;
  contractNegotiations: ContractNegotiation[] = [];
  selectedState: ContractNegotiationState | null = null;
  contractNegotiationStates = Object.values(ContractNegotiationState);
  /** States available in the filter dropdown — OFFERED is excluded because it is
   *  an internal transitional state that is not useful as a search criterion. */
  filterableContractNegotiationStates = this.contractNegotiationStates.filter(
    (s) => s !== ContractNegotiationState.OFFERED
  );

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

  // Filters
  offerIdFilter: string = '';
  providerPidFilter: string = '';
  consumerPidFilter: string = '';

  private destroy$ = new Subject<void>();
  private previousUserType: string | null = null;

  // Expose enum to template
  readonly contractNegotiationState = ContractNegotiationState;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private contractNegotiationService: ContractNegotiationService
  ) {}

  /**
   * Initializes the component by fetching all contract negotiations from the server based on the user type.
   * Subscribes to query parameter changes to detect role switches between consumer and provider.
   * */
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
          this.offerIdFilter = '';
          this.providerPidFilter = '';
          this.consumerPidFilter = '';
          this.paginationState = PaginationHelper.createInitialPaginationState();
          this.sortState = PaginationHelper.createInitialSortState();
          this.filterExpansionState = PaginationHelper.createFilterExpansionState(false);
          this.sortExpansionState = PaginationHelper.createFilterExpansionState(false);
        }
        
        this.userType = newUserType;
        this.previousUserType = newUserType;
        this.loading = true;
        this.fetchContractNegotiations();
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
   * Handle sorting column change
   */
  onSortColumnChange(column: string) {
    this.sortState = {
      ...this.sortState,
      sortColumn: column,
    };
    // Reset to first page when sorting changes
    this.paginationState = PaginationHelper.resetToFirstPage(
      this.paginationState
    );
    this.fetchContractNegotiations();
  }

  /**
   * Handle sorting direction change
   */
  onSortDirectionChange(direction: 'asc' | 'desc') {
    this.sortState = {
      ...this.sortState,
      sortDirection: direction,
    };
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
    // Collapse panels when changing pages
    this.filterExpansionState.filtersExpanded = false;
    this.sortExpansionState.filtersExpanded = false;
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
  onAgree(contractNegotiation: ContractNegotiation) {
    this.contractNegotiationService
      .agreeNegotiation(contractNegotiation['@id'])
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
