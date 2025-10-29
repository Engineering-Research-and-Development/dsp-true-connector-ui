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
import { saveAs } from 'file-saver';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Catalog } from '../../models/catalog';
import { DataService } from '../../models/dataService';
import { Dataset } from '../../models/dataset';
import { Distribution } from '../../models/distribution';
import { Multilanguage } from '../../models/multilanguage';
import { CatalogService } from '../../services/catalog/catalog.service';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { EditStateService } from '../../shared/edit-state.service';
import { ModifiedFieldDirective } from '../../shared/modified-field.directive';
import { OldValuePipe } from '../../shared/old-value.pipe';
import { UnsavedChangesComponent } from '../../shared/unsaved-changes/unsaved-changes.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-catalog-management',
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
    ModifiedFieldDirective,
    OldValuePipe,
    UnsavedChangesComponent,
  ],
  providers: [CatalogService],
  templateUrl: './catalog-management.component.html',
  styleUrls: ['./catalog-management.component.css'],
})
export class CatalogManagementComponent implements OnInit {
  panelOpenState = false;
  catalogData!: Catalog | undefined;
  originalCatalogData!: Catalog | undefined;
  loading: boolean = true;
  languages: string[] = [];
  selectedLanguage: string = '';
  descriptionValue: string = '';
  editMode = false;
  newCatalog = false;
  catalogForm!: FormGroup;
  allServices: DataService[] = [];
  allDistributions: Distribution[] = [];
  allDatasets: Dataset[] = [];
  allPolicies: any[] = [];

  get missingCatalogSections(): string[] {
    if (!this.catalogData) {
      return [];
    }

    const sections = [
      { data: this.catalogData.service, label: 'Service' },
      { data: this.catalogData.dataset, label: 'Dataset' },
      { data: this.catalogData.distribution, label: 'Distribution' },
    ];

    return sections
      .filter((section) => !this.hasItems(section.data))
      .map((section) => section.label);
  }

  get showMissingSectionsAlert(): boolean {
    return !this.editMode && this.missingCatalogSections.length > 0;
  }

