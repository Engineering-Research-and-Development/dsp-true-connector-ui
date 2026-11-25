import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth.service';

// Requests to these auth endpoints must never go through the token-attach/expiry-check/retry
// logic below: /login has no token yet, and /refresh and /logout only need the refresh token in
// their request body, not an Authorization header. Bypassing them also prevents recursive
// refresh-triggered-by-refresh loops.
const AUTH_BYPASS_URLS = [
  `${environment.AUTH_API_URL()}/login`,
  `${environment.AUTH_API_URL()}/refresh`,
  `${environment.AUTH_API_URL()}/logout`,
];

const AUTH_SCHEME_PREFIX = 'Bearer' + ' ';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (
    AUTH_BYPASS_URLS.includes(req.url) ||
    !isConnectorApiRequest(req.url)
  ) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getValidAccessToken().pipe(
    switchMap(token => {
      const authReq = token ? addAuthHeader(req, token) : req;

      return next(authReq).pipe(
        catchError((error: unknown) => {
          // Reactive fallback: the proactive expiry check above should normally prevent a 401,
          // but clock skew or server-side early revocation can still cause one. Force exactly
          // one refresh-and-retry cycle before giving up and redirecting to the login screen.
          if (error instanceof HttpErrorResponse && error.status === 401 && token) {
            return authService.forceRefresh().pipe(
              switchMap(retryToken => {
                if (!retryToken) {
                  router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
                  return throwError(() => error);
                }

                return next(addAuthHeader(req, retryToken)).pipe(
                  catchError((retryError: unknown) => {
                    if (
                      retryError instanceof HttpErrorResponse &&
                      retryError.status === 401
                    ) {
                      authService.logout().subscribe({
                        complete: () =>
                          router.navigate(['/login'], {
                            queryParams: { returnUrl: router.url },
                          }),
                        error: () =>
                          router.navigate(['/login'], {
                            queryParams: { returnUrl: router.url },
                          }),
                      });
                    }
                    return throwError(() => retryError);
                  })
                );
              })
            );
          }

          return throwError(() => error);
        })
      );
    })
  );
};

function isConnectorApiRequest(url: string): boolean {
  try {
    const requestUrl = resolveUrl(url);
    if (
      matchesConfiguredPath(requestUrl, environment.PUBLIC_TENANT_API_URL()) ||
      isKeycloakUrl(requestUrl)
    ) {
      return false;
    }

    const baseUrl = resolveUrl(environment.TC_ROOT_API_URL);

    return (
      requestUrl.origin === baseUrl.origin &&
      isPathWithin(requestUrl.pathname, baseUrl.pathname)
    );
  } catch {
    return false;
  }
}

function isKeycloakUrl(requestUrl: URL): boolean {
  try {
    const keycloakUrl = resolveUrl(environment.KEYCLOAK_URL);
    if (requestUrl.origin !== keycloakUrl.origin) {
      return false;
    }

    if (keycloakUrl.pathname !== '/') {
      return isPathWithin(requestUrl.pathname, keycloakUrl.pathname);
    }

    return /^\/(realms|resources|admin|protocol)(\/|$)/.test(
      requestUrl.pathname
    );
  } catch {
    return false;
  }
}

function matchesConfiguredPath(requestUrl: URL, configuredUrl: string): boolean {
  const configured = resolveUrl(configuredUrl);
  return (
    requestUrl.origin === configured.origin &&
    requestUrl.pathname.replace(/\/+$/, '') ===
      configured.pathname.replace(/\/+$/, '')
  );
}

function isPathWithin(requestPath: string, basePath: string): boolean {
  const normalizedBasePath = basePath.replace(/\/+$/, '') || '/';
  return (
    requestPath === normalizedBasePath ||
    requestPath.startsWith(
      normalizedBasePath === '/' ? '/' : `${normalizedBasePath}/`
    )
  );
}

function resolveUrl(url: string): URL {
  return new URL(
    url,
    typeof document === 'undefined' ? 'http://localhost' : document.baseURI
  );
}

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: AUTH_SCHEME_PREFIX + token,
    },
  });
}
