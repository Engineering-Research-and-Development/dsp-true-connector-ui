import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AUTH_CONFIG } from '../auth-config';
import { AuthService, LoginResponse } from '../auth.service';
import { KeycloakAuthService } from '../keycloak-auth.service';
import { authInterceptor } from './auth.interceptor';

/** Builds an unsigned JWT-shaped string with the given payload, sufficient for jwt-decode. */
function buildToken(payload: Record<string, unknown>): string {
  const base64url = (value: string) =>
    btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function buildTokenExpiringInSeconds(secondsFromNow: number): string {
  return buildToken({ exp: Math.floor(Date.now() / 1000) + secondsFromNow });
}

function loginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    access_token: buildTokenExpiringInSeconds(900),
    refresh_token: 'initial-refresh-token',
    expires_in: 900,
    ...overrides,
  };
}

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;
  let keycloakAuth: jasmine.SpyObj<KeycloakAuthService>;
  const authApiUrl = environment.AUTH_API_URL();
  const protectedUrl = `${environment.CATALOG_API_URL()}/some-resource`;
  const keycloakConfig = {
    provider: 'KEYCLOAK' as const,
    keycloakUrl: environment.KEYCLOAK_URL,
    clientId: environment.KEYCLOAK_CLIENT_ID,
    adminRealm: environment.KEYCLOAK_ADMIN_REALM,
    publicTenantApiUrl: environment.PUBLIC_TENANT_API_URL(),
  };

  // AuthService reads localStorage.refresh_token once, at construction time. Tests that need a
  // seeded refresh token must build a fresh TestBed/service *after* seeding localStorage, which
  // is what this helper does.
  function createFreshTestBed(provider: 'INTERNAL' | 'KEYCLOAK' = 'INTERNAL'): void {
    TestBed.resetTestingModule();
    keycloakAuth = jasmine.createSpyObj<KeycloakAuthService>(
      'KeycloakAuthService',
      ['getValidAccessToken']
    );
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AUTH_CONFIG,
          useValue: provider === 'INTERNAL' ? { provider } : keycloakConfig,
        },
        { provide: KeycloakAuthService, useValue: keycloakAuth },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  beforeEach(() => {
    localStorage.clear();
    createFreshTestBed();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(authInterceptor).toBeTruthy();
  });

  it('bypasses token logic for the login endpoint', () => {
    httpClient.post(`${authApiUrl}/login`, {}).subscribe();

    const req = httpMock.expectOne(`${authApiUrl}/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush(loginResponse());
  });

  it('bypasses token logic for the refresh endpoint', () => {
    localStorage.setItem('refresh_token', 'initial-refresh-token');

    httpClient.post(`${authApiUrl}/refresh`, { refresh_token: 'initial-refresh-token' }).subscribe();

    const req = httpMock.expectOne(`${authApiUrl}/refresh`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush(loginResponse());
  });

  it('bypasses token logic for the logout endpoint', () => {
    httpClient.post(`${authApiUrl}/logout`, {}).subscribe();

    const req = httpMock.expectOne(`${authApiUrl}/logout`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('does not attach an Authorization header when there is no session', () => {
    httpClient.get(protectedUrl).subscribe();

    const req = httpMock.expectOne(protectedUrl);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('attaches an Authorization header with the current access token when it is valid', () => {
    const token = buildTokenExpiringInSeconds(900);
    authService.login({ email: 'user@example.com', password: 'secret' }).subscribe();
    httpMock.expectOne(`${authApiUrl}/login`).flush(loginResponse({ access_token: token }));

    httpClient.get(protectedUrl).subscribe();

    const req = httpMock.expectOne(protectedUrl);
    expect(req.request.headers.get('Authorization')).toBe('Bearer ' + token);
    req.flush({});
  });

  it('only uses the bearer token for the configured connector API origin and base path', () => {
    const token = buildTokenExpiringInSeconds(900);
    authService.login({ email: 'user@example.com', password: 'secret' }).subscribe();
    httpMock.expectOne(`${authApiUrl}/login`).flush(loginResponse({ access_token: token }));
    const getValidAccessToken = spyOn(authService, 'getValidAccessToken').and.callThrough();
    const nonConnectorUrls = [
      `${environment.KEYCLOAK_URL}realms/connector/protocol/openid-connect/token`,
      environment.PUBLIC_TENANT_API_URL(),
      'https://unrelated.example/api/v1/catalogs',
      `${environment.TC_ROOT_API_URL}-other/catalogs`,
      'https://connector.example/api/v1/catalogs',
    ];

    for (const url of nonConnectorUrls) {
      httpClient.get(url).subscribe();
      const req = httpMock.expectOne(url);
      expect(req.request.headers.has('Authorization')).withContext(url).toBeFalse();
      req.flush({});
    }

    expect(getValidAccessToken).not.toHaveBeenCalled();
  });

  it('proactively refreshes with the selected Keycloak adapter for connector API calls', fakeAsync(() => {
    const token = buildTokenExpiringInSeconds(900);
    createFreshTestBed('KEYCLOAK');
    keycloakAuth.getValidAccessToken.and.resolveTo(token);

    httpClient.get(protectedUrl).subscribe();
    flushMicrotasks();

    const req = httpMock.expectOne(protectedUrl);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(keycloakAuth.getValidAccessToken).toHaveBeenCalledOnceWith(10);
    httpMock.expectNone(`${authApiUrl}/refresh`);
    req.flush({});
  }));

  it('refreshes an expired access token and attaches the new one before forwarding the request', () => {
    localStorage.setItem('refresh_token', 'initial-refresh-token');
    createFreshTestBed();
    authService.login({ email: 'user@example.com', password: 'secret' }).subscribe();
    httpMock
      .expectOne(`${authApiUrl}/login`)
      .flush(loginResponse({ access_token: buildTokenExpiringInSeconds(-10) }));

    httpClient.get(protectedUrl).subscribe();

    const newToken = buildTokenExpiringInSeconds(900);
    httpMock
      .expectOne(`${authApiUrl}/refresh`)
      .flush(loginResponse({ access_token: newToken, refresh_token: 'rotated-refresh-token' }));

    const req = httpMock.expectOne(protectedUrl);
    expect(req.request.headers.get('Authorization')).toBe('Bearer ' + newToken);
    req.flush({});
  });

  it('forwards the request unauthenticated when the proactive refresh attempt fails', () => {
    localStorage.setItem('refresh_token', 'initial-refresh-token');
    createFreshTestBed();

    httpClient.get(protectedUrl).subscribe();

    httpMock.expectOne(`${authApiUrl}/refresh`).flush('invalid_grant', { status: 401, statusText: 'Unauthorized' });

    const req = httpMock.expectOne(protectedUrl);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('retries once with a freshly refreshed token after a 401 and succeeds', () => {
    const token = buildTokenExpiringInSeconds(900);
    localStorage.setItem('refresh_token', 'initial-refresh-token');
    createFreshTestBed();
    authService.login({ email: 'user@example.com', password: 'secret' }).subscribe();
    httpMock.expectOne(`${authApiUrl}/login`).flush(loginResponse({ access_token: token }));

    let succeeded = false;
    httpClient.get(protectedUrl).subscribe({ next: () => (succeeded = true) });

    const firstReq = httpMock.expectOne(protectedUrl);
    expect(firstReq.request.headers.get('Authorization')).toBe('Bearer ' + token);
    firstReq.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    const newToken = buildTokenExpiringInSeconds(900);
    httpMock
      .expectOne(`${authApiUrl}/refresh`)
      .flush(loginResponse({ access_token: newToken, refresh_token: 'rotated-refresh-token' }));

    const retryReq = httpMock.expectOne(protectedUrl);
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer ' + newToken);
    retryReq.flush({ ok: true });

    expect(succeeded).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not retry a connector API request more than once after a 401', () => {
    const token = buildTokenExpiringInSeconds(900);
    localStorage.setItem('refresh_token', 'initial-refresh-token');
    createFreshTestBed();
    authService.login({ email: 'user@example.com', password: 'secret' }).subscribe();
    httpMock.expectOne(`${authApiUrl}/login`).flush(loginResponse({ access_token: token }));

    let failed = false;
    httpClient.get(protectedUrl).subscribe({ error: () => (failed = true) });

    httpMock.expectOne(protectedUrl).flush('unauthorized', { status: 401, statusText: 'Unauthorized' });
    const retryToken = buildTokenExpiringInSeconds(900);
    httpMock
      .expectOne(`${authApiUrl}/refresh`)
      .flush(loginResponse({ access_token: retryToken, refresh_token: 'rotated-refresh-token' }));
    httpMock
      .expectOne(protectedUrl)
      .flush('unauthorized again', { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(`${authApiUrl}/logout`).flush({});

    expect(failed).toBeTrue();
    httpMock.expectNone(`${authApiUrl}/refresh`);
    expect(authService.accessToken).toBeNull();
    expect(authService.refreshToken).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/login'],
      jasmine.objectContaining({ queryParams: jasmine.any(Object) })
    );
  });

  it('clears the session and redirects to /login when the retried refresh also fails', () => {
    const token = buildTokenExpiringInSeconds(900);
    localStorage.setItem('refresh_token', 'initial-refresh-token');
    createFreshTestBed();
    authService.login({ email: 'user@example.com', password: 'secret' }).subscribe();
    httpMock.expectOne(`${authApiUrl}/login`).flush(loginResponse({ access_token: token }));

    let failed = false;
    httpClient.get(protectedUrl).subscribe({ error: () => (failed = true) });

    httpMock.expectOne(protectedUrl).flush('unauthorized', { status: 401, statusText: 'Unauthorized' });
    httpMock
      .expectOne(`${authApiUrl}/refresh`)
      .flush('invalid_grant', { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBeTrue();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], jasmine.objectContaining({ queryParams: jasmine.any(Object) }));
    expect(authService.accessToken).toBeNull();
    expect(authService.refreshToken).toBeNull();
  });
});
