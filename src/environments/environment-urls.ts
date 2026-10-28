export function publicTenantApiUrl(apiRootUrl: string): string {
  const normalizedApiRoot = apiRootUrl.replace(/\/+$/, '');
  const connectorRoot = normalizedApiRoot.replace(/\/api\/v1$/, '');
  return `${connectorRoot}/public/tenant`;
}
