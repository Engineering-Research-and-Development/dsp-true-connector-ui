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
import { Dataset } from '../../models/dataset';
import { DatasetService } from '../../services/dataset/dataset.service';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-dataset-management',
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
  templateUrl: './dataset-management.component.html',
  styleUrl: './dataset-management.component.css',
})
export class DatasetManagementComponent implements OnInit {
  datasets: Dataset[] = [];
  loading: boolean = true;
  searchControl = new FormControl('');
  filteredDatasets: Dataset[] = [];
  constructor(
    public dialog: MatDialog,
    private datasetService: DatasetService,
    private router: Router,
    private snackBarService: SnackbarService
  ) {}

  /**
   * Initializes the component by fetching all datasets from the server.
   * Subscribes to the search control value changes to filter the datasets.
   *
   */
  ngOnInit(): void {
    this.getAllDatasets();
    this.searchControl.valueChanges.subscribe((searchTerm) => {
      this.filteredDatasets = this.datasets.filter((dataSet) =>
        dataSet.title.toLowerCase().includes(searchTerm!.toLowerCase())
      );
    });
  }

  /**
   * Fetches all datasets from the server and sets the loading flag to false
   * when the response is received.
   * Sets the datasets and filtered datasets to the response data.
   */
  getAllDatasets(): void {
    this.datasetService.getAllDatasets().subscribe({
      next: (data) => {
        console.log('Data services:', data);
        this.datasets = data;
        this.filteredDatasets = [...this.datasets];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.loading = false;
      },
    });
  }

  /**
   * Navigates to the dataset details page with the selected dataset.
   * @param dataset The selected dataset to view details for.
   */
  navigateToDatasetDetails(dataset: Dataset): void {
    this.router.navigate(['/catalog-management/dataset-management/details'], {
      state: { dataset: dataset },
    });
  }

  /**
   * Navigates to the dataset details page with the selected dataset in edit mode.
   * @param dataset The selected dataset to edit.
   */
  onEdit(dataset: Dataset): void {
    this.router.navigate(['/catalog-management/dataset-management/details'], {
      state: { dataset: dataset, editMode: true },
    });
  }

  /**
   * Navigates to the dataset details page with a new dataset in edit mode.
   */
  onAdd() {
    const newDataSet: any = {
      keyword: [],
      theme: [],
      conformsTo: '',
      creator: '',
      description: [],
      identifier: '',
      title: '',
      endpointDescription: '',
      endpointURL: '',
      distribution: [],
      hasPolicy: [],
    };
    this.router.navigate(['/catalog-management/dataset-management/details'], {
      state: { dataset: newDataSet, editMode: true },
    });
  }

  /**
   * Deletes the datset.
   * Prompts the dialog with confirmation, and if it is confirmed, it deletes the selected dataset.
   * @param dataset The dataset to delete.
   * */
  onDelete(dataset: Dataset) {
    const dialogData = {
      title: 'Confirm deletion of dataset',
      message:
        'Are you sure you want to delete next dataset:  ' +
        dataset.title +
        '? This operation cannot be undone.',
    };
    this.dialog
      .open(ConfirmationDialogComponent, { data: dialogData })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.loading = true;
          this.datasetService.deleteDataset(dataset['@id']!).subscribe({
            next: (data) => {
              this.snackBarService.openSnackBar(
                data,
                'OK',
                'center',
                'bottom',
                'snackbar-success'
              );
              this.datasets = this.datasets.filter(
                (item) => item['@id'] !== dataset['@id']
              );
              this.filteredDatasets = this.filteredDatasets.filter(
                (item) => item['@id'] !== dataset['@id']
              );
              this.loading = false;
            },
            error: (error) => {
              console.error('Error deleting dataset:', error);
              this.loading = false;
            },
          });
        }
      });
  }
}
