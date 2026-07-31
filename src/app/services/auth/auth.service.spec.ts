import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService, LoginResponse } from './auth.service';

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

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const authApiUrl = environment.AUTH_API_URL();

  // AuthService reads localStorage.refresh_token once, at construction time (into a
  // BehaviorSubject) - setting localStorage afterwards has no effect on an already-injected
  // instance. Tests that need to seed a refresh token must build a fresh TestBed/service
  // *after* seeding localStorage, which is what this helper does.
  function createFreshAuthService(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    localStorage.clear();
    createFreshAuthService();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login/session persistence', () => {
    it('keeps the access token in memory only and persists only the refresh token', () => {
      const response: LoginResponse = {
        access_token: buildTokenExpiringInSeconds(900),
        refresh_token: 'refresh-token-value',
        expires_in: 900,
        token_type: 'Bearer',
      };

      service.login({ email: 'user@example.com', password: 'secret' }).subscribe();

      const req = httpMock.expectOne(`${authApiUrl}/login`);
      expect(req.request.method).toBe('POST');
      req.flush(response);

      expect(service.accessToken).toBe(response.access_token);
      expect(service.refreshToken).toBe(response.refresh_token);
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBe(response.refresh_token);
    });

    it('cleans up any legacy access_token left in localStorage by older versions', () => {
      localStorage.setItem('access_token', 'stale-legacy-token');

      createFreshAuthService();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(service.accessToken).toBeNull();
    });
  });

  describe('refresh/logout payload contract', () => {
    it('sends the refresh token as snake_case refresh_token (matches backend contract)', () => {
      const response: LoginResponse = {
        access_token: buildTokenExpiringInSeconds(900),
        refresh_token: 'rotated-refresh-token',
        expires_in: 900,
      };

      // Seed a refresh token as if a previous login happened.
      localStorage.setItem('refresh_token', 'initial-refresh-token');
      createFreshAuthService();

      service.refresh().subscribe();

      const req = httpMock.expectOne(`${authApiUrl}/refresh`);
      expect(req.request.body).toEqual({ refresh_token: 'initial-refresh-token' });
      req.flush(response);

      expect(service.refreshToken).toBe('rotated-refresh-token');
    });

    it('sends the refresh token as snake_case refresh_token on logout and clears session', () => {
      localStorage.setItem('refresh_token', 'initial-refresh-token');
      createFreshAuthService();

      service.logout().subscribe();

      const req = httpMock.expectOne(`${authApiUrl}/logout`);
      expect(req.request.body).toEqual({ refresh_token: 'initial-refresh-token' });
      req.flush(null);

      expect(service.accessToken).toBeNull();
      expect(service.refreshToken).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('clears the session even if the logout request fails', () => {
      localStorage.setItem('refresh_token', 'initial-refresh-token');
      createFreshAuthService();

      service.logout().subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${authApiUrl}/logout`);
      req.flush('error', { status: 500, statusText: 'Server Error' });

      expect(service.refreshToken).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('treats a null token as expired', () => {
      expect(service.isTokenExpired(null)).toBeTrue();
    });

    it('treats a malformed token as expired', () => {
      expect(service.isTokenExpired('not-a-jwt')).toBeTrue();
    });

    it('treats a token without an exp claim as expired', () => {
      expect(service.isTokenExpired(buildToken({ sub: 'user' }))).toBeTrue();
    });

    it('treats a token expiring in the far future as not expired', () => {
      expect(service.isTokenExpired(buildTokenExpiringInSeconds(3600))).toBeFalse();
    });

    it('treats an already-expired token as expired', () => {
      expect(service.isTokenExpired(buildTokenExpiringInSeconds(-60))).toBeTrue();
    });

    it('applies the leeway buffer so a token expiring within the buffer window is treated as expired', () => {
      expect(service.isTokenExpired(buildTokenExpiringInSeconds(5), 10)).toBeTrue();
    });
  });

  describe('getValidAccessToken', () => {
    it('returns the current token without an HTTP call when it is not expired', done => {
      const response: LoginResponse = {
        access_token: buildTokenExpiringInSeconds(900),
        refresh_token: 'refresh-token-value',
        expires_in: 900,
      };
      service.login({ email: 'user@example.com', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authApiUrl}/login`).flush(response);

      service.getValidAccessToken().subscribe(token => {
        expect(token).toBe(response.access_token);
        httpMock.expectNone(`${authApiUrl}/refresh`);
        done();
      });
    });

    it('returns null without an HTTP call when there is no refresh token', done => {
      service.getValidAccessToken().subscribe(token => {
        expect(token).toBeNull();
        httpMock.expectNone(`${authApiUrl}/refresh`);
        done();
      });
    });

    it('refreshes the access token when it is expired and a refresh token is available', done => {
      localStorage.setItem('refresh_token', 'initial-refresh-token');
      createFreshAuthService();

      // Force an expired in-memory access token by logging in with one, then letting time "pass".
      const expiredResponse: LoginResponse = {
        access_token: buildTokenExpiringInSeconds(-10),
        refresh_token: 'initial-refresh-token',
        expires_in: 900,
      };
      service.login({ email: 'user@example.com', password: 'secret' }).subscribe();
      httpMock.expectOne(`${authApiUrl}/login`).flush(expiredResponse);

      const refreshedResponse: LoginResponse = {
        access_token: buildTokenExpiringInSeconds(900),
        refresh_token: 'rotated-refresh-token',
        expires_in: 900,
      };

      service.getValidAccessToken().subscribe(token => {
        expect(token).toBe(refreshedResponse.access_token);
        expect(service.refreshToken).toBe('rotated-refresh-token');
        done();
      });

      const refreshReq = httpMock.expectOne(`${authApiUrl}/refresh`);
      refreshReq.flush(refreshedResponse);
    });

    it('clears the session and returns null when the refresh call fails', done => {
      localStorage.setItem('refresh_token', 'initial-refresh-token');
      createFreshAuthService();

      service.getValidAccessToken().subscribe(token => {
        expect(token).toBeNull();
        expect(service.refreshToken).toBeNull();
        expect(service.accessToken).toBeNull();
        done();
      });

      const refreshReq = httpMock.expectOne(`${authApiUrl}/refresh`);
      refreshReq.flush('invalid_grant', { status: 401, statusText: 'Unauthorized' });
    });

    it('de-duplicates concurrent refresh calls into a single HTTP request', done => {
      localStorage.setItem('refresh_token', 'initial-refresh-token');
      createFreshAuthService();

      const refreshedResponse: LoginResponse = {
        access_token: buildTokenExpiringInSeconds(900),
        refresh_token: 'rotated-refresh-token',
        expires_in: 900,
      };

      let resolvedCount = 0;
      const onResolved = (token: string | null) => {
        expect(token).toBe(refreshedResponse.access_token);
        resolvedCount++;
        if (resolvedCount === 2) {
          done();
        }
      };

      service.getValidAccessToken().subscribe(onResolved);
      service.getValidAccessToken().subscribe(onResolved);

      const refreshReq = httpMock.expectOne(`${authApiUrl}/refresh`);
      refreshReq.flush(refreshedResponse);
    });
  });
});
