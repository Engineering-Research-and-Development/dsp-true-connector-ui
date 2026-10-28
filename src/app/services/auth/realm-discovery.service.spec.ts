import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TenantRealm } from '../../models/tenant-realm';
import { AUTH_CONFIG, AuthConfig } from './auth-config';
import { RealmDiscoveryService } from './realm-discovery.service';

describe('RealmDiscoveryService', () => {
  let service: RealmDiscoveryService;
  let httpMock: HttpTestingController;

  const keycloakConfig: AuthConfig = {
    provider: 'KEYCLOAK',
    keycloakUrl: 'http://localhost:8180/',
    clientId: 'keycloak-api',
    adminRealm: 'connector-admin',
    publicTenantApiUrl: 'http://localhost:8080/public/tenant',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RealmDiscoveryService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_CONFIG, useValue: keycloakConfig },
      ],
    });

    service = TestBed.inject(RealmDiscoveryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('maps public tenant records and excludes the configured admin realm', () => {
    let result: TenantRealm[] | undefined;

    service.getTenantRealms().subscribe((realms) => (result = realms));

    const request = httpMock.expectOne(
      'http://localhost:8080/public/tenant'
    );
    expect(request.request.method).toBe('GET');
    request.flush([
      { name: 'Engineering', realm: 'tenant_Engineering' },
      { name: 'Connector Admin', realm: 'connector-admin' },
    ]);

    expect(result).toEqual([
      {
        id: 'tenant_Engineering',
        name: 'Engineering',
        realm: 'tenant_Engineering',
      },
    ]);
  });

  it('rejects malformed tenant records', () => {
    let error: unknown;

    service.getTenantRealms().subscribe({
      error: (value) => (error = value),
    });

    httpMock
      .expectOne('http://localhost:8080/public/tenant')
      .flush([{ name: 'Engineering', realm: 42 }]);

    expect(error).toEqual(jasmine.any(Error));
  });

  it('propagates HTTP errors to the caller', () => {
    let error: unknown;

    service.getTenantRealms().subscribe({
      error: (value) => (error = value),
    });

    httpMock
      .expectOne('http://localhost:8080/public/tenant')
      .flush('Service unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
      });

    expect(error).toEqual(
      jasmine.objectContaining({
        status: 503,
        statusText: 'Service Unavailable',
      })
    );
  });
});
