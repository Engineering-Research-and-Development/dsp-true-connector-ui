import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Catalog } from '../../../models/catalog';
import { Distribution } from '../../../models/distribution';
import { Action } from '../../../models/enums/action.enum';
import { LeftOperand } from '../../../models/enums/left-operand.enum';
import { Operator } from '../../../models/enums/operators.enum';
import { Multilanguage } from '../../../models/multilanguage';
import { Offer } from '../../../models/offer';
import { ContractNegotiationService } from '../../../services/contract-negotiation/contract-negotiation.service';
import { SnackbarService } from '../../../services/snackbar/snackbar.service';
import { CnDetailsDialogComponent } from './cn-details-dialog/cn-details-dialog.component';

@Component({
    selector: 'app-catalog-browser-details',
    imports: [
        CommonModule,
        MatTooltipModule,
        MatTabsModule,
        MatCardModule,
        NgxSkeletonLoaderModule,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatExpansionModule,
        MatCheckboxModule,
    ],
    templateUrl: './catalog-browser-details.component.html',
    styleUrl: './catalog-browser-details.component.css'
})
export class CatalogBrowserDetailsComponent {
  catalogData!: Catalog | undefined;
  loading: boolean = true;
  languages: string[] = [];
  selectedLanguage: string = '';
  descriptionValue: string = '';

  selectedOffer: Offer | null = null;
  selectedDistribution: any | null = null;

  constructor(
    private router: Router,
    private location: Location,
    public dialog: MatDialog,
    private contractNegotiationService: ContractNegotiationService,
    private snackBarService: SnackbarService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.catalogData = navigation.extras.state['catalog'];
      this.languages = this.extractLanguages(this.catalogData!.description);
      this.loading = false;
    } else {
      this.goBack();
    }
  }

  /**
   * Opens the details dialog for the given item.
   * @param item The item to show details for.
   * @param type The type of the item.
   * */
  showMoreDetails(item: any, type: string): void {
    const dialogData = {
      type: type,
      item: item,
    };
    this.dialog
      .open(CnDetailsDialogComponent, { data: dialogData })
      .afterClosed()
      .subscribe((result) => {
        console.log('The dialog was closed');
      });
  }

  /**
   * Stores the selected offer.
   * Deselects any previous offer.
   */
  onOfferSelected(offer: Offer): void {
    if (this.selectedOffer === offer) {
      this.selectedOffer = null;
    } else {
      this.selectedOffer = offer;
    }
  }

  /**
   * Stores the selected distribution.
   * Deselects any previous distribution.
   */
  onDistributionSelected(distribution: any): void {
    if (this.selectedDistribution === distribution) {
      this.selectedDistribution = null;
    } else {
      this.selectedDistribution = distribution;
    }
  }

  /**
   * Checks if the given offer is the currently selected one.
   */
  isSelectedOffer(offer: Offer): boolean {
    return this.selectedOffer === offer;
  }

  /**
   * Checks if the given distribution is the currently selected one.
   */
  isSelectedDistribution(distribution: any): boolean {
    return this.selectedDistribution === distribution;
  }

  /**
   * Constructs the negotiation request object from the selected offer and distribution.
   * @param offer The selected offer.
   * @param distributionId The ID of the selected distribution.
   * @returns The constructed negotiation request object.
   * */
  constructOfferNegotiationRequest(
    offer: Offer,
    distribution: Distribution,
    datasetId: string
  ): any {
    const endpointURL = distribution.accessService[0].endpointURL;
    const baseEndpoint = endpointURL.endsWith('/')
      ? endpointURL
      : endpointURL + '/';
    const negotiationRequest = {
      'Forward-To': baseEndpoint,
      offer: {
        '@id': offer['@id'],
        target: datasetId,
        assigner: 'urn:uuid:ASSIGNER_PROVIDER',
        permission: [] as any[],
      },
    };

    // Loop through all permissions in the offer and extract required fields
    offer.permission.forEach((perm: any) => {
      const permission = {
        action: Object.values(Action).find((a) => a === perm.action),
        constraint: perm.constraint.map((constr: any) => ({
          leftOperand: Object.values(LeftOperand).find(
            (lo) => lo === constr.leftOperand
          ),
          operator: Object.values(Operator).find(
            (op) => op === constr.operator
          ),
          rightOperand: constr.rightOperand,
        })),
      };

      negotiationRequest.offer.permission.push(permission);
    });

    return negotiationRequest;
  }

  /**
   * Starts the contract negotiation process.
   */
  startContractNegotiation(datasetId: string): void {
    if (this.selectedOffer && this.selectedDistribution) {
      const negotiationRequest = this.constructOfferNegotiationRequest(
        this.selectedOffer,
        this.selectedDistribution,
        datasetId
      );

      this.contractNegotiationService
        .startNegotiation(negotiationRequest)
        .subscribe({
          next: (response) => {
            this.router.navigate(['/contract-negotiation'], {
              state: { userType: 'consumer' },
            });
          },
          error: (error) => {
            console.error('Error starting negotiation:', error);
          },
        });
    } else {
      this.snackBarService.openSnackBar(
        'Please select both an offer and a distribution.',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
    }
  }

  /**
   * Extracts the languages from the descriptions to be used in the language select dropdown.
   * @param descriptions The service descriptions.
   * @returns The list of languages.
   */
  extractLanguages(descriptions: Multilanguage[]): string[] {
    const languagesSet = new Set<string>();

    descriptions.forEach((desc: Multilanguage) => {
      languagesSet.add(desc.language);
    });

    return Array.from(languagesSet);
  }

  /**
   * Handles the language selection event.
   * Sets the description value based on the selected language.
   */
  onLanguageSelected(): void {
    const selectedDescription = this.catalogData!.description.find(
      (desc) => desc.language === this.selectedLanguage.toLowerCase()
    );
    this.descriptionValue = selectedDescription
      ? selectedDescription.value
      : '';
  }

  /**
   * Navigates back to the previous location.
   * */
  goBack(): void {
    this.location.back();
  }
}
