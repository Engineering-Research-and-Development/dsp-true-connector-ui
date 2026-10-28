import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  finalize,
  from,
  map,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { AUTH_CONFIG, AuthConfig } from './auth-config';
import {
  KeycloakAuthService,
  KeycloakLoginSelection,
} from './keycloak-auth.service';
// Interfaces matching backend models
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

/** Minimal shape of the claims we care about from a decoded JWT. */
interface DecodedJwt {
  exp?: number;
}

// Number of seconds of leeway subtracted from a token's expiry so we proactively refresh
// slightly before the token actually expires (accounts for clock skew and request latency).
const EXPIRY_LEEWAY_SECONDS = 10;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.AUTH_API_URL();

  // Access token is kept in memory only (never persisted to localStorage) to reduce the
  // window in which it's readable by an XSS payload scraping storage at rest. It is restored
  // transparently on app bootstrap via initSession() if a valid refresh token is available.
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  public accessToken$ = this.accessTokenSubject.asObservable();

  // Only INTERNAL refresh tokens are persisted; Keycloak keeps its token set in the adapter.
  private refreshTokenSubject: BehaviorSubject<string | null>;
  public refreshToken$: Observable<string | null>;

  // Shared in-flight refresh call so concurrent requests that all discover an expired access
  // token trigger a single HTTP refresh instead of one refresh call per request.
  private refreshInFlight$: Observable<string | null> | null = null;

  constructor(
    private http: HttpClient,
    private keycloakAuth: KeycloakAuthService,
    @Inject(AUTH_CONFIG) private authConfig: AuthConfig
  ) {
    const refreshToken =
      authConfig.provider === 'INTERNAL'
        ? localStorage.getItem('refresh_token')
        : null;
    this.refreshTokenSubject = new BehaviorSubject<string | null>(refreshToken);
    this.refreshToken$ = this.refreshTokenSubject.asObservable();

    if (authConfig.provider === 'KEYCLOAK') {
      localStorage.removeItem('refresh_token');
    }
  }

  /**
   * Helper getters for synchronous access to token values
   */
  public get accessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  public get refreshToken(): string | null {
    return this.refreshTokenSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Authenticates user credentials and updates token state
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    if (this.authConfig.provider !== 'INTERNAL') {
      return throwError(
        () => new Error('Keycloak login requires a trusted realm selection.')
      );
    }

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.saveSession(response))
    );
  }

  loginWithKeycloak(selection: KeycloakLoginSelection): Promise<void> {
    if (this.authConfig.provider !== 'KEYCLOAK') {
      return Promise.reject(
        new Error('Keycloak authentication is not enabled.')
      );
    }

    this.clearSession();
    return this.keycloakAuth.login(selection).then((accessToken) => {
      this.accessTokenSubject.next(accessToken);
    });
  }

  /**
   * Rotates access token using stored refresh token
   */
  refresh(): Observable<LoginResponse> {
    if (this.authConfig.provider !== 'INTERNAL') {
      return throwError(
        () => new Error('Keycloak tokens must be refreshed by the adapter.')
      );
    }

    const currentRefreshToken = this.refreshToken;
    if (!currentRefreshToken) {
      throw new Error('No refresh token available to perform operation.');
    }

    const payload: RefreshRequest = { refresh_token: currentRefreshToken };

    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, payload).pipe(
      tap(response => this.saveSession(response))
    );
  }

  /**
   * Revokes refresh token on backend and clears local token state
   */
  logout(): Observable<void> {
    if (this.authConfig.provider === 'KEYCLOAK') {
      this.clearSession();
      return from(this.keycloakAuth.logout());
    }

    const currentRefreshToken = this.refreshToken;
    const payload: LogoutRequest = { refresh_token: currentRefreshToken || '' };

    return this.http.post<void>(`${this.apiUrl}/logout`, payload).pipe(
      tap({
        next: () => this.clearSession(),
        error: () => this.clearSession()
      })
    );
  }

  /**
   * Returns whether the given JWT is expired (or unparsable), applying a small leeway buffer so
   * tokens are treated as expired shortly before their actual `exp` to avoid races between the
   * expiry check and the request reaching the server.
   */
  isTokenExpired(token: string | null, leewaySeconds: number = EXPIRY_LEEWAY_SECONDS): boolean {
    if (!token) {
      return true;
    }

    try {
      const decoded = jwtDecode<DecodedJwt>(token);
      if (!decoded.exp) {
        return true;
      }

      const nowSeconds = Date.now() / 1000;
      return decoded.exp - leewaySeconds <= nowSeconds;
    } catch {
      // Malformed/undecodable token - fail safe by treating it as expired.
      return true;
    }
  }

  /**
   * Resolves a usable access token through the selected provider. INTERNAL refresh requests are
   * de-duplicated; Keycloak refreshes through the active adapter. Failed refreshes clear the
   * local session and return null.
   */
  getValidAccessToken(): Observable<string | null> {
    if (this.authConfig.provider === 'KEYCLOAK') {
      return this.getKeycloakAccessToken(10);
    }

    const currentAccessToken = this.accessToken;
    if (currentAccessToken && !this.isTokenExpired(currentAccessToken)) {
      return of(currentAccessToken);
    }

    if (!this.refreshToken) {
      return of(null);
    }

    return this.performDedupedRefresh();
  }

  /**
   * Restores the selected provider's session before route guards run. INTERNAL refresh errors
   * and invalid Keycloak callbacks leave the user unauthenticated without blocking bootstrap.
   */
  initSession(): Observable<string | null> {
    if (this.authConfig.provider === 'KEYCLOAK') {
      return from(this.keycloakAuth.initSession()).pipe(
        tap((token) => this.accessTokenSubject.next(token)),
        catchError(() => {
          this.clearSession();
          return of(null);
        })
      );
    }

    if (this.accessToken || !this.refreshToken) {
      return of(this.accessToken);
    }

    return this.performDedupedRefresh();
  }

  /**
   * Unconditionally attempts refresh for the selected provider, regardless of whether the
   * current token looks expired client-side. Used by the interceptor's reactive 401 fallback.
   */
  forceRefresh(): Observable<string | null> {
    if (this.authConfig.provider === 'KEYCLOAK') {
      return this.getKeycloakAccessToken(-1);
    }

    if (!this.refreshToken) {
      return of(null);
    }

    return this.performDedupedRefresh();
  }

  /**
   * Runs (or joins an already in-flight) refresh call, sharing a single HTTP request across
   * concurrent callers.
   */
  private performDedupedRefresh(): Observable<string | null> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.refresh().pipe(
        map(response => response.access_token),
        catchError(() => {
          this.clearSession();
          return of(null);
        }),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay(1)
      );
    }

    return this.refreshInFlight$;
  }

  private getKeycloakAccessToken(
    minValiditySeconds: number
  ): Observable<string | null> {
    return from(
      this.keycloakAuth.getValidAccessToken(minValiditySeconds)
    ).pipe(
      tap((token) => this.accessTokenSubject.next(token)),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  private saveSession(response: LoginResponse): void {
    if (response.access_token && response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);

      this.accessTokenSubject.next(response.access_token);
      this.refreshTokenSubject.next(response.refresh_token);
    }
  }

  private clearSession(): void {
    localStorage.removeItem('refresh_token');

    this.accessTokenSubject.next(null);
    this.refreshTokenSubject.next(null);
  }
}