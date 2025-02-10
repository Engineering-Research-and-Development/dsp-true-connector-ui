import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
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
import { catchError, map, Observable, of } from 'rxjs';
import { Artifact } from '../../../models/artifact';
import { Dataset } from '../../../models/dataset';
import { Action } from '../../../models/enums/action.enum';
import { LeftOperand } from '../../../models/enums/left-operand.enum';
import { Operator } from '../../../models/enums/operators.enum';
import { Multilanguage } from '../../../models/multilanguage';
import { Offer } from '../../../models/offer';
import { ArtifactService } from '../../../services/artifact/artifact.service';
import { DatasetService } from '../../../services/dataset/dataset.service';
import { DistributionService } from '../../../services/distribution/distribution.service';
import { SnackbarService } from '../../../services/snackbar/snackbar.service';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { Distribution } from './../../../models/distribution';

@Component({
  selector: 'app-dataset-details',
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
  templateUrl: './dataset-details.component.html',
  styleUrls: ['./dataset-details.component.css'],
})
export class DatasetDetailsComponent {
  datasetForm!: FormGroup;
  dataset!: Dataset;
  originalDataset!: Dataset;
  languages: string[] = [];
  selectedLanguage: string = '';
  descriptionValue: string = '';
  editMode = false;
  directEdit = false;
  loading = false;
  allDistributions: Distribution[] = [];

  actionOptions = Object.values(Action);
  leftOperandOptions = Object.values(LeftOperand);
  operatorOptions = Object.values(Operator);

