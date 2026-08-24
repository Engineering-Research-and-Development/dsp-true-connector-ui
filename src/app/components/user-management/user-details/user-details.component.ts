import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { Subscription } from 'rxjs';
import { Tenant } from '../../../models/tenant';
import { User } from '../../../models/user';
import { UserCreateRequest } from '../../../models/user-create-request';
import { UserUpdateRequest } from '../../../models/user-update-request';
import { UserRole } from '../../../models/enums/user-role.enum';
import { TenantService } from '../../../services/tenant/tenant.service';
import { UserService } from '../../../services/user/user.service';
import { EditStateService } from '../../../shared/edit-state.service';
import { ModifiedFieldDirective } from '../../../shared/modified-field.directive';
import { OldValuePipe } from '../../../shared/old-value.pipe';
import { UnsavedChangesComponent } from '../../../shared/unsaved-changes/unsaved-changes.component';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-user-details',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
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
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css'],
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  user!: User;
  userForm!: FormGroup;
  tenants: Tenant[] = [];
  editMode = false;
  isCreate = false;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;

  readonly userRole = UserRole;

  private valueChangesSubscription?: Subscription;

  constructor(
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private userService: UserService,
    private tenantService: TenantService,
    public editState: EditStateService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.user = navigation.extras.state['user'];
      this.editMode = !!navigation.extras.state['editMode'];
    } else {
      this.goBack();
      return;
    }

    this.isCreate = !this.user.id;
  }

  ngOnInit(): void {
    this.fetchTenants();
  }

  ngOnDestroy(): void {
    this.valueChangesSubscription?.unsubscribe();
    this.editState.destroy();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  passwordMatchValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    const confirmControl = control.get('confirmPassword');

    if (!confirmControl) {
      return null;
    }

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        confirmControl.setErrors({
          ...(confirmControl.errors || {}),
          passwordMismatch: true,
        });
        return { passwordMismatch: true };
      } else if (confirmControl.hasError('passwordMismatch')) {
        const errors = { ...confirmControl.errors };
        delete errors['passwordMismatch'];
        confirmControl.setErrors(
          Object.keys(errors).length ? errors : null
        );
      }
    } else if (confirmControl.hasError('passwordMismatch')) {
      const errors = { ...confirmControl.errors };
      delete errors['passwordMismatch'];
      confirmControl.setErrors(
        Object.keys(errors).length ? errors : null
      );
    }

    return null;
  };

  fetchTenants(): void {
    this.tenantService.getAllTenantsList().subscribe({
      next: (tenants) => {
        this.tenants = tenants.filter((t) => t.enabled);
        this.initForm();
      },
      error: (error) => {
        console.error('Error fetching tenants:', error);
        this.initForm();
      },
    });
  }

  initForm(): void {
    this.editState.destroy();

    const passwordValidators = this.isCreate ? [Validators.required] : [];
    // Disable tenant if editing an existing user OR if user is a Super Admin
    const isTenantDisabled = !this.isCreate || this.isSuperAdmin();

    this.userForm = this.fb.group(
      {
        firstName: [this.user.firstName || '', Validators.required],
        lastName: [this.user.lastName || '', Validators.required],
        email: [this.user.email || '', [Validators.required, Validators.email]],
        password: ['', passwordValidators],
        confirmPassword: ['', passwordValidators],
        tenantId: [
          { value: this.user.tenantId || null, disabled: isTenantDisabled },
        ],
        superAdmin: [this.isSuperAdmin()],
        enabled: [this.user.enabled !== false],
        expired: [this.user.expired === true],
        locked: [this.user.locked === true],
      },
      { validators: this.passwordMatchValidator }
    );

    if (!this.isCreate) {
      this.userForm.get('superAdmin')?.disable();
      this.userForm.get('tenantId')?.disable();
    }

    this.onSuperAdminChange(this.isSuperAdmin(), false);
    this.editState.init(this.userForm);
  }

  isSuperAdmin(): boolean {
    return this.user.role === UserRole.SUPER_ADMIN;
  }

  onSuperAdminChange(checked: boolean, showDialog = true): void {
    const tenantControl = this.userForm.get('tenantId');
    if (checked) {
      if (showDialog) {
        this.dialog
          .open(ConfirmationDialogComponent, {
            data: {
              title: 'Create SUPER ADMIN',
              message: 'Do you really want to create a new SUPER ADMIN?',
              confirmLabel: 'Yes',
              cancelLabel: 'No',
            },
          })
          .afterClosed()
          .subscribe((confirmed) => {
            if (confirmed) {
              tenantControl?.disable();
              tenantControl?.setValue(null);
            } else {
              this.userForm.get('superAdmin')?.setValue(false, {
                emitEvent: false,
              });
            }
          });
      } else {
        tenantControl?.disable();
        tenantControl?.setValue(null);
      }
    } else {
      // Only re-enable tenant if we are in create mode
      if (this.isCreate) {
        tenantControl?.enable();
        if (!this.userForm.get('tenantId')?.value && this.tenants.length > 0) {
          tenantControl?.setValue(this.tenants[0].id);
        }
      } else {
        tenantControl?.disable();
      }
    }
  }

  toggleEditMode(): void {
    if (this.editMode) {
      this.saveUser();
    } else {
      this.editMode = true;
      this.userForm.enable();
      // Keep superAdmin and tenantId disabled when editing existing users
      this.userForm.get('superAdmin')?.disable();
      this.userForm.get('tenantId')?.disable();
    }
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    if (this.isCreate) {
      const request: UserCreateRequest = {
        firstName: this.userForm.value.firstName,
        lastName: this.userForm.value.lastName,
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        tenantId: this.userForm.value.superAdmin
          ? null
          : this.userForm.value.tenantId,
      };

      this.userService.createUser(request).subscribe({
        next: (createdUser) => {
          this.user = createdUser;
          this.isCreate = false;
          this.editMode = false;
          this.initForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.loading = false;
        },
      });
    } else {
      const passwordValue = this.userForm.value.password;
      const request: UserUpdateRequest = {
        firstName: this.userForm.value.firstName,
        lastName: this.userForm.value.lastName,
        email: this.userForm.value.email,
        password: passwordValue ? passwordValue : null,
        enabled: this.userForm.value.enabled,
        expired: this.userForm.value.expired,
        locked: this.userForm.value.locked,
      };

      this.userService.updateUser(this.user.id, request).subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.editMode = false;
          this.initForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating user:', error);
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

  goBack(): void {
    this.location.back();
  }

  getTenantDisplayName(tenantId: string | null): string {
    if (!tenantId) {
      return 'N/A';
    }
    const tenant = this.tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : tenantId;
  }
}