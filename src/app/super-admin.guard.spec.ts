import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SuperAdminGuard } from './super-admin.guard';
import { UserRole } from './models/enums/user-role.enum';
import { User } from './models/user';
import { UserService } from './services/user/user.service';

describe('SuperAdminGuard', () => {
  let guard: SuperAdminGuard;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser = (role: UserRole): User => ({
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role,
    tenantId: null,
    enabled: true,
    expired: false,
    locked: false,
  });

  beforeEach(() => {
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getCurrentUser',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        SuperAdminGuard,
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(SuperAdminGuard);
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    router.createUrlTree.and.callFake((commands: any[]) => {
      return { url: commands.join('/') } as unknown as UrlTree;
    });
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access for SUPER_ADMIN', (done) => {
    userService.getCurrentUser.and.returnValue(of(mockUser(UserRole.SUPER_ADMIN)));

    guard.canActivate({} as any, {} as any).subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it('should redirect to /dashboard for ADMIN', (done) => {
    userService.getCurrentUser.and.returnValue(of(mockUser(UserRole.ADMIN)));

    guard.canActivate({} as any, {} as any).subscribe((result) => {
      expect(result).toEqual(router.createUrlTree(['/dashboard']));
      done();
    });
  });

  it('should redirect to /dashboard when getCurrentUser fails', (done) => {
    userService.getCurrentUser.and.returnValue(throwError(() => new Error('failed')));

    guard.canActivate({} as any, {} as any).subscribe((result) => {
      expect(result).toEqual(router.createUrlTree(['/dashboard']));
      done();
    });
  });

  it('should apply the same check for child routes', (done) => {
    userService.getCurrentUser.and.returnValue(of(mockUser(UserRole.SUPER_ADMIN)));

    guard.canActivateChild({} as any, {} as any).subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });
});