  selectedFile: File | undefined;
  datasetArtifact!: Artifact;
  updateArtifact: boolean = false;

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private location: Location,
    private datasetService: DatasetService,
    private fb: FormBuilder,
    private snackBarService: SnackbarService,
    private distributionService: DistributionService,
    private artifactService: ArtifactService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.dataset = navigation.extras.state['dataset'];
      if (navigation.extras.state['datasetArtifact']) {
        this.datasetArtifact = navigation.extras.state['datasetArtifact'];
      }
      console.log('Artifact:', this.datasetArtifact);
      if (navigation.extras.state['editMode']) {
        console.log('Edit mode:', navigation.extras.state['editMode']);
        this.editMode = navigation.extras.state['editMode'];
        this.directEdit = navigation.extras.state['editMode'];
        this.originalDataset = { ...this.dataset };
        this.datasetArtifact = navigation.extras.state['datasetArtifact'];
        console.log('Upadrte artifact:', this.updateArtifact);
        console.log('dataset:', this.dataset);
        if (this.dataset['@id'] != undefined) {
          this.updateArtifact = true;
        }
      }
      this.languages = this.extractLanguages(this.dataset.description);
      console.log('Languages:', this.languages);
    } else {
      this.goBack();
    }
  }

  /**
   * Initializes the component by fetching all distributions from the server and generating the form.
   */
  ngOnInit(): void {
    this.initForm();

    this.getAllDistributions();
  }

  /**
   * Fetches all distributions from the server and sets the loading flag to false when the distributions are fetched.
   * */
  getAllDistributions(): void {
    this.distributionService.getAllDistributions().subscribe({
      next: (data) => {
        this.allDistributions = data;
        if (this.dataset) {
          this.updateForm(this.dataset);
        }
        this.loading = false;
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
    const selectedDescription = this.dataset.description.find(
      (desc) => desc.language === this.selectedLanguage.toLowerCase()
    );
    this.descriptionValue = selectedDescription
      ? selectedDescription.value
      : '';
  }

  /**
   * Toggles the edit mode.
   * If the edit mode is enabled, it saves the dataset data if it is a new dataset, or updates the dataset data if it is an existing dataset.
   * If the edit mode is disabled, it sets the original dataset data to the current dataset data.
   * */
  toggleEditMode() {
    console.log('Toggling edit mode', this.editMode);
    if (this.editMode) {
      if (this.directEdit) {
        if (this.dataset['@id'] != undefined) {
          if (
            !this.selectedFile ||
            this.dataset.fileId === undefined ||
            this.dataset.fileId === null
          ) {
            this.snackBarService.openSnackBar(
              'Dataset file is required',
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );

            return;
          }
          this.updateDatasetData();
          this.directEdit = false;
        } else {
          if (!this.selectedFile) {
            this.snackBarService.openSnackBar(
              'Dataset file is required',
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );

            return;
          }
          this.saveDatasetData();
        }
      } else {
        this.updateArtifact = true;

        if (!this.selectedFile) {
          this.snackBarService.openSnackBar(
            'Dataset file is required',
            'OK',
            'center',
            'bottom',
            'snackbar-error'
          );

          return;
        }
        this.updateDatasetData();
      }
    } else {
      this.updateArtifact = true;
      this.originalDataset = this.dataset;
    }
    this.editMode = !this.editMode;
  }

  /**
   * Cancels the edit mode.
   * Sets the catalog data to the original catalog data and sets the edit mode to false.
   * */
  cancelEdit() {
    console.log('Cancelling edit');
    this.dataset = { ...this.originalDataset };
    this.updateForm(this.dataset);
    this.editMode = false;
    if (this.dataset.type === undefined || this.dataset.type === '') {
      this.goBack();
    }
  }

  /**
   * Saves the dataset data.
   * After response is received, sets the dataset data to the response data, extracts the languages
   * from the descriptions, updates the form with the dataset data, and sets the loading flag to false.
   */
  saveDatasetData() {
    console.log('Saving dataset data:', this.cleanFormData(this.datasetForm));
    this.loading = true;
    this.datasetService
      .createDataset(this.cleanFormData(this.datasetForm))
      .subscribe({
        next: (data) => {
          console.log('Dataset saved successfully:', data);
          this.uploadDatasetFile(data['@id']).subscribe({
            next: (uploadedFileId) => {
              console.log(
                'Dataset file uploaded successfully:',
                uploadedFileId
              );
              this.dataset = data;
              this.dataset.fileId = uploadedFileId;
              this.languages = this.extractLanguages(this.dataset.description);
              this.onLanguageSelected();
              this.updateForm(this.dataset);
              this.getArtifactById(uploadedFileId).subscribe({
                next: (artifact) => {
                  console.log('Artifact:', artifact);
                  this.datasetArtifact = artifact[0];

                  this.loading = false;
                },
                error: (error) => {
                  console.error('Error fetching artifact:', error);
                  this.loading = false;
                },
              });
            },
            error: (error) => {
              console.error('File upload subscription failed:', error);
              this.loading = false;
            },
          });
        },
        error: (error) => {
          console.error('Saving dataset failed:', error);
          this.loading = false;
        },
      });
  }

  /**
   * Updates the dataset data.
   * After response is received, sets the dataset data to the response data, extracts the languages
   * from the descriptions, updates the form with the dataset data, and sets the loading flag to false.
   * If an error occurs, sets the loading flag to false and shows a snackbar with an error message.
   * */
  updateDatasetData() {
    this.loading = true;
    console.log('Updating dataset data:', this.cleanFormData(this.datasetForm));
    this.datasetService
      .updateDataset(this.dataset['@id']!, this.cleanFormData(this.datasetForm))
      .subscribe({
        next: (data) => {
          this.uploadDatasetFile(data['@id']!).subscribe({
            next: (uploadedFileId) => {
              console.log(
                'Dataset file uploaded successfully:',
                uploadedFileId
              );
              this.dataset = data;
              this.dataset.fileId = uploadedFileId;
              this.languages = this.extractLanguages(this.dataset.description);
              this.onLanguageSelected();
              this.updateForm(this.dataset);
              this.getArtifactById(uploadedFileId).subscribe({
                next: (artifact) => {
                  console.log('Artifact:', artifact);
                  this.datasetArtifact = artifact[0];
                  this.loading = false;
                },
                error: (error) => {
                  console.error('Error fetching artifact:', error);
                  this.loading = false;
                },
              });
            },
            error: (error) => {
              console.error('File upload subscription failed:', error);
              this.loading = false;
            },
          });
        },
        error: (error) => {
          console.error('Error updating dataset:', error);
          this.loading = false;
        },
      });
  }

  /**
   * Deletes the dataset.
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
              this.loading = false;
              this.goBack();
            },
            error: (error) => {
              console.error('Error deleting dataset:', error);
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
    (this.datasetForm.get('description') as FormArray).push(control);
  }

  /**
   * Removes a description form group from the description form array.
   * @param index The index of the description form group to remove.
   * */
  removeDescription(index: number) {
    (this.datasetForm.get('description') as FormArray).removeAt(index);
  }

  /**
   * Adds a keyword form control to the keyword form array.
   * */
  addKeyword() {
    const control = this.fb.control('', Validators.required);
    (this.datasetForm.get('keyword') as FormArray).push(control);
  }

  /**
   * Removes a keyword form control from the keyword form array.
   * @param index The index of the keyword form control to remove.
   * */
  removeKeyword(index: number) {
    (this.datasetForm.get('keyword') as FormArray).removeAt(index);
  }

  /**
   * Adds a theme form control to the theme form array.
   * */
  addTheme() {
    const control = this.fb.control('', Validators.required);
    (this.datasetForm.get('theme') as FormArray).push(control);
  }

  /**
   * Removes a theme form control from the theme form array.
   * @param index The index of the theme form control to remove.
   * */
  removeTheme(index: number) {
    (this.datasetForm.get('theme') as FormArray).removeAt(index);
  }

  /**
   * Returns the description form controls.
   * @returns The description form controls.
   * */
  get descriptionControls() {
    return (this.datasetForm.get('description') as FormArray).controls;
  }

  /**
   * Returns the keyword form controls.
   * @returns The keyword form controls.
   * */
  get keywordControls() {
    return (this.datasetForm.get('keyword') as FormArray).controls;
  }

  /**
   * Returns the theme form controls.
   * @returns The theme form controls.
   * */
  get themeControls() {
    return (this.datasetForm.get('theme') as FormArray).controls;
  }

  /**
   * Helper function to initialize the form.
   */
  initForm(): void {
    this.datasetForm = this.fb.group({
      '@id': [''],
      title: ['', Validators.required],
      identifier: [null],
      // fileId: [null],
      description: this.fb.array([], Validators.required),
      keyword: this.fb.array([]),
      theme: this.fb.array([]),
      creator: [null],
      conformsTo: [null],
      createdBy: [null],
      lastModifiedBy: [null],
      version: [null],
      issued: [null],
      modified: [null],
      distribution: [[], Validators.required],
      hasPolicy: this.fb.array([], Validators.required),
    });
  }

  /**
   * Helper function to update the form with the catalog data.
   * @param catalogData The catalog data to update the form with.
   */
  updateForm(dataset: Dataset): void {
    if (dataset) {
      this.datasetForm.patchValue({
        '@id': dataset['@id'],
        title: dataset.title,
        identifier: dataset.identifier,
        fileId: dataset.fileId,
        creator: dataset.creator,
        conformsTo: dataset.conformsTo,
        createdBy: dataset.createdBy,
        lastModifiedBy: dataset.lastModifiedBy,
        version: dataset.version,
        issued: dataset.issued,
        modified: dataset.modified,
      });

      this.setFormArray('description', dataset.description || []);
      this.setFormArray('keyword', dataset.keyword || []);
      this.setFormArray('theme', dataset.theme || []);
      this.datasetForm
        .get('distribution')
        ?.setValue(
          dataset.distribution.map((distribution) =>
            this.allDistributions.find(
              (ds) => ds['@id'] === distribution['@id']
            )
          ) || []
        );
      this.setFormArray('hasPolicy', dataset.hasPolicy || []);
    }
  }

  /**
   * Fetches an artifact by id using the ArtifactService.
   * @param id The id of the artifact to fetch.
   * @returns Observable<Artifact>
   */
  getArtifactById(id: string): Observable<Artifact[]> {
    return this.artifactService.getArtifactById(id);
  }

  /**
   * Helper function to set the form array.
   * @param formArrayName The name of the form array.
   * @param values The values to set.
   */
  setFormArray(formArrayName: string, values: any[]): void {
    const formArray = this.datasetForm.get(formArrayName) as FormArray;
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
        } else if (formArrayName === 'hasPolicy') {
          const policyGroup = this.fb.group({
            assigner: [value.assigner],
            assignee: [value.assignee],
            permission: this.fb.array([]),
          });
          this.setNestedFormArray(
            policyGroup.get('permission') as FormArray,
            value.permission || []
          );
          formArray.push(policyGroup);
        } else {
          formArray.push(this.fb.control(value, Validators.required));
        }
      });
    }
  }

  /**
   * Helper function to set the nested form array.
   * @param formArray The form array to set.
   * @param values The values to set.
   * */
  setNestedFormArray(formArray: FormArray, values: any[]): void {
    formArray.clear();
    if (values) {
      values.forEach((value) => {
        const permissionGroup = this.fb.group({
          action: [value.action, Validators.required],
          constraint: this.fb.array([]),
        });
        this.setFormArrayForConstraints(
          permissionGroup.get('constraint') as FormArray,
          value.constraint || []
        );
        formArray.push(permissionGroup);
      });
    }
  }

  /**
   * Helper function to set the form array for constraints.
   *  @param formArray The form array to set.
   * @param values The values to set.
   * */
  setFormArrayForConstraints(formArray: FormArray, values: any[]): void {
    formArray.clear();
    if (values) {
      values.forEach((value) => {
        formArray.push(
          this.fb.group({
            leftOperand: [value.leftOperand, Validators.required],
            rightOperand: [value.rightOperand, Validators.required],
            operator: [value.operator, Validators.required],
          })
        );
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

  /**
   * Navigates to the distribution details page.
   * @param distribution The distribution.
   * */
  navigateToDistributionDetails(distribution: Distribution): void {
    console.log('Navigating to distribution details:', distribution);
    this.router.navigate(
      ['/catalog-management/distribution-management/details'],
      {
        state: { distribution: distribution },
      }
    );
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
   * Adds a policy form group to the hasPolicy form array.
   * */
  addPolicy() {
    const control = this.fb.group({
      assigner: [''],
      assignee: [''],
      permission: this.fb.array([]), // Initialize the permission array
    });
    (this.datasetForm.get('hasPolicy') as FormArray).push(control);
  }

  /**
   * Removes a policy form group from the hasPolicy form array.
   * @param index The index of the policy form group to remove.
   * */
  removePolicy(index: number) {
    (this.datasetForm.get('hasPolicy') as FormArray).removeAt(index);
  }

  /**
   * Adds a permission form group to the permission form array within a specific policy.
   * @param policyIndex The index of the policy to which the permission belongs.
   * */
  addPermission(policyIndex: number) {
    const control = this.fb.group({
      action: ['', Validators.required],
      constraint: this.fb.array([]), // Initialize the constraint array
    });
    (
      (this.datasetForm.get('hasPolicy') as FormArray)
        .at(policyIndex)
        .get('permission') as FormArray
    ).push(control);
  }

  /**
   * Removes a permission form group from the permission form array within a specific policy.
   * @param policyIndex The index of the policy to which the permission belongs.
   * @param permissionIndex The index of the permission form group to remove.
   * */
  removePermission(policyIndex: number, permissionIndex: number) {
    (
      (this.datasetForm.get('hasPolicy') as FormArray)
        .at(policyIndex)
        .get('permission') as FormArray
    ).removeAt(permissionIndex);
  }

  /**
   * Adds a constraint form group to the constraint form array within a specific permission.
   * @param policyIndex The index of the policy to which the permission belongs.
   * @param permissionIndex The index of the permission to which the constraint belongs.
   * */
  addConstraint(policyIndex: number, permissionIndex: number) {
    const control = this.fb.group({
      leftOperand: ['', Validators.required],
      rightOperand: ['', Validators.required],
      operator: ['', Validators.required],
    });
    (
      (
        (this.datasetForm.get('hasPolicy') as FormArray)
          .at(policyIndex)
          .get('permission') as FormArray
      )
        .at(permissionIndex)
        .get('constraint') as FormArray
    ).push(control);
  }

  /**
   * Removes a constraint form group from the constraint form array within a specific permission.
   * @param policyIndex The index of the policy to which the permission belongs.
   * @param permissionIndex The index of the permission to which the constraint belongs.
   * @param constraintIndex The index of the constraint form group to remove.
   * */
  removeConstraint(
    policyIndex: number,
    permissionIndex: number,
    constraintIndex: number
  ) {
    (
      (
        (this.datasetForm.get('hasPolicy') as FormArray)
          .at(policyIndex)
          .get('permission') as FormArray
      )
        .at(permissionIndex)
        .get('constraint') as FormArray
    ).removeAt(constraintIndex);
  }

  /**
   * Returns the policy form controls.
   * @returns The policy form controls.
   * */
  get policyControls() {
    return (this.datasetForm.get('hasPolicy') as FormArray).controls;
  }

  /**
   * Returns the permission form controls for a specific policy.
   * @param policyIndex The index of the policy.
   * @returns The permission form controls.
   * */

  getPermissionsControls(policyIndex: number) {
    return (
      (this.datasetForm.get('hasPolicy') as FormArray)
        .at(policyIndex)
        .get('permission') as FormArray
    ).controls;
  }

  /**
   * Returns the constraint form controls for a specific permission within a specific policy.
   * @param policyIndex The index of the policy.
   * @param permissionIndex The index of the permission.
   * @returns The constraint form controls.
   * */
  getConstraintsControls(policyIndex: number, permissionIndex: number) {
    return (
      (
        (this.datasetForm.get('hasPolicy') as FormArray)
          .at(policyIndex)
          .get('permission') as FormArray
      )
        .at(permissionIndex)
        .get('constraint') as FormArray
    ).controls;
  }

  /**
   * Handles the file selected event.
   * @param event The event.
   * */
  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.selectedFile = inputElement.files?.[0];

    if (this.selectedFile) {
      console.log('Selected file:', this.selectedFile);
      // this.uploadCatalogFile(selectedFile);
    }
  }

  /**
   * Removes the selected file.
   */
  removeFile(): void {
    this.selectedFile = undefined;
    this.updateArtifact = false;
  }

  /**
   * Uploads the file associated with dataset.
   * @param dataSetId The id of the dataset.
   * @returns Observable<string> - The ID extracted from the response.
   */
  uploadDatasetFile(dataSetId: string): Observable<string> {
    if (this.selectedFile) {
      console.log('Uploading file:', this.selectedFile);
      return this.artifactService
        .uploadDatasetFile(this.selectedFile, dataSetId)
        .pipe(
          map((response) => {
            console.log('File uploaded successfully:', response);
            const match = response.match(/File uploaded (.+)$/);
            if (match && match[1]) {
              return match[1];
            } else {
              throw new Error('Failed to extract ID from response');
            }
          }),
          catchError((error) => {
            console.error('File upload failed:', error);
            throw error;
          })
        );
    } else {
      return of('');
    }
  }
}
