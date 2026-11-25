import { publicTenantApiUrl } from './environment-urls';
import { environment as connectorA } from './environment.connectorA';
import { environment as connectorB } from './environment.connectorB';

describe('public tenant discovery URLs', () => {
  it('uses the connector root rather than appending to the versioned API path', () => {
    expect(connectorA.PUBLIC_TENANT_API_URL()).toBe(
      'http://localhost:8080/public/tenant'
    );
    expect(connectorB.PUBLIC_TENANT_API_URL()).toBe(
      'http://localhost:8090/public/tenant'
    );
  });

  it('preserves a connector prefix when deriving a same-origin proxy URL', () => {
    expect(publicTenantApiUrl('/connector-a/api/v1/')).toBe(
      '/connector-a/public/tenant'
    );
    expect(publicTenantApiUrl('/connector-b/api/v1')).toBe(
      '/connector-b/public/tenant'
    );
  });
});
