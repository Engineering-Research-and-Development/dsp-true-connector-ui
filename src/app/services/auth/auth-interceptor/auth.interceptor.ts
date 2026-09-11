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
  if (AUTH_BYPASS_URLS.includes(req.url)) {
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

                return next(addAuthHeader(req, retryToken));
              })
            );
          }

          return throwError(() => error);
        })
      );
    })
  );
};

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: AUTH_SCHEME_PREFIX + token,
    },
  });
}
