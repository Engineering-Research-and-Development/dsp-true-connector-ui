import { environment } from "../../../environments/environment";
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { SnackbarService } from "../snackbar/snackbar.service";
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { ErrorHandlerService } from "../error-handler/error-handler.service";
import { Tenant } from "../../models/tenant";
import { TenantCreateRequest } from "../../models/tenant-create-request";
import { TenantUpdateRequest } from "../../models/tenant-update-request";
import { GenericApiResponse, PagedAPIResponse } from "../../models/genericApiResponse";

/**
 * Tenant service to manage tenants
 */
@Injectable({
  providedIn: 'root',
})
export class TenantService {
  TenantApiUrl = environment.TENANT_API_URL();

  /**
   * Constructor in order to use the HttpClient and set the httpOptions
   * @param http - HttpClient
   * @param snackBarService - service to show snack bar messages
   * @param errorHandlerService - service to handle errors
   * */
  constructor(
    private http: HttpClient,
    private snackBarService: SnackbarService,
    private errorHandlerService: ErrorHandlerService
  ) {}
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  /**
   * Get all tenants as a flat list (used for dropdowns).
   * @returns Observable<Tenant[]> - list of all tenants
   */
  getAllTenantsList(): Observable<Tenant[]> {
    return this.http
      .get<GenericApiResponse<Tenant[]>>(
        `${this.TenantApiUrl}/list`,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Tenant[]>) => {
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
   * Get all tenants with pagination, sorting and optional filters
   * @param filters - filter options
   * @param pagination - pagination and sorting options
   * @returns Observable<PagedAPIResponse<Tenant>> - paginated list of tenants
   */
  getAllTenants(
    filters: {
      name?: string;
      enabled?: boolean;
    } = {},
    pagination: {
      page?: number;
      size?: number;
      sort?: string;
      direction?: 'asc' | 'desc';
    } = {}
  ): Observable<PagedAPIResponse<Tenant>> {
    let params = new HttpParams();

    if (pagination.page !== undefined) {
      params = params.set('page', pagination.page.toString());
    }
    if (pagination.size !== undefined) {
      params = params.set('size', pagination.size.toString());
    }

    const sortField = pagination.sort || 'name';
    const sortDirection = pagination.direction || 'asc';
    params = params.set('sort', `${sortField},${sortDirection}`);

    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.enabled !== undefined) {
      params = params.set('enabled', String(filters.enabled));
    }

    return this.http.get<PagedAPIResponse<Tenant>>(this.TenantApiUrl, {
      ...this.httpOptions,
      params,
    });
  }

  /**
   * Get tenant by id
   * @param id - tenant id
   * @returns Observable<Tenant> - tenant
   */
  getTenantById(id: string): Observable<Tenant> {
    return this.http
      .get<GenericApiResponse<Tenant>>(
        this.TenantApiUrl + '/' + id,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Tenant>) => {
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
   * Create a new tenant
   * @param tenant - tenant to create
   * @returns Observable<Tenant> - created tenant
   */
  createTenant(tenant: TenantCreateRequest): Observable<Tenant> {
    return this.http
      .post<GenericApiResponse<Tenant>>(
        this.TenantApiUrl,
        tenant,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Tenant>) => {
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
   * Update a tenant
   * @param id - tenant id
   * @param tenant - tenant to update
   * @returns Observable<Tenant> - updated tenant
   */
  updateTenant(id: string, tenant: TenantUpdateRequest): Observable<Tenant> {
    return this.http
      .put<GenericApiResponse<Tenant>>(
        `${this.TenantApiUrl}/${id}`,
        tenant,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Tenant>) => {
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
   * Enable a tenant
   * @param id - tenant id
   * @returns Observable<Tenant> - enabled tenant
   */
  enableTenant(id: string): Observable<Tenant> {
    return this.http
      .put<GenericApiResponse<Tenant>>(
        `${this.TenantApiUrl}/${id}/enable`,
        {},
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Tenant>) => {
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
   * Disable a tenant
   * @param id - tenant id
   * @returns Observable<Tenant> - disabled tenant
   */
  disableTenant(id: string): Observable<Tenant> {
    return this.http
      .put<GenericApiResponse<Tenant>>(
        `${this.TenantApiUrl}/${id}/disable`,
        {},
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Tenant>) => {
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
   * Delete a tenant
   * @param id - tenant id
   * @returns Observable<string> - deletion message
   */
  deleteTenant(id: string): Observable<string> {
    return this.http
      .delete<GenericApiResponse<null>>(
        `${this.TenantApiUrl}/${id}`,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<null>) => {
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
