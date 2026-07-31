import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, tap, catchError, map, shareReplay, finalize } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
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

// Backend contract (RefreshRequest.java/LogoutRequest.java) maps these bodies from the
// snake_case `refresh_token` JSON field - keep the wire format snake_case here too.
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

// Legacy localStorage key used by the initial "added login" implementation, which persisted
// the access token to localStorage. Cleaned up defensively so stale tokens don't linger.
const LEGACY_ACCESS_TOKEN_KEY = 'access_token';

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

  // Refresh token is longer-lived and needed to survive page reloads/browser restarts, so it
  // stays in localStorage.
  private refreshTokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('refresh_token'));
  public refreshToken$ = this.refreshTokenSubject.asObservable();

  // Shared in-flight refresh call so concurrent requests that all discover an expired access
  // token trigger a single HTTP refresh instead of one refresh call per request.
  private refreshInFlight$: Observable<string | null> | null = null;

  constructor(private http: HttpClient) {
    // Clean up any access token persisted by the previous (pre-refresh) implementation.
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
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
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.saveSession(response))
    );
  }

  /**
   * Rotates access token using stored refresh token
   */
  refresh(): Observable<LoginResponse> {
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
   * Resolves a usable (non-expired) access token for outgoing requests:
   * - Returns the current access token immediately if it is present and not expired.
   * - If it's missing/expired but a refresh token is available, performs a de-duplicated
   *   refresh and returns the newly issued access token.
   * - Returns null if there is no refresh token available or the refresh attempt fails (in
   *   which case the local session is cleared).
   */
  getValidAccessToken(): Observable<string | null> {
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
   * Attempts a silent session restore on app bootstrap: if a refresh token is present in
   * localStorage (from a previous visit/reload) but no access token is currently held in
   * memory, performs a refresh so the user isn't forced to log in again on every reload.
   * Always resolves (never throws) so it never blocks app startup.
   */
  initSession(): Observable<string | null> {
    if (this.accessToken || !this.refreshToken) {
      return of(this.accessToken);
    }

    return this.performDedupedRefresh();
  }

  /**
   * Unconditionally attempts a (de-duplicated) refresh, regardless of whether the current
   * in-memory access token looks expired client-side. Intended for the interceptor's reactive
   * 401 fallback: a server-rejected token means the server disagrees with our local expiry
   * check (e.g. clock skew or early revocation), so a plain expiry re-check would just hand
   * back the same token again - a real refresh attempt is required to make progress.
   * Returns null immediately (without an HTTP call) if there is no refresh token available.
   */
  forceRefresh(): Observable<string | null> {
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

  private saveSession(response: LoginResponse): void {
    if (response.access_token && response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);

      this.accessTokenSubject.next(response.access_token);
      this.refreshTokenSubject.next(response.refresh_token);
    }
  }

  private clearSession(): void {
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    localStorage.removeItem('refresh_token');

    this.accessTokenSubject.next(null);
    this.refreshTokenSubject.next(null);
  }
}