import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Tenant } from '../../../models/tenant';
import { TenantCreateRequest } from '../../../models/tenant-create-request';
import { TenantUpdateRequest } from '../../../models/tenant-update-request';
import { TenantService } from '../../../services/tenant/tenant.service';
import { EditStateService } from '../../../shared/edit-state.service';
import { ModifiedFieldDirective } from '../../../shared/modified-field.directive';
import { OldValuePipe } from '../../../shared/old-value.pipe';
import { UnsavedChangesComponent } from '../../../shared/unsaved-changes/unsaved-changes.component';

@Component({
  selector: 'app-tenant-details',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatTooltipModule,
    MatDividerModule,
    ModifiedFieldDirective,
    OldValuePipe,
    UnsavedChangesComponent,
  ],
  templateUrl: './tenant-details.component.html',
  styleUrls: ['./tenant-details.component.css'],
})
export class TenantDetailsComponent implements OnInit, OnDestroy {
  tenant!: Tenant;
  tenantForm!: FormGroup;
  editMode = false;
  isCreate = false;
  loading = false;

  constructor(
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    private tenantService: TenantService,
    public editState: EditStateService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.tenant = navigation.extras.state['tenant'];
      this.editMode = !!navigation.extras.state['editMode'];
    } else {
      this.goBack();
      return;
    }

    this.isCreate = !this.tenant.id;
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.editState.destroy();
  }

  initForm(): void {
    this.editState.destroy();

    const idValidators = this.isCreate ? [Validators.required] : [];
    const participantIdValidators = this.isCreate ? [Validators.required] : [];

    this.tenantForm = this.fb.group({
      id: [
        { value: this.tenant.id || '', disabled: !this.isCreate },
        idValidators,
      ],
      name: [this.tenant.name || '', Validators.required],
      description: [this.tenant.description || ''],
      participantId: [
        { value: this.tenant.participantId || '', disabled: !this.isCreate },
        participantIdValidators,
      ],
      automaticNegotiation: [this.tenant.automaticNegotiation === true],
      automaticTransfer: [this.tenant.automaticTransfer === true],
      bucketName: [this.tenant.bucketName || ''],
      accessKey: [''],
      secretKey: [''],
      verifyConnection: [false],
      enabled: [this.tenant.enabled === true],
    });

    if (!this.isCreate) {
      this.tenantForm.removeControl('enabled');
    }

    this.editState.init(this.tenantForm);
  }

  toggleEditMode(): void {
    if (this.editMode) {
      this.saveTenant();
    } else {
      this.editMode = true;
      this.tenantForm.enable();
      this.tenantForm.get('id')?.disable();
      this.tenantForm.get('participantId')?.disable();
    }
  }

  saveTenant(): void {
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    if (this.isCreate) {
      const formValue = this.tenantForm.value;
      const request: TenantCreateRequest = {
        id: formValue.id,
        name: formValue.name,
        description: formValue.description || null,
        participantId: formValue.participantId,
        automaticNegotiation: formValue.automaticNegotiation,
        automaticTransfer: formValue.automaticTransfer,
        enabled: formValue.enabled,
        bucketName: formValue.bucketName || null,
        accessKey: formValue.accessKey || null,
        secretKey: formValue.secretKey || null,
        verifyConnection: formValue.verifyConnection,
      };

      this.tenantService.createTenant(request).subscribe({
        next: (createdTenant) => {
          this.tenant = createdTenant;
          this.isCreate = false;
          this.editMode = false;
          this.initForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating tenant:', error);
          this.loading = false;
        },
      });
    } else {
      const formValue = this.tenantForm.value;
      const request: TenantUpdateRequest = {
        name: formValue.name,
        description: formValue.description || null,
        automaticNegotiation: formValue.automaticNegotiation,
        automaticTransfer: formValue.automaticTransfer,
        bucketName: formValue.bucketName || null,
        accessKey: formValue.accessKey || null,
        secretKey: formValue.secretKey || null,
        verifyConnection: formValue.verifyConnection,
      };

      this.tenantService.updateTenant(this.tenant.id, request).subscribe({
        next: (updatedTenant) => {
          this.tenant = updatedTenant;
          this.editMode = false;
          this.initForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating tenant:', error);
          this.loading = false;
        },
      });
    }
  }

  cancelEdit(): void {
    if (this.isCreate) {
      this.goBack();
      return;
    }
    this.editMode = false;
    this.initForm();
  }

  enableTenant(): void {
    this.setEnabled(true);
  }

  disableTenant(): void {
    this.setEnabled(false);
  }

  private setEnabled(enabled: boolean): void {
    const operation = enabled
      ? this.tenantService.enableTenant(this.tenant.id)
      : this.tenantService.disableTenant(this.tenant.id);

    operation.subscribe({
      next: (updatedTenant) => {
        this.tenant = updatedTenant;
        this.initForm();
      },
      error: (error) => console.error('Error updating tenant status:', error),
    });
  }

  goBack(): void {
    this.location.back();
  }
}
