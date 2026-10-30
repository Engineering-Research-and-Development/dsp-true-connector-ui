import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import { LoginGuard } from './login.guard';

describe('LoginGuard', () => {
  let router: Router;
  let authenticated: boolean;

  beforeEach(() => {
    authenticated = true;
    TestBed.configureTestingModule({
      providers: [
        LoginGuard,
        {
          provide: AuthService,
          useFactory: () => ({ isAuthenticated: authenticated }),
        },
        provideRouter([]),
      ],
    });
    router = TestBed.inject(Router);
  });

  it('preserves a safe requested route when an authenticated user visits login', () => {
    const result = TestBed.inject(LoginGuard).canActivate(
      {
        queryParams: { returnUrl: '/catalog-browser?filter=recent' },
      } as unknown as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot
    ) as UrlTree;

    expect(router.serializeUrl(result)).toBe(
      '/catalog-browser?filter=recent'
    );
  });

  it('rejects an unsafe requested route for an authenticated user', () => {
    const result = TestBed.inject(LoginGuard).canActivate(
      {
        queryParams: { returnUrl: '//outside.example.test' },
      } as unknown as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot
    ) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/dashboard');
  });
});
