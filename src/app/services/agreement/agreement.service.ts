import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Agreement } from '../../models/agreement';
import { GenericApiResponse } from '../../models/genericApiResponse';
import { ErrorHandlerService } from '../error-handler/error-handler.service';

@Injectable({
  providedIn: 'root',
})
export class AgreementService {
  private apiUrl = environment.AGREEMENT_API_URL();

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  constructor(
    private http: HttpClient,
    private errorHandlerService: ErrorHandlerService
  ) {}

  getAgreementById(id: string): Observable<Agreement> {
    return this.http
      .get<GenericApiResponse<Agreement>>(`${this.apiUrl}/${id}`, this.httpOptions)
      .pipe(
        map((response: GenericApiResponse<Agreement>) => {
          if (response.success && response.data) {

            return response.data;
           
          }
          throw new Error(response.message);
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }

// private isDateString(value: string): boolean {
//   return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
// }


}
