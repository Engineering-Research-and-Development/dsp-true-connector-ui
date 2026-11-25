import { inject, Injectable, InjectionToken } from '@angular/core';
import Keycloak, {
  KeycloakConfig,
  KeycloakInitOptions,
  KeycloakLoginOptions,
  KeycloakLogoutOptions,
} from 'keycloak-js';
import { firstValueFrom } from 'rxjs';
import { AUTH_CONFIG, AuthConfig, KeycloakAuthConfig } from './auth-config';
import { KEYCLOAK_CALLBACK_PATH } from './auth-navigation';
import { RealmDiscoveryService } from './realm-discovery.service';

export interface KeycloakClient {
  authenticated: boolean;
  token?: string;
  init(options?: KeycloakInitOptions): Promise<boolean>;
  login(options?: KeycloakLoginOptions): Promise<void>;
  updateToken(minValidity?: number): Promise<boolean>;
  createLogoutUrl(options?: KeycloakLogoutOptions): string;
  clearToken(): void;
}

export interface KeycloakClientFactory {
  create(config: KeycloakConfig): KeycloakClient;
}

export interface KeycloakLogoutNavigator {
  navigate(url: string): void;
}

export const KEYCLOAK_CLIENT_FACTORY =
  new InjectionToken<KeycloakClientFactory>('KEYCLOAK_CLIENT_FACTORY', {
    providedIn: 'root',
    factory: () => ({
      create: (config) => new Keycloak(config),
    }),
  });

export const KEYCLOAK_LOGOUT_NAVIGATOR =
  new InjectionToken<KeycloakLogoutNavigator>('KEYCLOAK_LOGOUT_NAVIGATOR', {
    providedIn: 'root',
    factory: () => ({
      navigate: (url) => window.location.replace(url),
    }),
  });

export type KeycloakLoginSelection =
  | { type: 'tenant'; realm: string }
  | { type: 'admin' };

export const KEYCLOAK_SELECTION_STORAGE_KEY = 'keycloak_auth_selection';
const POST_LOGOUT_PATH = '/login';

@Injectable({ providedIn: 'root' })
export class KeycloakAuthService {
  private readonly config = inject(AUTH_CONFIG);
  private readonly clientFactory = inject(KEYCLOAK_CLIENT_FACTORY);
  private readonly logoutNavigator = inject(KEYCLOAK_LOGOUT_NAVIGATOR);
  private readonly realmDiscovery = inject(RealmDiscoveryService);

  private client: KeycloakClient | null = null;
  private activeRealm: string | null = null;
  private initialized = false;
  private initialization: Promise<string | null> | null = null;
  private initializationSelection: string | null = null;
  private initializationError: unknown = null;

  get accessToken(): string | null {
    return this.isAuthenticated ? this.client?.token ?? null : null;
  }

  get isAuthenticated(): boolean {
    return this.client?.authenticated === true && !!this.client.token;
  }

  get lastError(): unknown {
    return this.initializationError;
  }

  initSession(): Promise<string | null> {
    return this.initialize();
  }

  async initialize(
    selection?: KeycloakLoginSelection
  ): Promise<string | null> {
    const storedSelection = selection ?? this.readStoredSelection();
    if (!storedSelection) {
      return null;
    }

    const selectionKey = JSON.stringify(storedSelection);
    if (
      this.initialization &&
      this.initializationSelection === selectionKey
    ) {
      return this.initialization;
    }

    const initialization = this.initializeSelection(storedSelection);
    this.initialization = initialization;
    this.initializationSelection = selectionKey;

    try {
      return await initialization;
    } finally {
      if (this.initialization === initialization) {
        this.initialization = null;
        this.initializationSelection = null;
      }
    }
  }

