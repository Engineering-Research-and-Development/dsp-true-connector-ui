import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { DataService } from '../../../models/dataService';
import { Multilanguage } from '../../../models/multilanguage';
import { Offer } from '../../../models/offer';
import { DataServiceService } from '../../../services/data-service/data-service.service';
import { DistributionService } from '../../../services/distribution/distribution.service';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { Distribution } from './../../../models/distribution';

@Component({
  selector: 'app-distribution-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatExpansionModule,
    MatToolbarModule,
    NgxSkeletonLoaderModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
    MatTabsModule,
  ],
  templateUrl: './distribution-details.component.html',
  styleUrl: './distribution-details.component.css',
})
export class DistributionDetailsComponent implements OnInit {
  distributionForm!: FormGroup;
  distribution!: Distribution;
  originalDistribution!: Distribution;
  languages: string[] = [];
  selectedLanguage: string = '';
  descriptionValue: string = '';
  editMode = false;
  directEdit = false;
  loading = false;
  allServices: DataService[] = [];

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private location: Location,
    private distributionService: DistributionService,
    private fb: FormBuilder,
    private dataServiceService: DataServiceService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.distribution = navigation.extras.state['distribution'];
      console.log('Distribution:', this.distribution);

      if (navigation.extras.state['editMode']) {
        this.editMode = navigation.extras.state['editMode'];
        this.directEdit = navigation.extras.state['editMode'];
        this.originalDistribution = { ...this.distribution };
      }
    } else {
      this.goBack();
    }
  }

  /**
   * Initializes the component by extracting the languages from the descriptions and updating the form with the distribution data.
   * */
  ngOnInit(): void {
    this.initForm();
    this.getAllServices();
  }

  /**
   * Fetches all services from the server.
   * */
  getAllServices(): void {
    this.dataServiceService.getAllDataServices().subscribe({
      next: (data) => {
        console.log('Data services:', data);
        this.allServices = data;
        this.loading = false;
        if (this.distribution) {
          this.updateForm(this.distribution);
        }
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
  }

  /**
   * Navigates back to the previous location.
   * */
  goBack(): void {
    this.location.back();
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
    console.log('Languages set:', languagesSet);
    return Array.from(languagesSet);
  }

  /**
   * Handles the language selection event.
   * Sets the description value based on the selected language.
   */
  onLanguageSelected(): void {
    const selectedDescription = this.distribution.description.find(
      (desc) => desc.language === this.selectedLanguage.toLowerCase()
    );
    this.descriptionValue = selectedDescription
      ? selectedDescription.value
      : '';
  }

  /**
   * Toggles the edit mode.
   * If the edit mode is enabled, it saves the distribution data if it is a new distribution, or updates the distribution data if it is an existing dataset.
   * If the edit mode is disabled, it sets the original distribution data to the current distribution data.
   * */
  toggleEditMode() {
    if (this.editMode) {
      if (this.directEdit) {
        if (this.distribution['@id'] != undefined) {
          this.updateDistributionData();
          this.directEdit = false;
        } else {
          this.saveDistributionData();
        }
      } else {
        this.updateDistributionData();
      }
    } else {
      this.originalDistribution = this.distribution;
    }
    this.editMode = !this.editMode;
  }

  /**
   * Cancels the edit mode.
   * Sets the distribution data to the original distribution data and sets the edit mode to false.
   * */
  cancelEdit() {
    console.log('Cancelling edit');
    this.distribution = { ...this.originalDistribution };
    this.updateForm(this.distribution);
    this.editMode = false;
    if (this.distribution.type === undefined || this.distribution.type === '') {
      this.goBack();
    }
  }

  /**
   * Saves the distribution data.
   * After response is received, sets the distribution data to the response data, extracts the languages
   * from the descriptions, updates the form with the distribution data, and sets the loading flag to false.
   * */
  saveDistributionData() {
    this.loading = true;
    this.distributionService
      .createDistribution(this.cleanFormData(this.distributionForm))
      .subscribe({
        next: (data) => {
          this.loading = false;
          this.distribution = data;
          this.languages = this.extractLanguages(this.distribution.description);
          this.onLanguageSelected();
          this.updateForm(this.distribution);
        },
        error: (error) => {
          console.error('Error saving distribution:', error);
          this.loading = false;
        },
      });
  }

  /**
   * Updates the distribution data.
   * After response is received, sets the distribution data to the response data, extracts the languages
   * from the descriptions, updates the form with the distribution data, and sets the loading flag to false.
   * If an error occurs, sets the loading flag to false and shows a snackbar with an error message.
   * */
  updateDistributionData() {
    this.loading = true;
    this.distributionService
      .updateDistribution(
        this.distribution['@id']!,
        this.cleanFormData(this.distributionForm)
      )
      .subscribe({
        next: (data) => {
          console.log('Distribution updated successfully', data);
          this.distribution = data;
          this.languages = this.extractLanguages(this.distribution.description);
          this.onLanguageSelected();
          this.updateForm(this.distribution);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating Distribution data:', error);
          this.loading = false;
        },
      });
  }

  /**
   * Prompts the dialog with confirmation, and if it is confirmed, it deletes the selected distribution.
   * @param distribution The selected service to delete.
   */
  onDelete(distribution: Distribution) {
    const dialogData = {
      title: 'Confirm deletion of distribution',
      message:
        'Are you sure you want to delete next service:  ' +
        this.distribution.title +
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
                this.loading = false;
                this.goBack();
              },
              error: (error) => {
                console.error('Error deleting distribution:', error);
                this.loading = false;
              },
            });
        }
      });
  }

  /**
   * Adds a new description to the distribution form.
   * */
  addDescription() {
    const control = this.fb.group({
      language: ['', Validators.required],
      value: ['', Validators.required],
    });
    (this.distributionForm.get('description') as FormArray).push(control);
  }

  /**
   * Removes a description from the distribution form.
   * @param index The index of the description to remove.
   * */
  removeDescription(index: number) {
    (this.distributionForm.get('description') as FormArray).removeAt(index);
  }

  /**
   * Navigates to the service details page.
   * @param service The service to navigate to.
   * */
  navigateToServiceDetails(service: DataService) {
    this.router.navigate(['/catalog-management/service-management/details'], {
      state: { service: service },
    });
  }

  /**
   * Navigates to the policy details page.
   * @param policy The policy to navigate
   * */
  navigateToPolicyDetails(policy: Offer) {
    this.router.navigate(['catalog-management/policy-management/details'], {
      state: { policy: policy },
    });
  }

  /**
   * Returns the description form controls.
   * @returns The description form controls.
   * */
  get descriptionControls() {
    return (this.distributionForm.get('description') as FormArray).controls;
  }

  /**
   * Helper function to initialize the form.
   */
  initForm(): void {
    this.distributionForm = this.fb.group({
      '@id': [''],
      title: ['', Validators.required],
      description: this.fb.array([]),
      createdBy: null,
      lastModifiedBy: null,
      version: null,
      issued: null,
      modified: null,
      hasPolicy: this.fb.array([]),
      accessService: [[], Validators.required],
    });
  }

  /**
   * Helper function to update the form with the distribution data.
   * @param distribution The distribution data to update the form with.
   */
  updateForm(distribution: Distribution): void {
    if (distribution) {
      this.distributionForm.patchValue({
        '@id': distribution['@id'],
        title: distribution.title,
        createdBy: distribution.createdBy,
        lastModifiedBy: distribution.lastModifiedBy,
        version: distribution.version,
        issued: distribution.issued,
        modified: distribution.modified,
        // accessService: distribution.accessService.map((service) => service.id), // Adjusted to set multiple values
      });
      this.distributionForm
        .get('accessService')
        ?.setValue(
          distribution.accessService.map((service) =>
            this.allServices.find((s) => s['@id'] === service['@id'])
          )
        );
      this.setFormArray('description', distribution.description);
      this.setFormArray('hasPolicy', distribution.hasPolicy || []);
    }
  }

  /**
   * Helper function to set the form array.
   * @param formArrayName The name of the form array.
   * @param values The values to set.
   */
  setFormArray(formArrayName: string, values: any[]): void {
    const formArray = this.distributionForm.get(formArrayName) as FormArray;
    formArray.clear();
    if (values) {
      values.forEach((value) => {
        if (formArrayName === 'description') {
          formArray.push(
            this.fb.group({
              language: [value.language, Validators.required],
              value: [value.value, Validators.required],
            })
          );
        } else {
          formArray.push(this.fb.control(value, Validators.required));
        }
      });
    }
  }

  /**
   * Helper function to clean the form data before sending it to the server.
   * Removes the id, createdBy, lastModifiedBy, version, issued, and modified fields from the form group.
   * @param formGroup The form group to clean.
   * @returns The cleaned form group.
   * */
  cleanFormData(formGroup: FormGroup): any {
    const cleanedData = { ...formGroup.value };

    delete cleanedData['@id'];
    delete cleanedData.createdBy;
    delete cleanedData.lastModifiedBy;
    delete cleanedData.version;
    delete cleanedData.issued;
    delete cleanedData.modified;

    Object.keys(cleanedData).forEach((key) => {
      if (cleanedData[key] === '') {
        cleanedData[key] = null;
      } else if (
        Array.isArray(cleanedData[key]) &&
        cleanedData[key].length === 0
      ) {
        cleanedData[key] = [];
      }
    });

    console.log('Cleaned data:', cleanedData);
    return cleanedData;
  }
}
