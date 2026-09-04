import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  DashboardSummaryParams,
  DashboardSummaryResponse,
} from '../../models/dashboard';
import { GenericApiResponse } from '../../models/genericApiResponse';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = environment.DASHBOARD_API_URL();
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
  };

  constructor(private http: HttpClient) {}

  /**
   * Get the full dashboard summary (negotiations, transfers, events, runtime)
   * for the given time window and bucket size.
   */
  getSummary(
    params: DashboardSummaryParams = {}
  ): Observable<DashboardSummaryResponse> {
    return this.http
      .get<GenericApiResponse<DashboardSummaryResponse>>(
        `${this.apiUrl}/summary`,
        {
          headers: this.toHttpHeaders(params),
          params: this.toHttpParams(params),
        }
      )
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new Error('Dashboard summary response contained no data');
          }
          return response.data;
        })
      );
  }

  /**
   * Builds request headers, adding X-Tenant-Id when a SUPER_ADMIN has scoped
   * the dashboard to a specific tenant (overriding the default tenant scope).
   */
  private toHttpHeaders(params: DashboardSummaryParams): HttpHeaders {
    return params.tenantId
      ? this.httpOptions.headers.set('X-Tenant-Id', params.tenantId)
      : this.httpOptions.headers;
  }

  private toHttpParams(params: DashboardSummaryParams): HttpParams {
    let httpParams = new HttpParams();
    if (params.from) {
      httpParams = httpParams.set('from', params.from);
    }
    if (params.to) {
      httpParams = httpParams.set('to', params.to);
    }
    if (params.bucket) {
      httpParams = httpParams.set('bucket', params.bucket);
    }
    return httpParams;
  }
}
