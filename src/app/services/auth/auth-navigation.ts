export const KEYCLOAK_RETURN_URL_STORAGE_KEY = 'keycloak_auth_return_url';
export const KEYCLOAK_CALLBACK_PATH = '/auth/callback';

export function safeLocalReturnUrl(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return '/dashboard';
  }

  try {
    const url = new URL(value, window.location.origin);
    const decodedPath = decodeURIComponent(url.pathname).replace(/\/+$/, '');
    if (
      url.origin !== window.location.origin ||
      decodedPath === KEYCLOAK_CALLBACK_PATH ||
      decodedPath.startsWith(`${KEYCLOAK_CALLBACK_PATH}/`)
    ) {
      return '/dashboard';
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/dashboard';
  }
}
