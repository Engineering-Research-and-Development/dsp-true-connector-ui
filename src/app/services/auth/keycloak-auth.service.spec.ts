import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TenantRealm } from '../../models/tenant-realm';
import { AUTH_CONFIG, AuthConfig } from './auth-config';
import { RealmDiscoveryService } from './realm-discovery.service';
import {
  KEYCLOAK_CLIENT_FACTORY,
  KEYCLOAK_LOGOUT_NAVIGATOR,
  KEYCLOAK_SELECTION_STORAGE_KEY,
  KeycloakAuthService,
  KeycloakClient,
} from './keycloak-auth.service';

describe('KeycloakAuthService', () => {
  let service: KeycloakAuthService;
  let client: KeycloakClient;
  let authenticated: boolean;
  let token: string | undefined;
  let initResult: boolean;
  let initError: Error | null;
  let factory: jasmine.SpyObj<{ create: (config: object) => KeycloakClient }>;
  let logoutNavigator: jasmine.SpyObj<{ navigate: (url: string) => void }>;
  let realmDiscovery: jasmine.SpyObj<RealmDiscoveryService>;

  const config: AuthConfig = {
    provider: 'KEYCLOAK',
    keycloakUrl: 'http://localhost:8180/',
    clientId: 'keycloak-api',
    adminRealm: 'connector-admin',
    publicTenantApiUrl: 'http://localhost:8080/public/tenant',
  };
  const tenantRealms: TenantRealm[] = [
    { id: 'tenant-a', name: 'Tenant A', realm: 'tenant-a-realm' },
  ];

  beforeEach(() => {
    sessionStorage.clear();
    authenticated = false;
    token = undefined;
    initResult = false;
    initError = null;

    client = {
      get authenticated() {
        return authenticated;
      },
      get token() {
        return token;
      },
      init: jasmine.createSpy('init').and.callFake(async () => {
        if (initError) {
          throw initError;
        }
        authenticated = initResult;
        token = initResult ? 'keycloak-access-token' : undefined;
        return initResult;
      }),
      login: jasmine.createSpy('login').and.resolveTo(),
      updateToken: jasmine.createSpy('updateToken').and.callFake(async () => {
        token = 'refreshed-keycloak-access-token';
        return true;
      }),
      createLogoutUrl: jasmine.createSpy('createLogoutUrl').and.returnValue(
        'https://keycloak.example/logout?id_token_hint=active-token'
      ),
      clearToken: jasmine.createSpy('clearToken').and.callFake(() => {
        authenticated = false;
        token = undefined;
      }),
    };

    factory = jasmine.createSpyObj('KeycloakClientFactory', ['create']);
    factory.create.and.returnValue(client);
    logoutNavigator = jasmine.createSpyObj('KeycloakLogoutNavigator', [
      'navigate',
    ]);
    realmDiscovery = jasmine.createSpyObj<RealmDiscoveryService>(
      'RealmDiscoveryService',
      ['getTenantRealms']
    );
    realmDiscovery.getTenantRealms.and.returnValue(of(tenantRealms));

    TestBed.configureTestingModule({
      providers: [
        KeycloakAuthService,
        { provide: AUTH_CONFIG, useValue: config },
        { provide: KEYCLOAK_CLIENT_FACTORY, useValue: factory },
        { provide: KEYCLOAK_LOGOUT_NAVIGATOR, useValue: logoutNavigator },
        { provide: RealmDiscoveryService, useValue: realmDiscovery },
      ],
    });

    service = TestBed.inject(KeycloakAuthService);
  });

  afterEach(() => sessionStorage.clear());

  it('initializes the selected discovered tenant realm with Authorization Code and PKCE S256', async () => {
    initResult = true;

    await service.initialize({ type: 'tenant', realm: 'tenant-a-realm' });

    expect(factory.create).toHaveBeenCalledWith({
      url: config.keycloakUrl,
      realm: 'tenant-a-realm',
      clientId: config.clientId,
    });
    expect(client.init).toHaveBeenCalledWith({
      flow: 'standard',
      pkceMethod: 'S256',
    });
    expect(service.accessToken).toBe('keycloak-access-token');
  });

  it('uses only the configured connector realm for admin authentication', async () => {
    await service.initialize({ type: 'admin' });

    expect(factory.create).toHaveBeenCalledWith({
      url: config.keycloakUrl,
      realm: config.adminRealm,
      clientId: config.clientId,
    });
    expect(realmDiscovery.getTenantRealms).not.toHaveBeenCalled();
  });

  it('clears the previous adapter session before switching to a different trusted realm', async () => {
    const nextClient: KeycloakClient = {
      authenticated: false,
      init: jasmine.createSpy('nextInit').and.resolveTo(false),
      login: jasmine.createSpy('nextLogin').and.resolveTo(),
      updateToken: jasmine.createSpy('nextUpdateToken').and.resolveTo(false),
      createLogoutUrl: jasmine
        .createSpy('nextCreateLogoutUrl')
        .and.returnValue('https://keycloak.example/logout'),
      clearToken: jasmine.createSpy('nextClearToken'),
    };
    factory.create.and.returnValues(client, nextClient);

    await service.initialize({ type: 'admin' });
    (client.clearToken as jasmine.Spy).calls.reset();

    await service.initialize({ type: 'tenant', realm: 'tenant-a-realm' });

    expect(client.clearToken).toHaveBeenCalled();
  });

  it('rejects a tenant realm not returned by trusted discovery before creating a client', async () => {
    await expectAsync(
      service.initialize({ type: 'tenant', realm: 'untrusted-realm' })
    ).toBeRejectedWithError(/trusted tenant discovery/);

    expect(factory.create).not.toHaveBeenCalled();
    expect(service.isAuthenticated).toBeFalse();
  });

  it('processes the callback with the saved, revalidated realm selection', async () => {
    initResult = true;
    sessionStorage.setItem(
      KEYCLOAK_SELECTION_STORAGE_KEY,
      JSON.stringify({ type: 'tenant', realm: 'tenant-a-realm' })
    );

    await service.initSession();

    expect(realmDiscovery.getTenantRealms).toHaveBeenCalled();
    expect(factory.create).toHaveBeenCalledWith({
      url: config.keycloakUrl,
      realm: 'tenant-a-realm',
      clientId: config.clientId,
    });
    expect(service.accessToken).toBe('keycloak-access-token');
  });

  it('rejects an invalid callback and leaves the adapter unauthenticated', async () => {
    authenticated = true;
    token = 'stale-access-token';
    initError = new Error('Invalid state');

    await expectAsync(
      service.initialize({ type: 'admin' })
    ).toBeRejectedWithError('Invalid state');

    expect(service.isAuthenticated).toBeFalse();
    expect(service.accessToken).toBeNull();
    expect(client.clearToken).toHaveBeenCalled();
  });

  it('starts login with the agreed callback URI', async () => {
    await service.login({ type: 'tenant', realm: 'tenant-a-realm' });

    expect(client.login).toHaveBeenCalledWith({
      redirectUri: `${window.location.origin}/auth/callback`,
    });
  });

  it('returns the adapter token after proactive renewal', async () => {
    initResult = true;
    await service.initialize({ type: 'admin' });

    await expectAsync(service.getValidAccessToken(30)).toBeResolvedTo(
      'refreshed-keycloak-access-token'
    );

    expect(client.updateToken).toHaveBeenCalledWith(30);
  });

  it('clears the adapter session when token renewal fails', async () => {
    initResult = true;
    await service.initialize({ type: 'admin' });
    (client.updateToken as jasmine.Spy).and.rejectWith(
      new Error('refresh failed')
    );

    await expectAsync(service.getValidAccessToken()).toBeRejectedWithError(
      'refresh failed'
    );

    expect(service.isAuthenticated).toBeFalse();
    expect(service.accessToken).toBeNull();
    expect(client.clearToken).toHaveBeenCalled();
  });

  it('clears local state before navigating to the SDK-generated RP-Initiated Logout URL', async () => {
    initResult = true;
    await service.initialize({ type: 'admin' });
    sessionStorage.setItem(
      KEYCLOAK_SELECTION_STORAGE_KEY,
      JSON.stringify({ type: 'admin' })
    );

    (client.createLogoutUrl as jasmine.Spy).and.callFake(() => {
      expect(service.isAuthenticated).toBeTrue();
      return 'https://keycloak.example/logout?id_token_hint=active-token';
    });
    logoutNavigator.navigate.and.callFake((url) => {
      expect(url).toContain('id_token_hint=active-token');
      expect(client.clearToken).toHaveBeenCalled();
      expect(service.isAuthenticated).toBeFalse();
      expect(
        sessionStorage.getItem(KEYCLOAK_SELECTION_STORAGE_KEY)
      ).toBeNull();
    });

    await service.logout();

    expect(client.createLogoutUrl).toHaveBeenCalledWith({
      redirectUri: `${window.location.origin}/login`,
    });
    expect(logoutNavigator.navigate).toHaveBeenCalledWith(
      'https://keycloak.example/logout?id_token_hint=active-token'
    );
    expect(client.clearToken).toHaveBeenCalled();
    expect(sessionStorage.getItem(KEYCLOAK_SELECTION_STORAGE_KEY)).toBeNull();
  });

  it('clears local state if the SDK cannot create the logout URL', async () => {
    initResult = true;
    await service.initialize({ type: 'admin' });
    (client.createLogoutUrl as jasmine.Spy).and.throwError(
      'Could not create logout URL.'
    );

    await expectAsync(service.logout()).toBeRejectedWithError(
      'Could not create logout URL.'
    );

    expect(service.isAuthenticated).toBeFalse();
    expect(client.clearToken).toHaveBeenCalled();
    expect(logoutNavigator.navigate).not.toHaveBeenCalled();
  });
});