  // Change tracking handled by EditStateService

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private catalogService: CatalogService,
    private location: Location,
    private fb: FormBuilder,
    private snackBarService: SnackbarService,
    public editState: EditStateService
  ) {}

  /**
   * Initializes the component.
   * Initializes the form and fetches the catalog data.
   */
  ngOnInit(): void {
    this.initForm();
    this.getCatalogData();
  }

  ngOnDestroy(): void {
    this.editState.destroy();
  }

  /**
   * Fetches the catalog data.
   */
  getCatalogData(): void {
    this.catalogService.getCatalog().subscribe({
      next: (data) => {
        console.log('Catalog data fetched');
        this.catalogData = data;
        this.languages = this.extractLanguages(this.catalogData.description);
        this.updateForm(this.catalogData);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching catalog data:', error);
        this.loading = false;
      },
    });
  }

  /**
   * Saves the catalog data.
   * After response is received, sets the catalog data to the response data, extracts the languages
   * from the descriptions, updates the form with the catalog data, and sets the loading flag to false.
   * */
  saveCatalogData() {
    this.loading = true;
    this.catalogService
      .createCatalog(this.cleanFormData(this.catalogForm, 'create'))
      .subscribe({
        next: (data) => {
          this.catalogData = data;
          this.languages = this.extractLanguages(this.catalogData.description);
          this.onLanguageSelected();
          this.updateForm(this.catalogData);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating catalog data:', error);
          this.loading = false;
        },
      });
  }

  /**
   * Updates the catalog data.
   * After response is received, sets the catalog data to the response data, extracts the languages
   * from the descriptions, updates the form with the catalog data, and sets the loading flag to false.
   * If an error occurs, sets the loading flag to false and shows a snackbar with an error message.
   * */
  updateCatalogData() {
    this.loading = true;
    this.catalogService
      .updateCatalog(this.cleanFormData(this.catalogForm, 'update'))
      .subscribe({
        next: (data) => {
          this.catalogData = data;
          this.languages = this.extractLanguages(this.catalogData.description);
          this.onLanguageSelected();
          this.updateForm(this.catalogData);
          this.loading = false;
          this.snackBarService.openSnackBar(
            'Catalog data successfully updated',
            'OK',
            'center',
            'bottom',
            'snackbar-success'
          );
        },
        error: (error) => {
          console.error('Error updating catalog data:', error);
          this.loading = false;
        },
      });
  }

  /**
   * Creates empty catalog data object assigns it to the catalogData property,
   * sets the editMode to true, and sets the newCatalog flag to true.
   * */
  onAdd(): void {
    const emptyCatalog: Catalog = {
      '@id': '',
      keyword: [],
      theme: [],
      conformsTo: '',
      creator: '',
      description: [],
      identifier: '',
      title: '',
      distribution: [],
      hasPolicy: [],
      dataset: [],
      service: [],
      participantId: '',
    };

    this.catalogData = emptyCatalog;
    this.updateForm(this.catalogData);
    this.editMode = true;
    this.newCatalog = true;
  }

  /**
   * Deletes the catalog.
   * Prompts the dialog with confirmation, and if it is confirmed, it deletes the selected catalog.
   * @param catalog The catalog to delete.
   * */
  onDelete(catalog: Catalog) {
    const dialogData = {
      title: 'Confirm deletion of catalog',
      message:
        'Are you sure you want to delete catalog with id: ' +
        catalog['@id'] +
        '? This operation cannot be undone.',
    };
    this.dialog
      .open(ConfirmationDialogComponent, { data: dialogData })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.loading = true;
          this.catalogService.deleteCatalog(catalog['@id']!).subscribe({
            next: () => {
              this.catalogData = undefined;
              this.newCatalog = false;
              this.loading = false;
            },
            error: (error) => {
              console.error('Error deleting catalog:', error);
              this.loading = false;
            },
          });
        }
      });
  }

  /**
   * Toggles the edit mode.
   * If the edit mode is enabled, it saves the catalog data if it is a new catalog, or updates the catalog data if it is an existing catalog.
   * If the edit mode is disabled, it sets the original catalog data to the current catalog data.
   * */
  toggleEditMode() {
    if (this.editMode) {
      if (this.newCatalog) {
        this.saveCatalogData();
        this.newCatalog = false;
      } else {
        this.updateCatalogData();
      }
    } else {
      this.originalCatalogData = this.catalogData;
    }
    this.editMode = !this.editMode;
  }

  /**
   * Cancels the edit mode.
   * Sets the catalog data to the original catalog data and sets the edit mode to false.
   * */
  cancelEdit() {
    this.catalogData = this.originalCatalogData;
    this.updateForm(this.catalogData);
    this.editMode = false;
  }

  /**
   * Returns the description form controls.
   * @returns The description form controls.
   * */
  get descriptionControls() {
    return (this.catalogForm.get('description') as FormArray).controls;
  }

  /**
   * Returns the keyword form controls.
   * @returns The keyword form controls.
   * */
  get keywordControls() {
    return (this.catalogForm.get('keyword') as FormArray).controls;
  }

  /**
   * Returns the theme form controls.
   * @returns The theme form controls.
   * */
  get themeControls() {
    return (this.catalogForm.get('theme') as FormArray).controls;
  }

  /**
   * Adds a description form group to the description form array.
   * */
  addDescription() {
    const control = this.fb.group({
      language: ['', [Validators.required, Validators.pattern('[a-zA-Z]*')]],
      value: ['', Validators.required],
    });
    (this.catalogForm.get('description') as FormArray).push(control);
  }

  /**
   * Removes a description form group from the description form array.
   * @param index The index of the description form group to remove.
   * */
  removeDescription(index: number) {
    (this.catalogForm.get('description') as FormArray).removeAt(index);
  }

  /**
   * Adds a keyword form control to the keyword form array.
   * */
  addKeyword() {
    const control = this.fb.control('', Validators.required);
    (this.catalogForm.get('keyword') as FormArray).push(control);
  }

  /**
   * Removes a keyword form control from the keyword form array.
   * @param index The index of the keyword form control to remove.
   * */
  removeKeyword(index: number) {
    (this.catalogForm.get('keyword') as FormArray).removeAt(index);
  }

  /**
   * Adds a theme form control to the theme form array.
   * */
  addTheme() {
    const control = this.fb.control('', Validators.required);
    (this.catalogForm.get('theme') as FormArray).push(control);
  }

  /**
   * Removes a theme form control from the theme form array.
   * @param index The index of the theme form control to remove.
   * */
  removeTheme(index: number) {
    (this.catalogForm.get('theme') as FormArray).removeAt(index);
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

  private hasItems(collection: unknown[] | undefined | null): boolean {
    return Array.isArray(collection) && collection.length > 0;
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

  /**
   * Handles the file selected event.
   * @param event The event.
   * */
  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const selectedFile = inputElement.files?.[0];

    if (selectedFile) {
      this.uploadCatalogFile(selectedFile);
    }
  }

  /**
   * Downloads the catalog data as a JSON file.
   * @param catalogId The catalog id.
   * */
  onDownload(catalogId: string): void {
    const dataStr = JSON.stringify(this.catalogData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const fileName = `${this.catalogData!.title}.json`;
    saveAs(blob, fileName);
  }

  /**
   * Uploads the catalog JSON file to server.
   * @param file The file to upload.
   * */
  uploadCatalogFile(file: File): void {
    this.catalogService.uploadCatalogFile(file).subscribe(
      (response) => {
        console.log('File uploaded successfully');
      },
      (error) => {
        console.error('File upload failed:', error);
      }
    );
  }

  /**
   * Navigates to the service details page.
   * @param service The service.
   * */
  navigateToServiceDetails(service: DataService): void {
    this.router.navigate(['/catalog-management/service-management/details'], {
      state: { service: service },
    });
  }

  /**
   * Navigates to the dataset details page.
   * @param dataset The dataset.
   * */
  navigateToDatasetDetails(dataset: Dataset): void {
    this.router.navigate(['/catalog-management/dataset-management/details'], {
      state: { dataset: dataset },
    });
  }

  /**
   * Navigates to the distribution details page.
   * @param distribution The distribution.
   * */
  navigateToDistributionDetails(distribution: Distribution): void {
    this.router.navigate(
      ['/catalog-management/distribution-management/details'],
      {
        state: { distribution: distribution },
      }
    );
  }

  /**
   * Helper function to initialize the form.
   */
  initForm(): void {
    this.catalogForm = this.fb.group({
      '@id': [''],
      type: [null],
      title: [null, Validators.required],
      identifier: [null],
      description: this.fb.array([], Validators.required),
      keyword: this.fb.array([], Validators.required),
      theme: this.fb.array([]),
      creator: [null, Validators.required],
      conformsTo: [null],
      participantId: ['', Validators.required],
      createdBy: [null],
      lastModifiedBy: [null],
      version: [null],
      issued: [null],
      modified: [null],
      distribution: this.fb.array([]),
      hasPolicy: this.fb.array([]),
      dataset: this.fb.array([]),
      service: this.fb.array([]),
    });
  }

  /**
   * Helper function to update the form with the catalog data.
   * @param catalogData The catalog data to update the form with.
   */
  updateForm(catalogData: Catalog | undefined): void {
    if (catalogData) {
      this.catalogForm.patchValue({
        '@id': catalogData['@id'],
        type: catalogData.type,
        title: catalogData.title,
        identifier: catalogData.identifier,
        creator: catalogData.creator,
        conformsTo: catalogData.conformsTo,
        participantId: catalogData.participantId,
        createdBy: catalogData.createdBy,
        lastModifiedBy: catalogData.lastModifiedBy,
        version: catalogData.version,
        issued: catalogData.issued,
        modified: catalogData.modified,
      });

      this.setFormArray('description', catalogData.description);
      this.setFormArray('keyword', catalogData.keyword);
      this.setFormArray('theme', catalogData.theme);
      this.setFormArray('distribution', catalogData.distribution);
      this.setFormArray('hasPolicy', catalogData.hasPolicy);
      this.setFormArray('dataset', catalogData.dataset);
      this.setFormArray('service', catalogData.service);

      this.editState.init(this.catalogForm);
    }
  }

  /**
   * Helper function to set the form array.
   * @param formArrayName The name of the form array.
   * @param values The values to set.
   */
  setFormArray(formArrayName: string, values: any[]): void {
    const formArray = this.catalogForm.get(formArrayName) as FormArray;
    formArray.clear();
    if (values) {
      values.forEach((value) => {
        if (formArrayName === 'description') {
          formArray.push(
            this.fb.group({
              language: [
                value.language,
                [Validators.required, Validators.pattern('[a-zA-Z]*')],
              ],
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
  cleanFormData(formGroup: FormGroup, operation: 'create' | 'update'): any {
    const cleanedData = { ...formGroup.value };

    if (operation === 'create') {
    delete cleanedData['@id'];
    }
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

  // Old-value helpers removed; use EditStateService + oldValue pipe
}
