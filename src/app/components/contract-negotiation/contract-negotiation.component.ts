import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
import { ContractNegotiation } from '../../models/contractNegotiation';
import { ContractNegotiationState } from '../../models/enums/contractNegotiationState';
import { ContractNegotiationService } from '../../services/contract-negotiation/contract-negotiation.service';

@Component({
  selector: 'app-contract-negotiation',
  standalone: true,
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
  templateUrl: './contract-negotiation.component.html',
  styleUrls: ['./contract-negotiation.component.css'],
})
export class ContractNegotiationComponent implements OnInit {
  userType!: string;
  loading = false;
  contractNegotiations: ContractNegotiation[] = [];
  filteredContractNegotiations: ContractNegotiation[] = [];
  selectedStates: ContractNegotiationState[] = [];
  contractNegotiationStates = Object.values(ContractNegotiationState);

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
    if (this.userType === 'provider') {
      this.getProviderContractNegotiations();
    } else if (this.userType === 'consumer') {
      this.getConsumerContractNegotiations();
    }
  }

  /**
   * Navigates back to the previous page.
   * */
  goBack(): void {
    this.location.back();
  }

  /**
   * Fetches all contract negotiations from the server as a provider.
   */
  getProviderContractNegotiations() {
    this.contractNegotiationService.getAllNegotiationsAsProvider().subscribe({
      next: (data) => {
        this.contractNegotiations = data;
        this.filterContractNegotiations();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching provider contract negotiations:', error);
        this.loading = false;
      },
    });
  }

  /**
   * Fetches all contract negotiations from the server as a consumer.
   * */
  getConsumerContractNegotiations() {
    this.contractNegotiationService.getAllNegotiationsAsConsumer().subscribe({
      next: (data) => {
        this.contractNegotiations = data;
        this.filterContractNegotiations();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching consumer contract negotiations:', error);
        this.loading = false;
      },
    });
  }

  /**
   * Toggles the selection of the contract negotiation state.
   * @param state The contract negotiation state to toggle.
   */
  toggleStateSelection(state: ContractNegotiationState) {
    const index = this.selectedStates.indexOf(state);
    if (index > -1) {
      this.selectedStates.splice(index, 1);
    } else {
      this.selectedStates.push(state);
    }
    this.filterContractNegotiations();
  }

  /**
   * Filters the contract negotiations based on the selected states.
   */
  filterContractNegotiations() {
    if (this.selectedStates.length > 0) {
      this.filteredContractNegotiations = this.contractNegotiations.filter(
        (negotiation) => this.selectedStates.includes(negotiation.state)
      );
    } else {
      this.filteredContractNegotiations = this.contractNegotiations;
    }
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
          this.getProviderContractNegotiations();
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
          this.getConsumerContractNegotiations();
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
          this.getConsumerContractNegotiations();
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
          this.getProviderContractNegotiations();
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
          this.getProviderContractNegotiations();
        },
        error: (error) => {
          console.error('Error terminating contract negotiation:', error);
        },
      });
  }
}
