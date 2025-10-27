import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
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
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
import { Subscription } from 'rxjs';
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
import { EditStateService } from '../../../shared/edit-state.service';
import { ModifiedFieldDirective } from '../../../shared/modified-field.directive';
import { OldValuePipe } from '../../../shared/old-value.pipe';
import { UnsavedChangesComponent } from '../../../shared/unsaved-changes/unsaved-changes.component';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { Distribution } from './../../../models/distribution';
import { ArtifactDialogComponent } from './artifact-dialog/artifact-dialog.component';

@Component({
  selector: 'app-dataset-details',
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
    MatDatepickerModule,
    MatNativeDateModule,
    ModifiedFieldDirective,
    OldValuePipe,
    UnsavedChangesComponent,
  ],
  templateUrl: './dataset-details.component.html',
  styleUrls: ['./dataset-details.component.css'],
})
export class DatasetDetailsComponent implements OnDestroy {
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
  private constraintTypes: Record<string, string> = {};
  private timeValues: Record<string, string> = {};

  // Change tracking
  hasChanges = false;
  private originalFormValue: any | undefined;
  private valueChangesSubscription?: Subscription;
  private initializingForm = false;

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private location: Location,
    private datasetService: DatasetService,
    private fb: FormBuilder,
    private snackBarService: SnackbarService,
    private distributionService: DistributionService,
    private artifactService: ArtifactService,
    public editState: EditStateService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.dataset = navigation.extras.state['dataset'];
      this.datasetArtifact = this.dataset.artifact;

      if (navigation.extras.state['editMode']) {
        this.editMode = navigation.extras.state['editMode'];
        this.directEdit = navigation.extras.state['editMode'];
        this.originalDataset = { ...this.dataset };
        this.datasetArtifact = this.originalDataset.artifact;
        if (this.dataset['@id'] != undefined) {
          this.updateArtifact = true;
        }
      }
      this.languages = this.extractLanguages(this.dataset.description);
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

