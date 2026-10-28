import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth/auth.service';
import { UserRole } from './models/enums/user-role.enum';
import { User } from './models/user';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let accessTokenSubject: BehaviorSubject<string | null>;
  let currentUserSubject: BehaviorSubject<User | null>;

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
    currentUserSubject = new BehaviorSubject<User | null>(null);

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      accessToken$: accessTokenSubject.asObservable(),
      currentUser$: currentUserSubject.asObservable(),
      isAuthenticated: true,
    });

    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show admin nav links for SUPER_ADMIN', fakeAsync(() => {
    currentUserSubject.next(mockUser(UserRole.SUPER_ADMIN));
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
    currentUserSubject.next(mockUser(UserRole.ADMIN));
    accessTokenSubject.next('valid-token');

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Connector configuration');
    expect(compiled.textContent).not.toContain('Tenant Management');
    expect(compiled.textContent).not.toContain('User management');
  }));

  it('clears the displayed user and logs out', () => {
    authService.logout.and.returnValue(of(undefined));
    component.currentUser = mockUser(UserRole.ADMIN);

    component.logout();

    expect(component.currentUser).toBeNull();
    expect(authService.logout).toHaveBeenCalled();
  });
});
