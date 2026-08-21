import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GenericApiResponse, PagedAPIResponse } from '../../models/genericApiResponse';
import { User } from '../../models/user';
import { UserCreateRequest } from '../../models/user-create-request';
import { UserUpdateRequest } from '../../models/user-update-request';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { SnackbarService } from '../snackbar/snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.USER_API_URL();

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  constructor(
    private http: HttpClient,
    private snackBarService: SnackbarService,
    private errorHandlerService: ErrorHandlerService
  ) {}

  /**
   * Get all users with filters and pagination
   * @param filters - filter options
   * @param pagination - pagination and sorting options
   * @returns Observable<PagedAPIResponse<User>>
   */
  getUsers(
    filters: {
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: string;
      tenantId?: string;
      enabled?: boolean;
      expired?: boolean;
      locked?: boolean;
    } = {},
    pagination: {
      page?: number;
      size?: number;
      sort?: string;
      direction?: 'asc' | 'desc';
    } = {}
  ): Observable<PagedAPIResponse<User>> {
    let params = new HttpParams();

    if (pagination.page !== undefined) {
      params = params.set('page', pagination.page.toString());
    }
    if (pagination.size !== undefined) {
      params = params.set('size', pagination.size.toString());
    }

    const sortField = pagination.sort || 'tenantId';
    const sortDirection = pagination.direction || 'asc';
    params = params.set('sort', `${sortField},${sortDirection}`);

    if (filters.firstName) {
      params = params.set('firstName', filters.firstName);
    }
    if (filters.lastName) {
      params = params.set('lastName', filters.lastName);
    }
    if (filters.email) {
      params = params.set('email', filters.email);
    }
    if (filters.role) {
      params = params.set('role', filters.role);
    }
    if (filters.tenantId) {
      params = params.set('tenantId', filters.tenantId);
    }
    if (filters.enabled !== undefined) {
      params = params.set('enabled', String(filters.enabled));
    }
    if (filters.expired !== undefined) {
      params = params.set('expired', String(filters.expired));
    }
    if (filters.locked !== undefined) {
      params = params.set('locked', String(filters.locked));
    }

    return this.http.get<PagedAPIResponse<User>>(this.apiUrl, {
      ...this.httpOptions,
      params,
    });
  }

  /**
   * Get the currently authenticated user
   * @returns Observable<User>
   */
  getCurrentUser(): Observable<User> {
    return this.http
      .get<GenericApiResponse<User>>(`${this.apiUrl}/me`, this.httpOptions)
      .pipe(
        map((response: GenericApiResponse<User>) => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

  /**
   * Create a new user
   * @param request - user create request
   * @returns Observable<User>
   */
  createUser(request: UserCreateRequest): Observable<User> {
    return this.http
      .post<GenericApiResponse<User>>(this.apiUrl, request, this.httpOptions)
      .pipe(
        map((response: GenericApiResponse<User>) => {
          if (response.success && response.data) {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return response.data;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

  /**
   * Update an existing user
   * @param id - user id
   * @param request - user update request
   * @returns Observable<User>
   */
  updateUser(id: string, request: UserUpdateRequest): Observable<User> {
    return this.http
      .put<GenericApiResponse<User>>(
        `${this.apiUrl}/${id}`,
        request,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<User>) => {
          if (response.success && response.data) {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return response.data;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

  /**
   * Delete a user
   * @param id - user id
   * @returns Observable<string>
   */
  deleteUser(id: string): Observable<string> {
    return this.http
      .delete<GenericApiResponse<string>>(
        `${this.apiUrl}/${id}`,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<string>) => {
          if (response.success) {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return response.message;
          } else {
            throw new Error(response.message);
          }
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }
}
