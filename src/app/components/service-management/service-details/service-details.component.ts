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
import { Dataset } from '../../../models/dataset';
import { Multilanguage } from '../../../models/multilanguage';
import { DataServiceService } from '../../../services/data-service/data-service.service';
import { DatasetService } from '../../../services/dataset/dataset.service';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-service-details',
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
  templateUrl: './service-details.component.html',
  styleUrls: ['./service-details.component.css'],
})
export class ServiceDetailsComponent implements OnInit {
  serviceForm!: FormGroup;
  service!: DataService;
  originalService!: DataService;
  languages: string[] = [];
  selectedLanguage: string = '';
  descriptionValue: string = '';
  editMode = false;
  directEdit = false;
  loading = false;
  allDatasets: Dataset[] = [];

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private location: Location,
    private dataService: DataServiceService,
    private fb: FormBuilder,
    private datasetService: DatasetService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.service = navigation.extras.state['service'];
      if (navigation.extras.state['editMode']) {
        this.editMode = navigation.extras.state['editMode'];
        this.directEdit = navigation.extras.state['editMode'];
        this.originalService = { ...this.service };
      }
      this.languages = this.extractLanguages(this.service.description);
    } else {
      this.goBack();
    }
  }

  /**
   * Initializes the component.
   * */
  ngOnInit(): void {
    this.initForm();
    this.getAllDataSets();
  }

  /**
   * Fetches all datasets.
   * */
  getAllDataSets(): void {
    this.datasetService.getAllDatasets().subscribe({
      next: (data) => {
        this.allDatasets = data;
        if (this.service) {
          this.updateForm(this.service);
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
    return Array.from(languagesSet);
  }

  /**
   * Handles the language selection event.
   * Sets the description value based on the selected language.
   */
  onLanguageSelected(): void {
    const selectedDescription = this.service.description.find(
      (desc) => desc.language === this.selectedLanguage.toLowerCase()
    );
    this.descriptionValue = selectedDescription
      ? selectedDescription.value
      : '';
  }
  /**
   * Toggles the edit mode.
   * If the edit mode is enabled, it saves the service data if it is a new dataset, or updates the service data if it is an existing service.
   * If the edit mode is disabled, it sets the original service data to the current service data.
   * */
  toggleEditMode() {
    if (this.editMode) {
      if (this.directEdit) {
        if (this.service['@id'] != undefined) {
          this.updateServiceData();
          this.directEdit = false;
        } else {
          this.saveServiceData();
        }
      } else {
        this.updateServiceData();
      }
    } else {
      this.originalService = this.service;
    }
    this.editMode = !this.editMode;
  }

  /**
   * Cancels the edit mode.
   * Sets the service data to the original service data and sets the edit mode to false.
   * */
  cancelEdit() {
    console.log('Cancelling edit');
    this.service = { ...this.originalService };
    this.updateForm(this.service);
    this.editMode = false;
    if (this.service.type === undefined || this.service.type === '') {
      this.goBack();
    }
  }

  /**
   * Saves the service data.
   * After response is received, sets the service data to the response data, extracts the languages
   * from the descriptions, updates the form with the service data, and sets the loading flag to false.
   * */
  saveServiceData() {
    console.log('Saving service data');
    this.loading = true;
    this.dataService
      .createDataService(this.cleanFormData(this.serviceForm))
      .subscribe({
        next: (data) => {
          console.log('Service data saved');
          this.service = data;
          this.languages = this.extractLanguages(this.service.description);
          this.onLanguageSelected();
          this.updateForm(this.service);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error saving service data:', error);
          this.loading = false;
        },
      });
  }

  /**
   * Updates the service data.
   * After response is received, sets the service data to the response data, extracts the languages
   * from the descriptions, updates the form with the service data, and sets the loading flag to false.
   * If an error occurs, sets the loading flag to false and shows a snackbar with an error message.
   * */
  updateServiceData() {
    this.loading = true;
    console.log('Updating service data');
    this.dataService
      .updateDataService(
        this.service['@id']!,
        this.cleanFormData(this.serviceForm)
      )
      .subscribe({
        next: (data) => {
          console.log('Service data updated successfully');
          this.service = data;
          this.languages = this.extractLanguages(this.service.description);
          this.onLanguageSelected();
          this.updateForm(this.service);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating service data:', error);
          this.loading = false;
        },
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
              this.loading = false;
              this.goBack();
            },
            error: (error) => {
              console.error('Error deleting service:', error);
              this.loading = false;
            },
          });
        }
      });
  }

  /**
   * Adds a description form group to the description form array.
   * */
  addDescription() {
    const control = this.fb.group({
      language: ['', Validators.required],
      value: ['', Validators.required],
    });
    (this.serviceForm.get('description') as FormArray).push(control);
  }

  /**
   * Removes the description form group at the specified index from the description form array.
   * @param index The index of the description form group to remove.
   * */
  removeDescription(index: number) {
    (this.serviceForm.get('description') as FormArray).removeAt(index);
  }

  /**
   * Adds a keyword form control to the keyword form array.
   * */
  addKeyword() {
    const control = this.fb.control('', Validators.required);
    (this.serviceForm.get('keyword') as FormArray).push(control);
  }

  /**
   * Removes a keyword form control from the keyword form array.
   * @param index The index of the keyword form control to remove.
   * */
  removeKeyword(index: number) {
    (this.serviceForm.get('keyword') as FormArray).removeAt(index);
  }

  /**
   * Adds a theme form control to the theme form array.
   * */
  addTheme() {
    const control = this.fb.control('', Validators.required);
    (this.serviceForm.get('theme') as FormArray).push(control);
  }

  /**
   * Removes a theme form control from the theme form array.
   * @param index The index of the theme form control to remove.
   * */
  removeTheme(index: number) {
    (this.serviceForm.get('theme') as FormArray).removeAt(index);
  }

  /**
   * Navigates to the dataset details page.
   * @param dataset The dataset to navigate to.
   * */
  navigateToDataSetDetails(dataset: Dataset) {
    this.router.navigate(['/catalog-management/dataset-management/details'], {
      state: { dataset: dataset },
    });
  }

  /**
   * Returns the description form controls.
   * @returns The description form controls.
   * */
  get descriptionControls() {
    return (this.serviceForm.get('description') as FormArray).controls;
  }

  /**
   * Returns the keyword form controls.
   * @returns The keyword form controls.
   * */
  get keywordControls() {
    return (this.serviceForm.get('keyword') as FormArray).controls;
  }

  /**
   * Returns the theme form controls.
   * @returns The theme form controls.
   * */
  get themeControls() {
    return (this.serviceForm.get('theme') as FormArray).controls;
  }

  /**
   * Returns the dataset form controls.
   * @returns The dataset form controls.
   * */
  get datasetControls() {
    return (this.serviceForm.get('servesDataset') as FormArray).controls;
  }

  /**
   * Helper function to initialize the form.
   */
  initForm(): void {
    this.serviceForm = this.fb.group({
      '@id': [''],
      title: [null, Validators.required],
      identifier: null,
      description: this.fb.array([]),
      keyword: this.fb.array([], Validators.required),
      theme: this.fb.array([], Validators.required),
      creator: null,
      conformsTo: null,
      endpointDescription: ['', Validators.required],
      endpointURL: ['', Validators.required],
      createdBy: null,
      lastModifiedBy: null,
      version: null,
      issued: null,
      modified: null,
      servesDataset: [[]],
    });
  }

  /**
   * Helper function to update the form with the service data.
   * @param service The service data to update the form with.
   */
  updateForm(service: DataService): void {
    if (service) {
      this.serviceForm.patchValue({
        '@id': service['@id'],
        title: service.title,
        identifier: service.identifier,
        creator: service.creator,
        conformsTo: service.conformsTo,
        endpointDescription: service.endpointDescription,
        endpointURL: service.endpointURL,
        createdBy: service.createdBy,
        lastModifiedBy: service.lastModifiedBy,
        version: service.version,
        issued: service.issued,
        modified: service.modified,
      });

      if (
        service.description.length === 0 &&
        service.keyword.length === 0 &&
        service.theme.length === 0
      ) {
        this.addDescription();
        this.addKeyword();
        this.addTheme();
      } else {
        this.setFormArray('description', service.description);
        this.setFormArray('keyword', service.keyword);
        this.setFormArray('theme', service.theme);
      }
    }
  }

  /**
   * Helper function to set the form array.
   * @param formArrayName The name of the form array.
   * @param values The values to set.
   */
  setFormArray(formArrayName: string, values: any[]): void {
    const formArray = this.serviceForm.get(formArrayName) as FormArray;
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

    return cleanedData;
  }
}
