import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from './services/auth/auth.service';

describe('AuthGuard', () => {
  let router: Router;
  let authenticated: boolean;

  beforeEach(() => {
    authenticated = false;
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        {
          provide: AuthService,
          useFactory: () => ({ isAuthenticated: authenticated }),
        },
        provideRouter([]),
      ],
    });
    router = TestBed.inject(Router);
  });

  it('keeps the protected local route as the login return path', () => {
    const result = TestBed.inject(AuthGuard).canActivate(
      {} as ActivatedRouteSnapshot,
      { url: '/catalog-browser?filter=recent' } as RouterStateSnapshot
    ) as UrlTree;

    expect(router.serializeUrl(result)).toBe(
      '/login?returnUrl=%2Fcatalog-browser%3Ffilter%3Drecent'
    );
  });

  it('replaces an unsafe return path with the dashboard', () => {
    const result = TestBed.inject(AuthGuard).canActivate(
      {} as ActivatedRouteSnapshot,
      { url: '//outside.example.test' } as RouterStateSnapshot
    ) as UrlTree;

    expect(router.serializeUrl(result)).toBe(
      '/login?returnUrl=%2Fdashboard'
    );
  });
});
