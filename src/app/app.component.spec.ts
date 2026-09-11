import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth/auth.service';
import { UserService } from './services/user/user.service';
import { UserRole } from './models/enums/user-role.enum';
import { User } from './models/user';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let userService: jasmine.SpyObj<UserService>;
  let accessTokenSubject: BehaviorSubject<string | null>;

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

  beforeEach(async () => {
    accessTokenSubject = new BehaviorSubject<string | null>(null);

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      accessToken$: accessTokenSubject.asObservable(),
      isAuthenticated: true,
    });
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getCurrentUser',
      'clearCurrentUser',
    ]);

    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show admin nav links for SUPER_ADMIN', fakeAsync(() => {
    userService.getCurrentUser.and.returnValue(
      of(mockUser(UserRole.SUPER_ADMIN))
    );
    accessTokenSubject.next('valid-token');

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Connector configuration');
    expect(compiled.textContent).toContain('Tenant Management');
    expect(compiled.textContent).toContain('User management');
  }));

  it('should hide admin nav links for ADMIN', fakeAsync(() => {
    userService.getCurrentUser.and.returnValue(of(mockUser(UserRole.ADMIN)));
    accessTokenSubject.next('valid-token');

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Connector configuration');
    expect(compiled.textContent).not.toContain('Tenant Management');
    expect(compiled.textContent).not.toContain('User management');
  }));

  it('should call clearCurrentUser on logout', () => {
    authService.logout.and.returnValue(of(undefined));
    component.logout();
    expect(userService.clearCurrentUser).toHaveBeenCalled();
  });
});
