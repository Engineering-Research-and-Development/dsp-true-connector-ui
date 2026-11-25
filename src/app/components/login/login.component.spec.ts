import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AuthConfig, AUTH_CONFIG } from '../../services/auth/auth-config';
import { AuthService } from '../../services/auth/auth.service';
import { RealmDiscoveryService } from '../../services/auth/realm-discovery.service';
import { TenantRealm } from '../../models/tenant-realm';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let config: AuthConfig;
  let queryParams: Record<string, string>;
  let authService: jasmine.SpyObj<AuthService>;
  let realmDiscovery: jasmine.SpyObj<RealmDiscoveryService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    sessionStorage.clear();
    config = { provider: 'INTERNAL' };
    queryParams = {};
    authService = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['login', 'loginWithKeycloak']
    );
    authService.login.and.returnValue(
      of({
        access_token: 'internal-access-token',
        refresh_token: 'internal-refresh-token',
        expires_in: 300,
      })
    );
    authService.loginWithKeycloak.and.resolveTo();
    realmDiscovery = jasmine.createSpyObj<RealmDiscoveryService>(
      'RealmDiscoveryService',
      ['getTenantRealms']
    );
    realmDiscovery.getTenantRealms.and.returnValue(of([]));
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AUTH_CONFIG, useFactory: () => config },
        { provide: AuthService, useValue: authService },
        { provide: RealmDiscoveryService, useValue: realmDiscovery },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useFactory: () => ({ snapshot: { queryParams } }),
        },
      ],
    }).compileComponents();
  });

  afterEach(() => sessionStorage.clear());

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('shows and submits the existing email/password form in INTERNAL mode', async () => {
    await render();

    expect(
      fixture.nativeElement.querySelector('#email')
    ).toBeTruthy();

    fixture.componentInstance.loginForm.setValue({
      email: 'user@example.com',
      password: 'password',
    });
    fixture.componentInstance.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password',
    });
    expect(realmDiscovery.getTenantRealms).not.toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('loads one tenant button per discovered realm alongside super-admin login', async () => {
    realmDiscovery.getTenantRealms.and.returnValue(
      of([
        {
          id: 'tenant_Engineering',
          name: 'Engineering',
          realm: 'tenant_Engineering',
        }],
      )
    );
    config = {
      provider: 'KEYCLOAK',
      keycloakUrl: 'https://identity.example.test/',
      clientId: 'keycloak-api',
      adminRealm: 'connector-admin',
      publicTenantApiUrl: '/api/v1/public/tenant',
    };
    await render();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="tenant-realm-tenant_Engineering"]'
      )
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="admin-login"]')
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="tenant-login"]')
    ).toBeNull();
    expect(realmDiscovery.getTenantRealms).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('#email')).toBeNull();
  });

  it('starts login with the selected trusted realm button', async () => {
    const tenants: TenantRealm[] = [
      { id: 'tenant_Engineering', name: 'Engineering', realm: 'tenant_Engineering' },
    ];
    realmDiscovery.getTenantRealms.and.returnValue(of(tenants));
    config = keycloakConfig();
    queryParams = { returnUrl: '/catalog-browser' };
    await render();

    expect(realmDiscovery.getTenantRealms).toHaveBeenCalled();

    const tenantButton = fixture.nativeElement.querySelector(
      '[data-testid="tenant-realm-tenant_Engineering"]'
    ) as HTMLButtonElement | null;
    expect(tenantButton?.textContent).toContain('Engineering');
    tenantButton?.click();
    await fixture.whenStable();

    expect(authService.loginWithKeycloak).toHaveBeenCalledWith({
      type: 'tenant',
      realm: 'tenant_Engineering',
    });
    expect(sessionStorage.getItem('keycloak_auth_return_url')).toBe(
      '/catalog-browser'
    );
  });

  it('shows tenant discovery loading and empty states', async () => {
    const discovery = new Subject<TenantRealm[]>();
    realmDiscovery.getTenantRealms.and.returnValue(discovery);
    config = keycloakConfig();
    await render();

    expect(
      fixture.nativeElement.querySelector('[data-testid="tenant-loading"]')
    ).toBeTruthy();

    discovery.next([]);
    discovery.complete();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="tenant-empty"]')
    ).toBeTruthy();
  });

  it('shows a recoverable error and retries tenant discovery', async () => {
    const tenants: TenantRealm[] = [
      { id: 'tenant_Engineering', name: 'Engineering', realm: 'tenant_Engineering' },
    ];
    realmDiscovery.getTenantRealms.and.returnValues(
      throwError(() => new Error('Discovery unavailable')),
      of(tenants)
    );
    config = keycloakConfig();
    await render();

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="tenant-error"]')
        ?.textContent
    ).toContain('Discovery unavailable');
    expect(
      fixture.nativeElement.querySelector('[data-testid="tenant-retry"]')
    ).toBeTruthy();

    click('[data-testid="tenant-retry"]');

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="tenant-realm-tenant_Engineering"]'
      )
    ).toBeTruthy();
  });

  it('starts admin login after loading tenant choices on page entry', async () => {
    config = keycloakConfig();
    await render();

    click('[data-testid="admin-login"]');
    await fixture.whenStable();

    expect(realmDiscovery.getTenantRealms).toHaveBeenCalledTimes(1);
    expect(authService.loginWithKeycloak).toHaveBeenCalledWith({
      type: 'admin',
    });
  });

  it('rejects an unsafe INTERNAL return URL and falls back to the dashboard', async () => {
    config = { provider: 'INTERNAL' };
    queryParams = { returnUrl: '//outside.example.test/path' };
    await render();
    fixture.componentInstance.loginForm.setValue({
      email: 'user@example.com',
      password: 'password',
    });

    fixture.componentInstance.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('does not redirect to the callback route after INTERNAL login', async () => {
    config = { provider: 'INTERNAL' };
    queryParams = { returnUrl: '/auth/callback?code=stale' };
    await render();
    fixture.componentInstance.loginForm.setValue({
      email: 'user@example.com',
      password: 'password',
    });

    fixture.componentInstance.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  function click(selector: string): void {
    const button = fixture.nativeElement.querySelector(
      selector
    ) as HTMLButtonElement | null;
    expect(button).toBeTruthy();
    button?.click();
    fixture.detectChanges();
  }
});

function keycloakConfig(): AuthConfig {
  return {
    provider: 'KEYCLOAK',
    keycloakUrl: 'https://identity.example.test/',
    clientId: 'keycloak-api',
    adminRealm: 'connector-admin',
    publicTenantApiUrl: '/api/v1/public/tenant',
  };
}
