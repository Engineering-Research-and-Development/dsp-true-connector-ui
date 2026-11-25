import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface InternalAuthConfig {
  provider: 'INTERNAL';
}

export interface KeycloakAuthConfig {
  provider: 'KEYCLOAK';
  keycloakUrl: string;
  clientId: string;
  adminRealm: string;
  publicTenantApiUrl: string;
}

export type AuthConfig = InternalAuthConfig | KeycloakAuthConfig;
export type AuthProvider = AuthConfig['provider'];

export interface RuntimeAuthSettings {
  AUTH_PROVIDER?: unknown;
  KEYCLOAK_URL?: unknown;
  KEYCLOAK_CLIENT_ID?: unknown;
  KEYCLOAK_ADMIN_REALM?: unknown;
  PUBLIC_TENANT_API_URL?: string | (() => string);
}

export function createAuthConfig(
  settings: RuntimeAuthSettings
): AuthConfig {
  const provider = settings.AUTH_PROVIDER ?? 'INTERNAL';

  if (provider === 'INTERNAL') {
    return { provider };
  }

  if (provider !== 'KEYCLOAK') {
    throw new Error(
      `Unsupported AUTH_PROVIDER "${String(provider)}". Use INTERNAL or KEYCLOAK.`
    );
  }

  const keycloakUrl = requiredString(settings.KEYCLOAK_URL, 'KEYCLOAK_URL');
  validateAbsoluteHttpUrl(keycloakUrl, 'KEYCLOAK_URL');

  const clientId = requiredString(
    settings.KEYCLOAK_CLIENT_ID,
    'KEYCLOAK_CLIENT_ID'
  );
  const adminRealm = requiredString(
    settings.KEYCLOAK_ADMIN_REALM,
    'KEYCLOAK_ADMIN_REALM'
  );
  const publicTenantApiUrl = resolveTenantApiUrl(
    settings.PUBLIC_TENANT_API_URL
  );

  if (!publicTenantApiUrl) {
    throw new Error(
      'KEYCLOAK requires a configured PUBLIC_TENANT_API_URL.'
    );
  }
  validateTenantApiUrl(publicTenantApiUrl);

  return {
    provider,
    keycloakUrl,
    clientId,
    adminRealm,
    publicTenantApiUrl,
  };
}

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG', {
  providedIn: 'root',
  factory: () => createAuthConfig(environment),
});

function requiredString(value: unknown, settingName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `KEYCLOAK authentication requires a non-empty ${settingName}.`
    );
  }

  return value.trim();
}

function validateAbsoluteHttpUrl(value: string, settingName: string): void {
  try {
    const url = new URL(value);
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username ||
      url.password
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      `${settingName} must be an absolute HTTP or HTTPS URL without embedded credentials.`
    );
  }
}

function validateTenantApiUrl(value: string): void {
  if (value.startsWith('/') && !value.startsWith('//')) {
    return;
  }

  validateAbsoluteHttpUrl(value, 'PUBLIC_TENANT_API_URL');
}

function resolveTenantApiUrl(
  value: RuntimeAuthSettings['PUBLIC_TENANT_API_URL']
): string | undefined {
  const resolvedValue = typeof value === 'function' ? value() : value;
  return typeof resolvedValue === 'string' ? resolvedValue.trim() : undefined;
}
