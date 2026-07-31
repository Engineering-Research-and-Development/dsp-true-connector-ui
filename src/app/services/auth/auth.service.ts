import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
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

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.AUTH_API_URL();
  // BehaviorSubjects to manage token state
  private accessTokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('access_token'));
  public accessToken$ = this.accessTokenSubject.asObservable();

  private refreshTokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('refresh_token'));
  public refreshToken$ = this.refreshTokenSubject.asObservable();

  constructor(private http: HttpClient) {}

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

    const payload: RefreshRequest = { refreshToken: currentRefreshToken };

    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, payload).pipe(
      tap(response => this.saveSession(response))
    );
  }

  /**
   * Revokes refresh token on backend and clears local token state
   */
  logout(): Observable<void> {
    const currentRefreshToken = this.refreshToken;
    const payload: LogoutRequest = { refreshToken: currentRefreshToken || '' };

    return this.http.post<void>(`${this.apiUrl}/logout`, payload).pipe(
      tap({
        next: () => this.clearSession(),
        error: () => this.clearSession()
      })
    );
  }

  private saveSession(response: LoginResponse): void {
    if (response.access_token && response.refresh_token) {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      this.accessTokenSubject.next(response.access_token);
      this.refreshTokenSubject.next(response.refresh_token);
    }
  }

  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    this.accessTokenSubject.next(null);
    this.refreshTokenSubject.next(null);
  }
}