  ngOnDestroy(): void {
    this.valueChangesSubscription?.unsubscribe();
    this.editState.destroy();
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
    if (this.editMode) {
      if (this.directEdit) {
        if (this.dataset['@id'] != undefined) {
          // Validate artifact requirement
          if (!this.selectedFile && !this.updateArtifact) {
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
          // Validate artifact requirement for new dataset
          if (
            !this.selectedFile &&
            (!this.datasetArtifact ||
              this.datasetArtifact.artifactType !== 'EXTERNAL')
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
          this.saveDatasetData();
        }
      } else {
        this.updateArtifact = true;

        // Validate artifact requirement for update
        if (!this.selectedFile && !this.updateArtifact) {
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
    this.loading = true;
    const cleanedData = this.cleanFormData(this.datasetForm);

    if (this.selectedFile) {
      // Use file artifact
      this.datasetService
        .createDataset(cleanedData, this.selectedFile)
        .subscribe({
          next: (data) => {
            console.log('Dataset saved successfully');
            this.dataset = data;
            this.datasetArtifact = data.artifact;
            this.languages = this.extractLanguages(this.dataset.description);
            this.onLanguageSelected();
            this.updateForm(this.dataset);
            this.loading = false;
          },
          error: (error) => {
            console.error('Saving dataset failed:', error);
            this.loading = false;
          },
        });
    } else if (
      this.datasetArtifact &&
      this.datasetArtifact.artifactType === 'EXTERNAL'
    ) {
      // Use external artifact
      this.datasetService
        .createDataset(
          cleanedData,
          undefined,
          this.datasetArtifact.value,
          this.datasetArtifact.authorization
        )
        .subscribe({
          next: (data) => {
            console.log('Dataset saved successfully');
            this.dataset = data;
            this.datasetArtifact = data.artifact;
            this.languages = this.extractLanguages(this.dataset.description);
            this.onLanguageSelected();
            this.updateForm(this.dataset);
            this.loading = false;
          },
          error: (error) => {
            console.error('Saving dataset failed:', error);
            this.loading = false;
          },
        });
    } else {
      // No artifact - show error
      this.snackBarService.openSnackBar(
        'Dataset file is required',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
      this.loading = false;
    }
  }

  /**
   * Updates the dataset data.
   * After response is received, sets the dataset data to the response data, extracts the languages
   * from the descriptions, updates the form with the dataset data, and sets the loading flag to false.
   * If an error occurs, sets the loading flag to false and shows a snackbar with an error message.
   * */
  updateDatasetData() {
    this.loading = true;
    const cleanedData = this.cleanFormData(this.datasetForm);
    if (this.selectedFile) {
      // Update with new file
      this.datasetService
        .updateDataset(this.dataset['@id']!, cleanedData, this.selectedFile)
        .subscribe({
          next: (data) => {
            console.log('Dataset updated successfully');
            this.dataset = data;
            this.datasetArtifact = data.artifact;
            this.languages = this.extractLanguages(this.dataset.description);
            this.onLanguageSelected();
            this.updateForm(this.dataset);
            this.loading = false;
          },
          error: (error) => {
            console.error('Error updating dataset:', error);
            this.loading = false;
          },
        });
    } else if (
      this.datasetArtifact &&
      this.datasetArtifact.artifactType === 'EXTERNAL'
    ) {
      // Update with new external artifact
      this.datasetService
        .updateDataset(
          this.dataset['@id']!,
          cleanedData,
          undefined,
          this.datasetArtifact.value, // Using filename for URL
          this.datasetArtifact.authorization
        )
        .subscribe({
          next: (data) => {
            console.log('Dataset updated successfully');
            this.dataset = data;
            this.datasetArtifact = data.artifact;
            this.languages = this.extractLanguages(this.dataset.description);
            this.onLanguageSelected();
            this.updateForm(this.dataset);
            this.loading = false;
          },
          error: (error) => {
            console.error('Error updating dataset:', error);
            this.loading = false;
          },
        });
    } else if (this.updateArtifact) {
      // Keep existing artifact, just update dataset data
      this.datasetService
        .updateDataset(this.dataset['@id']!, cleanedData)
        .subscribe({
          next: (data) => {
            console.log('Dataset updated successfully');
            this.dataset = data;
            this.datasetArtifact = data.artifact;
            this.languages = this.extractLanguages(this.dataset.description);
            this.onLanguageSelected();
            this.updateForm(this.dataset);
            this.loading = false;
          },
          error: (error) => {
            console.error('Error updating dataset:', error);
            this.loading = false;
          },
        });
    } else {
      // No artifact - show error
      this.snackBarService.openSnackBar(
        'Dataset file is required',
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
      this.loading = false;
    }
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
      language: ['', [Validators.required, Validators.pattern('[a-zA-Z]*')]],
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
      title: ['', Validators.required],
      identifier: [null],
      value: [null],
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
   * Helper function to update the form with the dataset data.
   * @param dataset The dataset data to update the form with.
   */
  updateForm(dataset: Dataset): void {
    if (dataset) {
      this.initializingForm = true;
      this.datasetForm.patchValue({
        '@id': dataset['@id'],
        title: dataset.title,
        identifier: dataset.identifier,
        // value: dataset.value,
        creator: dataset.creator,
        conformsTo: dataset.conformsTo,
        createdBy: dataset.createdBy,
        lastModifiedBy: dataset.lastModifiedBy,
        version: dataset.version,
        issued: dataset.issued,
        modified: dataset.modified,
      });
      this.datasetForm
        .get('distribution')
        ?.setValue(
          dataset.distribution.map((distribution) =>
            this.allDistributions.find(
              (ds) => ds['@id'] === distribution['@id']
            )
          ) || []
        );
      if (
        dataset.description.length === 0 &&
        dataset.keyword.length === 0 &&
        dataset.theme.length === 0 &&
        dataset.hasPolicy.length === 0
      ) {
        this.addDescription();
        this.addKeyword();
        this.addTheme();
        this.addPolicy();
      } else {
        this.setFormArray('description', dataset.description);
        this.setFormArray('keyword', dataset.keyword);
        this.setFormArray('theme', dataset.theme);
        this.setFormArray('hasPolicy', dataset.hasPolicy);
      }

      // Initialize constraint types for existing data
      this.initializeConstraintTypes();

      this.storeOriginalFormValue();
      this.setupFormChangeTracking();
      this.initializingForm = false;
      this.evaluateChanges();
      this.editState.init(this.datasetForm);
    }
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
              language: [
                value.language,
                [Validators.required, Validators.pattern('[a-zA-Z]*')],
              ],
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
   * @param formArray The form array to set.
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
   * Helper function to clean and prepare the form data before sending it to the server.
   * Removes unnecessary fields, formats dates, and handles empty values.
   * @param formGroup The form group to clean.
   * @returns The cleaned and prepared form data.
   * */
  cleanFormData(formGroup: FormGroup): any {
    const cleanedData = { ...formGroup.value };

    // Remove metadata fields that shouldn't be sent
    delete cleanedData['@id'];
    delete cleanedData.createdBy;
    delete cleanedData.lastModifiedBy;
    delete cleanedData.version;
    delete cleanedData.issued;
    delete cleanedData.modified;

    // Clean empty fields and arrays
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

    if (cleanedData.hasPolicy) {
      cleanedData.hasPolicy.forEach((policy: any) => {
        if (policy.permission) {
          policy.permission.forEach((permission: any) => {
            if (permission.constraint) {
              permission.constraint.forEach((constraint: any) => {
                switch (constraint.leftOperand) {
                  case 'DATE_TIME':
                    if (constraint.rightOperand instanceof Date) {
                      constraint.rightOperand = this.formatDateWithTimezone(
                        constraint.rightOperand
                      );
                    }
                    break;
                  case 'COUNT':
                    if (typeof constraint.rightOperand === 'string') {
                      constraint.rightOperand = Number(constraint.rightOperand);
                    }
                    break;
                  case 'PURPOSE':
                  case 'SPATIAL':
                    if (
                      constraint.rightOperand !== null &&
                      constraint.rightOperand !== undefined &&
                      typeof constraint.rightOperand !== 'string'
                    ) {
                      constraint.rightOperand = String(constraint.rightOperand);
                    }
                    break;
                }
              });
            }
          });
        }
      });
    }

    return cleanedData;
  }

  /**
   * Formats a date object to ISO 8601 format with timezone information.
   * @param date The date object to format.
   * @returns A string in the format "YYYY-MM-DDThh:mm:ss+TZ:00".
   */
  private formatDateWithTimezone(date: Date): string {
    // Get timezone offset in hours and minutes
    const tzOffset = -date.getTimezoneOffset();
    const tzHours = Math.floor(Math.abs(tzOffset) / 60);
    const tzMinutes = Math.abs(tzOffset) % 60;

    // Format the timezone string (+/-HH:MM)
    const tzSign = tzOffset >= 0 ? '+' : '-';
    const tzString = `${tzSign}${tzHours
      .toString()
      .padStart(2, '0')}:${tzMinutes.toString().padStart(2, '0')}`;

    // Format the date in the desired format with seconds set to 01
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}T${date
      .getHours()
      .toString()
      .padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}:01${tzString}`;

    return formattedDate;
  }

  // ===== Change tracking helpers =====
  private setupFormChangeTracking(): void {
    this.valueChangesSubscription?.unsubscribe();
    this.valueChangesSubscription = this.datasetForm.valueChanges.subscribe(
      () => {
        if (this.initializingForm) {
          return;
        }
        this.evaluateChanges();
      }
    );
  }

  private storeOriginalFormValue(): void {
    this.originalFormValue = this.deepClone(this.datasetForm.getRawValue());
  }

  private evaluateChanges(): void {
    const current = this.datasetForm.getRawValue();
    this.hasChanges = !this.deepEqual(this.originalFormValue, current);
  }

  private deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  private deepEqual(a: any, b: any): boolean {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  }

  private valuesEqual(a: any, b: any): boolean {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  }

  /**
   * Initialize constraint types map for existing data after form is loaded.
   * This ensures the correct input fields are shown for all constraint types when editing existing constraints.
   */
  initializeConstraintTypes(): void {
    const policiesFormArray = this.datasetForm.get('hasPolicy') as FormArray;

    if (policiesFormArray) {
      for (let i = 0; i < policiesFormArray.length; i++) {
        const policy = policiesFormArray.at(i);
        const permissionsFormArray = policy.get('permission') as FormArray;

        if (permissionsFormArray) {
          for (let j = 0; j < permissionsFormArray.length; j++) {
            const permission = permissionsFormArray.at(j);
            const constraintsFormArray = permission.get(
              'constraint'
            ) as FormArray;

            if (constraintsFormArray) {
              for (let k = 0; k < constraintsFormArray.length; k++) {
                const constraint = constraintsFormArray.at(k);
                const leftOperand = constraint.get('leftOperand')?.value;

                if (leftOperand) {
                  const key = this.getConstraintKey(i, j, k);
                  this.constraintTypes[key] = leftOperand;

                  // For DATE_TIME constraints, also initialize the time value
                  if (leftOperand === 'DATE_TIME') {
                    this.initializeTimeValue(i, j, k);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Initializes the time value for a DATE_TIME constraint from an existing date value.
   * @param policyIndex The index of the policy.
   * @param permissionIndex The index of the permission.
   * @param constraintIndex The index of the constraint.
   */
  private initializeTimeValue(
    policyIndex: number,
    permissionIndex: number,
    constraintIndex: number
  ): void {
    const control = this.getConstraintControl(
      policyIndex,
      permissionIndex,
      constraintIndex
    );
    const dateValue = control.get('rightOperand')?.value;

    if (dateValue) {
      let date: Date;

      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        // Try to parse the ISO string
        try {
          date = new Date(dateValue);
        } catch (e) {
          console.error('Error parsing date string:', e);
          return;
        }
      } else {
        return;
      }

      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const key = this.getConstraintKey(
        policyIndex,
        permissionIndex,
        constraintIndex
      );
      this.timeValues[key] = `${hours}:${minutes}`;
    }
  }

  /**
   * Gets the time value for a constraint in the format HH:MM
   * @param policyIndex The index of the policy.
   * @param permissionIndex The index of the permission.
   * @param constraintIndex The index of the constraint.
   * @returns The time value in HH:MM format, or an empty string if not available.
   */
  getTimeValue(
    policyIndex: number,
    permissionIndex: number,
    constraintIndex: number
  ): string {
    const key = this.getConstraintKey(
      policyIndex,
      permissionIndex,
      constraintIndex
    );

    // Check if we have a stored time value first
    if (this.timeValues[key]) {
      return this.timeValues[key];
    }

    // If no stored time value, try to get it from the date in the form control
    const control = this.getConstraintControl(
      policyIndex,
      permissionIndex,
      constraintIndex
    );
    const dateValue = control.get('rightOperand')?.value;

    if (dateValue instanceof Date) {
      const hours = dateValue.getHours().toString().padStart(2, '0');
      const minutes = dateValue.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // For string date values (e.g., ISO strings)
    if (typeof dateValue === 'string' && dateValue) {
      try {
        const date = new Date(dateValue);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        // Store the time value so we don't have to parse it again
        this.timeValues[key] = `${hours}:${minutes}`;
        return this.timeValues[key];
      } catch (e) {
        console.error('Error parsing date string:', e);
      }
    }

    return '';
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
    const policyIndex =
      (this.datasetForm.get('hasPolicy') as FormArray).length - 1;
    this.addPermission(policyIndex);

    // Add constraint to the permission
    const permissionIndex = 0;
    this.addConstraint(policyIndex, permissionIndex);
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

  // ===== Modified helpers for policies and distribution =====
  isPolicyFieldModified(
    policyIndex: number,
    field: 'assigner' | 'assignee'
  ): boolean {
    if (!this.originalFormValue) return false;
    const policies: any[] = (this.originalFormValue['hasPolicy'] ||
      []) as any[];
    const original = policies[policyIndex]?.[field];
    const group = (this.datasetForm.get('hasPolicy') as FormArray).at(
      policyIndex
    ) as FormGroup;
    return !this.valuesEqual(group.get(field)?.value, original);
  }

  isPermissionFieldModified(
    policyIndex: number,
    permissionIndex: number,
    field: 'action'
  ): boolean {
    if (!this.originalFormValue) return false;
    const original = (this.originalFormValue['hasPolicy']?.[policyIndex]
      ?.permission || [])[permissionIndex]?.[field];
    const perm = (
      (this.datasetForm.get('hasPolicy') as FormArray)
        .at(policyIndex)
        .get('permission') as FormArray
    ).at(permissionIndex) as FormGroup;
    return !this.valuesEqual(perm.get(field)?.value, original);
  }

  isConstraintFieldModified(
    policyIndex: number,
    permissionIndex: number,
    constraintIndex: number,
    field: 'leftOperand' | 'operator' | 'rightOperand'
  ): boolean {
    if (!this.originalFormValue) return false;
    const original = (this.originalFormValue['hasPolicy']?.[policyIndex]
      ?.permission?.[permissionIndex]?.constraint || [])[constraintIndex]?.[
      field
    ];
    const cons = (
      this.getConstraintsControls(policyIndex, permissionIndex).at(
        constraintIndex
      ) as FormGroup
    ).get(field)?.value;
    return !this.valuesEqual(cons, original);
  }

  isDistributionItemModified(distribution: Distribution): boolean {
    if (!this.originalFormValue) return false;
    const current: Distribution[] =
      this.datasetForm.get('distribution')?.value || [];
    const original: Distribution[] =
      this.originalFormValue['distribution'] || [];
    const wasSelected = original.some((d) => d['@id'] === distribution['@id']);
    const isSelected = current.some((d) => d['@id'] === distribution['@id']);
    return wasSelected !== isSelected;
  }

  // ===== Old value helpers for tooltips =====

  public getOldValueForPolicyField(
    policyIndex: number,
    field: 'assigner' | 'assignee'
  ): string {
    if (!this.originalFormValue) return 'N/A';
    const policies: any[] = (this.originalFormValue['hasPolicy'] ||
      []) as any[];
    const value = policies[policyIndex]?.[field];
    return this.editState.oldValue('dummy') && value !== undefined
      ? String(value)
      : value === null || value === undefined || value === ''
      ? 'N/A'
      : Array.isArray(value)
      ? value.join(', ')
      : String(value);
  }

  public getOldValueForPermissionField(
    policyIndex: number,
    permissionIndex: number,
    field: 'action'
  ): string {
    if (!this.originalFormValue) return 'N/A';
    const original = (this.originalFormValue['hasPolicy']?.[policyIndex]
      ?.permission || [])[permissionIndex]?.[field];
    return original === null || original === undefined || original === ''
      ? 'N/A'
      : Array.isArray(original)
      ? original.join(', ')
      : String(original);
  }

  public getOldValueForConstraintField(
    policyIndex: number,
    permissionIndex: number,
    constraintIndex: number,
    field: 'leftOperand' | 'operator' | 'rightOperand'
  ): string {
    if (!this.originalFormValue) return 'N/A';
    const original = (this.originalFormValue['hasPolicy']?.[policyIndex]
      ?.permission?.[permissionIndex]?.constraint || [])[constraintIndex]?.[
      field
    ];
    return original === null || original === undefined || original === ''
      ? 'N/A'
      : Array.isArray(original)
      ? original.join(', ')
      : String(original);
  }

  // Old-value helpers removed; use EditStateService + oldValue pipe

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
    this.evaluateChanges();
  }

  /**
   * Opens the artifact dialog
   */
  openArtifactDialog(): void {
    const dialogRef = this.dialog.open(ArtifactDialogComponent, {
      width: '600px',
      data: {
        artifact: this.updateArtifact ? this.datasetArtifact : undefined,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed', result);
      if (result) {
        if (result.artifactType === 'FILE') {
          this.selectedFile = result.file;
          this.updateArtifact = true;
        } else if (result.artifactType === 'EXTERNAL') {
          // For external artifacts
          this.updateArtifact = true;
          this.selectedFile = undefined;
          if (result.authorization !== undefined) {
            this.datasetArtifact = {
              artifactType: 'EXTERNAL',
              value: result.filename,
              authorization: result.authorization,
            };
          } else {
            console.log('No authorization');
            this.datasetArtifact = {
              artifactType: 'EXTERNAL',
              value: result.filename,
            };
          }
        }
        this.evaluateChanges();
      }
    });
  }

  // Handle left operand selection change
  onLeftOperandChange(
    policyIndex: number,
    permissionIndex: number,
    constraintIndex: number
  ): void {
    const leftOperand = this.getConstraintControl(
      policyIndex,
      permissionIndex,
      constraintIndex
    ).get('leftOperand')?.value;
    const key = this.getConstraintKey(
      policyIndex,
      permissionIndex,
      constraintIndex
    );

    this.constraintTypes[key] = leftOperand;

    // Reset the right operand value when changing types
    this.getConstraintControl(policyIndex, permissionIndex, constraintIndex)
      .get('rightOperand')
      ?.setValue('');

    this.evaluateChanges();
  }

  // Get the left operand type for a specific constraint
  getLeftOperandType(
    policyIndex: number,
    permissionIndex: number,
    constraintIndex: number
  ): string {
    const key = this.getConstraintKey(
      policyIndex,
      permissionIndex,
      constraintIndex
    );

    // First check if we have a cached value
    if (this.constraintTypes[key]) {
      return this.constraintTypes[key];
    }

    // If not in cache, try to get it directly from the form control
    const control = this.getConstraintControl(
      policyIndex,
      permissionIndex,
      constraintIndex
    );
    const leftOperandValue = control.get('leftOperand')?.value;

    // If we found a value directly from the control, cache it for future use
    if (leftOperandValue) {
      this.constraintTypes[key] = leftOperandValue;
    }

    return leftOperandValue || '';
  }

  // Helper method to get a unique key for each constraint
  private getConstraintKey(
    policyIndex: number,
    permissionIndex: number,
    constraintIndex: number
  ): string {
    return `p${policyIndex}_pm${permissionIndex}_c${constraintIndex}`;
  }

  // Helper method to get a constraint control
  private getConstraintControl(
    policyIndex: number,
    permissionIndex: number,
    constraintIndex: number
  ): FormGroup {
    return (
      (
        (this.datasetForm.get('hasPolicy') as FormArray)
          .at(policyIndex)
          .get('permission') as FormArray
      )
        .at(permissionIndex)
        .get('constraint') as FormArray
    ).at(constraintIndex) as FormGroup;
  }

  /**
   * Handles time input changes and updates the date value in the form control.
   * @param event The input event.
   * @param policyIndex The index of the policy.
   * @param permissionIndex The index of the permission.
   * @param constraintIndex The index of the constraint.
   */
  onTimeChange(
    event: Event,
    policyIndex: number,
    permissionIndex: number,
    constraintIndex: number
  ): void {
    const time = (event.target as HTMLInputElement).value;
    const key = this.getConstraintKey(
      policyIndex,
      permissionIndex,
      constraintIndex
    );
    this.timeValues[key] = time;

    // Get the current date value
    const control = this.getConstraintControl(
      policyIndex,
      permissionIndex,
      constraintIndex
    );
    const dateValue = control.get('rightOperand')?.value;

    if (dateValue && time) {
      // Create a new date with both date and time
      const dateTime = new Date(dateValue);
      const [hours, minutes] = time.split(':').map(Number);

      // Set hours and minutes, and ensure seconds are set to 1 as per the required format
      dateTime.setHours(hours, minutes, 1);

      // Update the form control with the new date
      control.get('rightOperand')?.setValue(dateTime);
    }
    this.evaluateChanges();
  }
}
