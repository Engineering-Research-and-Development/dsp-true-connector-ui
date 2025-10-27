import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Catalog } from '../../models/catalog';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { SnackbarService } from '../snackbar/snackbar.service';

/**
 * Catalog Service to manage the catalog data
 * */
@Injectable()
export class CatalogService {
  catalogApiUrl = environment.CATALOG_API_URL();

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
   * Create a new catalog
   * @param catalog
   * @returns Observable<Catalog>
   * @example catalogService.createCatalog(catalog).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  createCatalog(catalog: Catalog): Observable<Catalog> {
    return this.http
      .post<GenericApiResponse<Catalog>>(
        this.catalogApiUrl,
        catalog,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Catalog>) => {
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
   * Get all catalogs
   * @returns Observable<Catalog[]>
   * @example catalogService.getAllCatalogs().subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getAllCatalogs(): Observable<Catalog[]> {
    return this.http
      .get<GenericApiResponse<Catalog[]>>(this.catalogApiUrl, this.httpOptions)
      .pipe(
        map((response: GenericApiResponse<Catalog[]>) => {
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
   * Get a catalog
   * @returns Observable<Catalog>
   * @example catalogService.getCatalog(id).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getCatalog(): Observable<Catalog> {
    return this.http
      .get<GenericApiResponse<Catalog>>(this.catalogApiUrl, this.httpOptions)
      .pipe(
        map((response: GenericApiResponse<Catalog>) => {
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
   * Get a catalog by id
   * @param id
   * @returns Observable<Catalog>
   * @example catalogService.getCatalogById(id).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getCatalogById(id: string): Observable<Catalog> {
    return this.http
      .get<GenericApiResponse<Catalog>>(
        this.catalogApiUrl + '/' + id,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Catalog>) => {
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
   * Update a catalog
   * @param catalog
   * @returns Observable<Catalog>
   * @example catalogService.updateCatalog(catalog).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  updateCatalog(catalog: Catalog): Observable<Catalog> {
    console.log('Updating catalog with id:', catalog);
    return this.http
      .put<GenericApiResponse<Catalog>>(
        this.catalogApiUrl + '/' + catalog['@id'],
        catalog,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Catalog>) => {
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
   * Delete a catalog
   * @param id
   * @returns Observable<Catalog>
   * @example catalogService.deleteCatalog(id).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  deleteCatalog(id: string): Observable<string> {
    return this.http
      .delete<GenericApiResponse<Catalog>>(
        this.catalogApiUrl + '/' + id,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Catalog>) => {
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

  /**
   * Upload a catalog file
   * @param file
   * @returns Observable<any>
   * @example catalogService.uploadCatalogFile(file).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  uploadCatalogFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post(this.catalogApiUrl + 'upload', formData, { responseType: 'text' })
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }
}