  async login(selection: KeycloakLoginSelection): Promise<string | null> {
    const token = await this.initialize(selection);
    if (token) {
      return token;
    }

    const client = this.client;
    if (!client) {
      throw new Error('Keycloak could not initialize the selected realm.');
    }

    try {
      await client.login({
        redirectUri: `${window.location.origin}${KEYCLOAK_CALLBACK_PATH}`,
      });
      return null;
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  async getValidAccessToken(minValiditySeconds = 10): Promise<string | null> {
    const client = this.client;
    if (!client || !this.isAuthenticated) {
      return null;
    }

    try {
      await client.updateToken(minValiditySeconds);
      if (!client.authenticated || !client.token) {
        throw new Error('Keycloak did not return an authenticated access token.');
      }
      return client.token;
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    const client = this.client;
    this.removeStoredSelection();

    if (!client) {
      return;
    }

    let logoutUrl: string;
    try {
      logoutUrl = client.createLogoutUrl({
        redirectUri: `${window.location.origin}${POST_LOGOUT_PATH}`,
      });
    } finally {
      client.clearToken();
      this.resetClient();
    }

    this.logoutNavigator.navigate(logoutUrl);
  }

  private async initializeSelection(
    selection: KeycloakLoginSelection
  ): Promise<string | null> {
    try {
      const { config, realm } = await this.resolveTrustedRealm(selection);
      this.storeSelection(selection);

      if (this.activeRealm === realm && this.initialized) {
        return this.accessToken;
      }

      this.client?.clearToken();
      this.resetClient();
      const client = this.clientFactory.create({
        url: config.keycloakUrl,
        realm,
        clientId: config.clientId,
      });
      this.client = client;
      this.activeRealm = realm;

      const authenticated = await client.init({
        // Re-enable after adding a dedicated silent-check callback.
        // onLoad: 'check-sso',
        flow: 'standard',
        pkceMethod: 'S256',
      });
      this.initialized = true;
      this.initializationError = null;

      if (!authenticated || !client.authenticated || !client.token) {
        client.clearToken();
        return null;
      }

      return client.token;
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  private async resolveTrustedRealm(
    selection: KeycloakLoginSelection
  ): Promise<{ config: KeycloakAuthConfig; realm: string }> {
    const config = this.getKeycloakConfig();

    if (selection.type === 'admin') {
      return { config, realm: config.adminRealm };
    }

    if (
      selection.type !== 'tenant' ||
      typeof selection.realm !== 'string' ||
      selection.realm.trim().length === 0
    ) {
      throw new Error('A valid tenant realm selection is required.');
    }

    const tenantRealms = await firstValueFrom(
      this.realmDiscovery.getTenantRealms()
    );
    const tenant = tenantRealms.find(
      ({ realm }) => realm === selection.realm
    );
    if (!tenant) {
      throw new Error('The selected realm is not in trusted tenant discovery.');
    }

    return { config, realm: tenant.realm };
  }

  private getKeycloakConfig(): KeycloakAuthConfig {
    const config: AuthConfig = this.config;
    if (config.provider !== 'KEYCLOAK') {
      throw new Error('Keycloak authentication is not enabled.');
    }
    return config;
  }

  private readStoredSelection(): KeycloakLoginSelection | null {
    const storage = this.getSessionStorage();
    const serialized = storage?.getItem(KEYCLOAK_SELECTION_STORAGE_KEY);
    if (!serialized) {
      return null;
    }

    try {
      const selection: unknown = JSON.parse(serialized);
      if (isRecord(selection) && selection['type'] === 'admin') {
        return { type: 'admin' };
      }
      if (
        isRecord(selection) &&
        selection['type'] === 'tenant' &&
        typeof selection['realm'] === 'string' &&
        selection['realm'].trim().length > 0
      ) {
        return { type: 'tenant', realm: selection['realm'] };
      }
    } catch {
      this.removeStoredSelection();
    }

    this.removeStoredSelection();
    throw new Error('The stored Keycloak realm selection is invalid.');
  }

  private storeSelection(selection: KeycloakLoginSelection): void {
    this.getSessionStorage()?.setItem(
      KEYCLOAK_SELECTION_STORAGE_KEY,
      JSON.stringify(selection)
    );
  }

  private removeStoredSelection(): void {
    this.getSessionStorage()?.removeItem(KEYCLOAK_SELECTION_STORAGE_KEY);
  }

  private getSessionStorage(): Storage | null {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  }

  private fail(error: unknown): void {
    this.initializationError = error;
    this.client?.clearToken();
    this.resetClient();
    this.removeStoredSelection();
  }

  private resetClient(): void {
    this.client = null;
    this.activeRealm = null;
    this.initialized = false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
