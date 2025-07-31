import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AuditEvent } from '../../models/auditEvent';
import { AuditEventType } from '../../models/auditEventType';
import {
  GenericApiResponse,
  PagedAPIResponse,
} from '../../models/genericApiResponse';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private apiUrl = environment.AUDIT_API_URL();
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
  };

  constructor(private http: HttpClient) {}

  /**
   * Get all audit events (this method is deprecated, use getAuditEventsWithFilters with pagination)
   */
  getAllAuditEvents(): Observable<AuditEvent[]> {
    return this.http
      .get<PagedAPIResponse<AuditEvent>>(`${this.apiUrl}`, this.httpOptions)
      .pipe(map((response) => response.response.data?.content || []));
  }

  /**
   * Get audit events with filters and pagination
   */
  getAuditEventsWithFilters(
    filters: {
      eventType?: string;
      username?: string;
      source?: string;
      ipAddress?: string;
      fromDate?: string;
      toDate?: string;
      providerPid?: string;
      consumerPid?: string;
    } = {},
    pagination: {
      page?: number;
      size?: number;
      sort?: string;
      direction?: 'asc' | 'desc';
    } = {}
  ): Observable<PagedAPIResponse<AuditEvent>> {
    let params = new HttpParams();

    // Add pagination parameters
    if (pagination.page !== undefined) {
      params = params.set('page', pagination.page.toString());
    }
    if (pagination.size !== undefined) {
      params = params.set('size', pagination.size.toString());
    }

    // Add sorting parameters
    const sortField = pagination.sort || 'timestamp';
    const sortDirection = pagination.direction || 'desc';
    params = params.set('sort', `${sortField},${sortDirection}`);

    // Add filter parameters
    if (filters.eventType) {
      params = params.set('eventType', filters.eventType);
    }
    if (filters.username) {
      params = params.set('username', filters.username);
    }
    if (filters.source) {
      params = params.set('source', filters.source);
    }
    if (filters.ipAddress) {
      params = params.set('ipAddress', filters.ipAddress);
    }
    if (filters.fromDate) {
      params = params.set('timestamp.from', filters.fromDate);
    }
    if (filters.toDate) {
      params = params.set('timestamp.to', filters.toDate);
    }
    if (filters.providerPid) {
      params = params.set(
        'details.contractNegotiation.providerPid',
        filters.providerPid
      );
    }
    if (filters.consumerPid) {
      params = params.set(
        'details.contractNegotiation.consumerPid',
        filters.consumerPid
      );
    }

    return this.http.get<PagedAPIResponse<AuditEvent>>(`${this.apiUrl}`, {
      ...this.httpOptions,
      params,
    });
  }

  /**
   * Get audit event by ID
   */
  getAuditEventById(id: string): Observable<AuditEvent> {
    return this.http
      .get<GenericApiResponse<AuditEvent>>(
        `${this.apiUrl}/${id}`,
        this.httpOptions
      )
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new Error(`Audit event with id ${id} not found`);
          }
          return response.data;
        })
      );
  }

  /**
   * Get available audit event types
   */
  getAuditEventTypes(): Observable<AuditEventType[]> {
    return this.http
      .get<GenericApiResponse<AuditEventType[]>>(
        `${this.apiUrl}/types`,
        this.httpOptions
      )
      .pipe(map((response) => response.data || []));
  }
}
