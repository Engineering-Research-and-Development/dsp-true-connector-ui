import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './services/auth/auth-interceptor/auth.interceptor';
import { AuthService } from './services/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Silently restore the access token from a persisted refresh token (if any) before the
    // router evaluates AuthGuard/LoginGuard on initial load, so a page reload doesn't force
    // the user to log in again while their refresh token is still valid.
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.initSession();
    }),
  ],
};
