import { createAuthConfig, type RuntimeAuthSettings } from './auth-config';

describe('createAuthConfig', () => {
  const completeKeycloakSettings: RuntimeAuthSettings = {
    AUTH_PROVIDER: 'KEYCLOAK',
    KEYCLOAK_URL: 'http://localhost:8180/',
    KEYCLOAK_CLIENT_ID: 'keycloak-api',
    KEYCLOAK_ADMIN_REALM: 'connector-admin',
    PUBLIC_TENANT_API_URL: 'http://localhost:8080/public/tenant',
  };

  const internalSettings = {
    AUTH_PROVIDER: 'INTERNAL',
  };

  it('accepts INTERNAL settings without Keycloak values', () => {
    expect(createAuthConfig(internalSettings)).toEqual({
      provider: 'INTERNAL',
    });
  });

  it('defaults to INTERNAL when no provider is configured', () => {
    expect(createAuthConfig({})).toEqual({ provider: 'INTERNAL' });
  });

  it('accepts complete KEYCLOAK settings', () => {
    expect(createAuthConfig(completeKeycloakSettings)).toEqual({
      provider: 'KEYCLOAK',
      keycloakUrl: 'http://localhost:8180/',
      clientId: 'keycloak-api',
      adminRealm: 'connector-admin',
      publicTenantApiUrl: 'http://localhost:8080/public/tenant',
    });
  });

  const missingSettings: Array<{
    settingName: string;
    values: Partial<RuntimeAuthSettings>;
  }> = [
    { settingName: 'KEYCLOAK_URL', values: { KEYCLOAK_URL: '' } },
    { settingName: 'KEYCLOAK_CLIENT_ID', values: { KEYCLOAK_CLIENT_ID: '' } },
    { settingName: 'KEYCLOAK_ADMIN_REALM', values: { KEYCLOAK_ADMIN_REALM: '' } },
    {
      settingName: 'PUBLIC_TENANT_API_URL',
      values: { PUBLIC_TENANT_API_URL: '' },
    },
  ];

  missingSettings.forEach(({ settingName, values }) => {
    it(`rejects KEYCLOAK settings when ${settingName} is missing`, () => {
      expect(() =>
        createAuthConfig({
          ...completeKeycloakSettings,
          ...values,
        })
      ).toThrowError(new RegExp(settingName));
    });
  });

  it('rejects Keycloak URLs containing embedded credentials', () => {
    expect(() =>
      createAuthConfig({
        ...completeKeycloakSettings,
        KEYCLOAK_URL: 'https://user@example.com/',
      })
    ).toThrowError(/without embedded credentials/);
  });

  it('rejects an unsupported auth-provider value', () => {
    expect(() =>
      createAuthConfig({
        AUTH_PROVIDER: 'BASIC',
      })
    ).toThrowError(/AUTH_PROVIDER/);
  });
});
