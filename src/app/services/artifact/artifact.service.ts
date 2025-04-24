import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlerService } from '../error-handler/error-handler.service';

@Injectable({
  providedIn: 'root',
})
export class ArtifactService {
  constructor(
    private http: HttpClient,
    private errorHandlerService: ErrorHandlerService
  ) {}

  /**
   * Download artifact
   * @param transactionId The transaction ID
   * @param callbackAddress The callback address
   * @returns Observable<Blob>
   */
  downloadArtifact(
    transactionId: string,
    callbackAddress: string
  ): Observable<Blob> {
    return this.http
      .get(callbackAddress + '/artifacts/' + transactionId, {
        responseType: 'blob',
      })
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => this.errorHandlerService.handleError(error))
      );
  }
}
