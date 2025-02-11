import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
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
import { Distribution } from '../../models/distribution';
import { DistributionService } from '../../services/distribution/distribution.service';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-distribution-management',
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
  ],
  templateUrl: './distribution-management.component.html',
  styleUrl: './distribution-management.component.css',
})
export class DistributionManagementComponent implements OnInit {
  distributions: Distribution[] = [];
  loading: boolean = true;
  searchControl = new FormControl('');
  filteredDistributions: Distribution[] = [];
  constructor(
    private distributionService: DistributionService,
    private router: Router,
    private snackBarService: SnackbarService,
    private dialog: MatDialog
  ) {}

  /**
   * Initializes the component by fetching all distributions from the server.
   * Subscribes to the search control value changes to filter the distributions.
   */
  ngOnInit(): void {
    this.getAllDistributions();
    this.searchControl.valueChanges.subscribe((searchTerm) => {
      this.filteredDistributions = this.distributions.filter((distribution) =>
        distribution.title.toLowerCase().includes(searchTerm!.toLowerCase())
      );
    });
  }

  /**
   * Fetches all distributions from the server.
   * Sets the loading flag to false when the distributions are fetched.
   * Sets the distributions and filtered distributions to the response data.
   */
  getAllDistributions(): void {
    this.distributionService.getAllDistributions().subscribe({
      next: (data) => {
        console.log('Datistributions fetched');
        this.distributions = data;
        this.filteredDistributions = [...this.distributions];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.loading = false;
      },
    });
  }

  /**
   * Navigates to the distribution details page with the distribution data.
   * @param distribution The distribution to navigate to the details page.
   */
  navigateToDistributionDetails(distribution: Distribution): void {
    this.router.navigate(
      ['/catalog-management/distribution-management/details'],
      {
        state: { distribution: distribution },
      }
    );
  }

  /**
   * Navigates to the distribution details page with the distribution data in edit mode.
   * @param distribution The distribution to edit.
   */
  onEdit(distribution: Distribution): void {
    this.router.navigate(
      ['/catalog-management/distribution-management/details'],
      {
        state: { distribution: distribution, editMode: true },
      }
    );
  }

  /**
   * Navigates to the distribution details page with a new distribution in edit mode.
   */
  onAdd() {
    const newDistribution: Distribution = {
      title: '',
      description: [],
      accessService: [],
      hasPolicy: [],
    };
    this.router.navigate(
      ['/catalog-management/distribution-management/details'],
      {
        state: { distribution: newDistribution, editMode: true },
      }
    );
  }

  /**
   * Prompts the dialog with confirmation, and if it is confirmed, it deletes the selected distribution.
   * @param distribution The selected distrubution to delete.
   */
  onDelete(distribution: Distribution) {
    const dialogData = {
      title: 'Confirm deletion of distribution',
      message:
        'Are you sure you want to delete next distribution:  ' +
        distribution.title +
        '? This operation cannot be undone.',
    };
    this.dialog
      .open(ConfirmationDialogComponent, { data: dialogData })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.loading = true;
          this.distributionService
            .deleteDistribution(distribution['@id']!)
            .subscribe({
              next: (data) => {
                this.snackBarService.openSnackBar(
                  data,
                  'OK',
                  'center',
                  'bottom',
                  'snackbar-success'
                );
                this.distributions = this.distributions.filter(
                  (item) => item['@id'] !== distribution['@id']
                );
                this.filteredDistributions = this.filteredDistributions.filter(
                  (item) => item['@id'] !== distribution['@id']
                );
                this.loading = false;
              },
              error: (error) => {
                console.error('Error deleting Distribution:', error);
                this.loading = false;
              },
            });
        }
      });
  }
}
