import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Catalog } from '../../models/catalog';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { SnackbarService } from '../snackbar/snackbar.service';

/**
 * Catalog Service to manage the catalog data
 * */
@Injectable()
export class CatalogService {
  catalogApiUrl = environment.CATALOG_API_URL();

  /**
   * Constructor in order to use the HttpClient and set the httpOptions
   * @param http
   * */
  constructor(
    private http: HttpClient,
    private snackBarService: SnackbarService
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
          if (response.success) {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-success'
            );
            return response.data;
          } else {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
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
          if (response.success) {
            return response.data;
          } else {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
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
          if (response.success) {
            return response.data;
          } else {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
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
          if (response.success) {
            return response.data;
          } else {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
      );
  }

  /**
   * Update a catalog
   * @param catalog
   * @returns Observable<Catalog>
   * @example catalogService.updateCatalog(catalog).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  updateCatalog(catalog: Catalog): Observable<Catalog> {
    return this.http
      .put<GenericApiResponse<Catalog>>(
        this.catalogApiUrl + '/' + catalog['@id'],
        catalog,
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
            return response.data;
          } else {
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
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
            this.snackBarService.openSnackBar(
              response.message,
              'OK',
              'center',
              'bottom',
              'snackbar-error'
            );
            throw new Error(response.message);
          }
        }),
        catchError(this.errorHandler.bind(this))
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
        catchError(this.errorHandler.bind(this))
      );
  }

  /**
   * Handle errors
   * @param error
   * @returns throwError
   * */
  errorHandler(error: any) {
    console.log('ERR', error);
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    this.snackBarService.openSnackBar(
      'An error occurred: ' + errorMessage,
      'OK',
      'center',
      'bottom',
      'snackbar-error'
    );
    console.log(errorMessage);
    return throwError(() => {
      return errorMessage;
    });
  }
}
