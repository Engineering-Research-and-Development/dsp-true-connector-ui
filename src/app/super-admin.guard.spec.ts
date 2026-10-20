import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { SuperAdminGuard } from './super-admin.guard';
import { AuthService } from './services/auth/auth.service';

describe('SuperAdminGuard', () => {
  let guard: SuperAdminGuard;
  let authService: { isSuperAdmin: boolean };
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = { isSuperAdmin: false };
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        SuperAdminGuard,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(SuperAdminGuard);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    router.createUrlTree.and.callFake((commands: any[]) => {
      return { url: commands.join('/') } as unknown as UrlTree;
    });
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access for SUPER_ADMIN', () => {
    authService.isSuperAdmin = true;

    expect(guard.canActivate({} as any, {} as any)).toBeTrue();
  });

  it('should redirect to /dashboard for non super admins', () => {
    authService.isSuperAdmin = false;

    expect(guard.canActivate({} as any, {} as any)).toEqual(
      router.createUrlTree(['/dashboard'])
    );
  });

  it('should apply the same check for child routes', () => {
    authService.isSuperAdmin = true;

    expect(guard.canActivateChild({} as any, {} as any)).toBeTrue();
  });
});
