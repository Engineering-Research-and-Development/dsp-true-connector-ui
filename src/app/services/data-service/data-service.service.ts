import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DataService } from '../../models/dataService';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { SnackbarService } from '../snackbar/snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class DataServiceService {
  dataServiceApiUrl = environment.DATASERVICE_API_URL();

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
   * Create a new data service
   * @param dataService
   * @returns Observable<DataService>
   * @example dataServiceService.createDataService(dataService).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  createDataService(dataService: DataService): Observable<DataService> {
    return this.http
      .post<GenericApiResponse<DataService>>(
        this.dataServiceApiUrl,
        dataService,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<DataService>) => {
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
   * Get all data services
   * @returns Observable<DataService[]>
   * @example dataServiceService.getAllDataServices().subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getAllDataServices(): Observable<DataService[]> {
    return this.http
      .get<GenericApiResponse<DataService[]>>(
        this.dataServiceApiUrl,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<DataService[]>) => {
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
   * Get a data service
   * @returns Observable<DataService>
   * @example dataServiceService.getDataService(id).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  getDataServiceById(id: string): Observable<DataService> {
    return this.http
      .get<GenericApiResponse<DataService>>(
        this.dataServiceApiUrl + '/' + id,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<DataService>) => {
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
   * Update a data service
   * @param id
   * @param dataService
   * @returns Observable<DataService>
   * @example dataServiceService.updateDataService(id, dataService).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  updateDataService(
    id: string,
    dataService: DataService
  ): Observable<DataService> {
    return this.http
      .put<GenericApiResponse<DataService>>(
        this.dataServiceApiUrl + '/' + id,
        dataService,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<DataService>) => {
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
   * Delete a data service
   * @param id
   * @returns Observable<DataService>
   * @example dataServiceService.deleteDataService(id).subscribe({ next: console.log, error: console.error, complete: () => console.log('completed') });
   * */
  deleteDataService(id: string): Observable<string> {
    return this.http
      .delete<GenericApiResponse<DataService>>(
        this.dataServiceApiUrl + '/' + id,
        this.httpOptions
      )
      .pipe(
        map((response: GenericApiResponse<DataService>) => {
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
