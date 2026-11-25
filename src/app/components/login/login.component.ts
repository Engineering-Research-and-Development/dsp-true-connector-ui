import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthConfig, AUTH_CONFIG } from '../../services/auth/auth-config';
import { KeycloakLoginSelection } from '../../services/auth/keycloak-auth.service';
import { RealmDiscoveryService } from '../../services/auth/realm-discovery.service';
import { AuthService, LoginRequest } from '../../services/auth/auth.service';
import {
  KEYCLOAK_RETURN_URL_STORAGE_KEY,
  safeLocalReturnUrl,
} from '../../services/auth/auth-navigation';
import { TenantRealm } from '../../models/tenant-realm';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  tenantErrorMessage: string | null = null;
  tenants: TenantRealm[] = [];
  isLoadingTenants = false;
  showPassword = false; // Track password visibility
  private returnUrl: string = '/dashboard';
  readonly isKeycloakMode: boolean;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private realmDiscovery: RealmDiscoveryService,
    @Inject(AUTH_CONFIG) config: AuthConfig
  ) {
    this.isKeycloakMode = config.provider === 'KEYCLOAK';
  }

  ngOnInit(): void {
    this.returnUrl = safeLocalReturnUrl(
      this.route.snapshot.queryParams['returnUrl']
    );

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });

    if (this.isKeycloakMode) {
      this.loadTenantChoices();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isSubmitting = false;
        // Redirect to requested page or default dashboard page
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error?.error?.message || 'Authentication failed. Please check your credentials and try again.';
      }
    });
  }

  loadTenantChoices(): void {
    this.tenants = [];
    this.tenantErrorMessage = null;
    this.isLoadingTenants = true;

    this.realmDiscovery.getTenantRealms().subscribe({
      next: (tenants) => {
        this.tenants = tenants;
        this.isLoadingTenants = false;
      },
      error: (error: unknown) => {
        this.tenantErrorMessage =
          error instanceof Error
            ? error.message
            : 'Could not load tenant login options. Please try again.';
        this.isLoadingTenants = false;
      },
    });
  }

  loginAsTenant(tenant: TenantRealm): void {
    this.startKeycloakLogin({ type: 'tenant', realm: tenant.realm });
  }

  loginAsAdmin(): void {
    this.startKeycloakLogin({ type: 'admin' });
  }

  private startKeycloakLogin(selection: KeycloakLoginSelection): void {
    this.errorMessage = null;
    this.isSubmitting = true;
    sessionStorage.setItem(
      KEYCLOAK_RETURN_URL_STORAGE_KEY,
      this.returnUrl
    );

    this.authService.loginWithKeycloak(selection).then(
      () => {
        this.isSubmitting = false;
        if (this.authService.isAuthenticated) {
          sessionStorage.removeItem(KEYCLOAK_RETURN_URL_STORAGE_KEY);
          this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
        }
      },
      (error: unknown) => {
        this.isSubmitting = false;
        sessionStorage.removeItem(KEYCLOAK_RETURN_URL_STORAGE_KEY);
        this.errorMessage =
          error instanceof Error
            ? error.message
            : 'Authentication failed. Please try again.';
      }
    );
  }
}