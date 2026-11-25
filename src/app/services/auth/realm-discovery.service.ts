import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { TenantRealm } from '../../models/tenant-realm';
import { AUTH_CONFIG } from './auth-config';

@Injectable({
  providedIn: 'root',
})
export class RealmDiscoveryService {
  private readonly config = inject(AUTH_CONFIG);
  private readonly http = inject(HttpClient);

  getTenantRealms(): Observable<TenantRealm[]> {
    if (this.config.provider !== 'KEYCLOAK') {
      return throwError(
        () => new Error('Tenant realm discovery requires KEYCLOAK mode.')
      );
    }

    const config = this.config;
    return this.http
      .get<unknown>(config.publicTenantApiUrl)
      .pipe(
        map((response) =>
          parseTenantRealms(response, config.adminRealm)
        )
      );
  }
}

function parseTenantRealms(
  response: unknown,
  adminRealm: string
): TenantRealm[] {
  if (!Array.isArray(response)) {
    throw new Error('Tenant discovery response must be an array.');
  }

  return response
    .map((record, index) => {
      if (!isRecord(record)) {
        throw new Error(`Tenant discovery record ${index} must be an object.`);
      }

      const name = nonEmptyString(record['name']);
      const realm = nonEmptyString(record['realm']);
      if (!name || !realm) {
        throw new Error(
          `Tenant discovery record ${index} must include a non-empty name and realm.`
        );
      }

      return { id: realm, name, realm };
    })
    .filter((tenant) => tenant.realm !== adminRealm);
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
