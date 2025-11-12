import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Catalog } from '../../models/catalog';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { SnackbarService } from '../snackbar/snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class ProxyService {
  proxyUrl = environment.PROXY_API_URL();

  /**
   * Constructor in order to use the HttpClient and set the httpOptions
   * @param http
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
   * Get catalog from remote connector
   * @param url
   * @returns Observable<Catalog>
   * example: proxyService.getRemoteCatalog(url).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getRemoteCatalog(url: string): Observable<Catalog> {
    let body = {
      'Forward-To': url,
    };
    return this.http
      .post<GenericApiResponse<Catalog>>(
        this.proxyUrl + '/catalogs',
        body,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<Catalog>) => {
          if (response.success && response.data) {
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
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

  getRemoteDatasetFormats(
    url: string,
    dataSetId: string
  ): Observable<string[]> {
    let body = {
      'Forward-To': url,
    };
    return this.http
      .post<GenericApiResponse<string[]>>(
        this.proxyUrl + '/datasets/' + dataSetId + '/formats',
        body,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<string[]>) => {
          if (response.success && response.data) {
            console.log('Remote dataset formats retrieved:', response.data);
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
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }
}
