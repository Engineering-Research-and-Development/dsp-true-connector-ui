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
import { DataServiceService } from '../../services/data-service/data-service.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { DataService } from './../../models/dataService';

@Component({
    selector: 'app-service-management',
    imports: [
        CommonModule,
        MatCardModule,
        MatDividerModule,
        MatListModule,
        MatExpansionModule,
        MatIconModule,
        NgxSkeletonLoaderModule,
        MatInputModule,
        MatToolbarModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatTooltipModule,
        MatButtonModule,
    ],
    templateUrl: './service-management.component.html',
    styleUrl: './service-management.component.css'
})
export class ServiceManagementComponent implements OnInit {
  dataServices: DataService[] = [];
  loading: boolean = true;
  searchControl = new FormControl('');
  filteredDataServices: DataService[] = [];

  constructor(
    public dialog: MatDialog,
    private dataServiceService: DataServiceService,
    private router: Router,
    private dataService: DataServiceService
  ) {}

  /**
   * Initializes the component by fetching all data services from the server.
   * Subscribes to the search control value changes to filter the data services.
   * */
  ngOnInit(): void {
    this.getAllDataServices();
    this.searchControl.valueChanges.subscribe((searchTerm) => {
      this.filteredDataServices = this.dataServices.filter((dataService) =>
        dataService.title.toLowerCase().includes(searchTerm!.toLowerCase())
      );
    });
  }

  /**
   * Fetches all data services from the server.
   * Sets the loading flag to false when the response is received.
   * Sets the data services and filtered data services to the response data.
   */
  getAllDataServices(): void {
    this.dataServiceService.getAllDataServices().subscribe({
      next: (data) => {
        this.dataServices = data;
        this.filteredDataServices = [...this.dataServices];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.loading = false;
      },
    });
  }

  /**
   * Navigates to the service details page with the selected service.
   * @param service The selected service.
   */
  navigateToServiceDetails(service: DataService): void {
    this.router.navigate(['/catalog-management/service-management/details'], {
      state: { service: service },
    });
  }

  /**
   * Navigates to the service details page with the selected service in edit mode.
   * @param service The selected service.
   */
  onEdit(service: DataService): void {
    this.router.navigate(['/catalog-management/service-management/details'], {
      state: { service: service, editMode: true },
    });
  }

  /**
   * Navigates to the service details page with a new service in edit mode.
   */
  onAdd() {
    const newService: DataService = {
      keyword: [],
      theme: [],
      conformsTo: '',
      creator: '',
      description: [],
      identifier: '',
      title: '',
      endpointDescription: '',
      endpointURL: '',
    };
    this.router.navigate(['/catalog-management/service-management/details'], {
      state: { service: newService, editMode: true },
    });
  }

  /**
   * Prompts the dialog with confirmation, and if it is confirmed, it deletes the selected service.
   * @param service The selected service to delete.
   */
  onDelete(service: DataService) {
    const dialogData = {
      title: 'Confirm deletion of service',
      message:
        'Are you sure you want to delete next service:  ' +
        service.title +
        '? This operation cannot be undone.',
    };
    this.dialog
      .open(ConfirmationDialogComponent, { data: dialogData })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.loading = true;
          this.dataService.deleteDataService(service['@id']!).subscribe({
            next: (data) => {
              if (data) {
                this.dataServices = this.dataServices.filter(
                  (item) => item['@id'] !== service['@id']
                );
                this.filteredDataServices = this.filteredDataServices.filter(
                  (item) => item['@id'] !== service['@id']
                );
                this.loading = false;
              }
            },
            error: (error) => {
              console.error('Error deleting service:', error);
              this.loading = false;
            },
          });
        }
      });
  }
}
