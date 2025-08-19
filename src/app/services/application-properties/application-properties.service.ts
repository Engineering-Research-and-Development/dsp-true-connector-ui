import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationProperty } from '../../models/applicationProperty';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { SnackbarService } from '../snackbar/snackbar.service';

/**
 * Application Properties Service to manage connector configuration properties
 */
@Injectable({
  providedIn: 'root',
})
export class ApplicationPropertiesService {
  private readonly propertiesApiUrl = environment.PROPERTIES_API_URL();

  constructor(
    private http: HttpClient,
    private snackBarService: SnackbarService,
    private errorHandlerService: ErrorHandlerService
  ) {}

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  /**
   * Get all properties or filter by key prefix
   * @param keyPrefix - Optional prefix to filter properties
   * @returns Observable<ApplicationProperty[]>
   */
  getProperties(keyPrefix?: string): Observable<ApplicationProperty[]> {
    let params = new HttpParams();
    if (keyPrefix && keyPrefix.trim()) {
      params = params.set('key_prefix', keyPrefix.trim());
    }

    const options = {
      ...this.httpOptions,
      params,
    };

    return this.http
      .get<GenericApiResponse<ApplicationProperty[]>>(
        this.propertiesApiUrl + '/',
        options
      )
      .pipe(
        map((response: GenericApiResponse<ApplicationProperty[]>) => {
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
   * Update multiple properties
   * @param properties - Array of properties to update
   * @returns Observable<ApplicationProperty[]>
   */
  updateProperties(
    properties: ApplicationProperty[]
  ): Observable<ApplicationProperty[]> {
    return this.http
      .put<GenericApiResponse<ApplicationProperty[]>>(
        this.propertiesApiUrl + '/',
        properties,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<ApplicationProperty[]>) => {
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
}
