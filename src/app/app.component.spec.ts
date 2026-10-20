import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth/auth.service';
import { UserRole } from './models/enums/user-role.enum';
import { User } from './models/user';
import { LogoTrimHelper } from './shared/utils/logo-trim.utils';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let accessTokenSubject: BehaviorSubject<string | null>;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockUser = (role: UserRole, overrides: Partial<User> = {}): User => ({
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role,
    tenantId: null,
    tenantName: null,
    enabled: true,
    expired: false,
    locked: false,
    ...overrides,
  });

  const login = (user: User) => {
    accessTokenSubject.next('valid-token');
    currentUserSubject.next(user);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  };

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
    login(mockUser(UserRole.SUPER_ADMIN));

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Connector configuration');
    expect(compiled.textContent).toContain('Tenant Management');
    expect(compiled.textContent).toContain('User management');
  }));

  it('should hide admin nav links for ADMIN', fakeAsync(() => {
    login(mockUser(UserRole.ADMIN));

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Connector configuration');
    expect(compiled.textContent).not.toContain('Tenant Management');
    expect(compiled.textContent).not.toContain('User management');
  }));

  it('should navigate to login on logout', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    authService.logout.and.returnValue(of(undefined));

    component.logout();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  describe('greeting', () => {
    it('should greet with name and tenant', fakeAsync(() => {
      login(mockUser(UserRole.ADMIN, { tenantName: 'ACME' }));

      const greeting = fixture.nativeElement.querySelector('.greeting');
      expect(greeting.textContent.trim()).toBe('Hello, John Doe (ACME)');
    }));

    it('should drop the tenant part when there is no tenant', fakeAsync(() => {
      login(mockUser(UserRole.SUPER_ADMIN));

      const greeting = fixture.nativeElement.querySelector('.greeting');
      expect(greeting.textContent.trim()).toBe('Hello, John Doe');
    }));

    it('should hide the greeting when there are no names', fakeAsync(() => {
      login(mockUser(UserRole.ADMIN, { firstName: '', lastName: '', tenantName: 'ACME' }));

      expect(fixture.nativeElement.querySelector('.greeting')).toBeNull();
    }));
  });

  describe('branding', () => {
    it('should render logos and label in order when all are present', fakeAsync(() => {
      component.showCompanyLogo = true;
      component.showProjectLogo = true;
      component.projectLabel = 'Data Space Pilot';
      login(mockUser(UserRole.ADMIN));

      const branding = fixture.nativeElement.querySelector('.branding') as HTMLElement;
      const children = Array.from(branding.children) as HTMLElement[];
      expect(
        children.map((el) => el.querySelector('img')?.getAttribute('src') ?? el.textContent?.trim())
      ).toEqual([
        'assets/img/company_logo.png',
        'assets/img/project_logo.png',
        'Data Space Pilot',
      ]);
    }));

    it('should render nothing when no logo or label is present', fakeAsync(() => {
      component.showCompanyLogo = false;
      component.showProjectLogo = false;
      component.projectLabel = '';
      login(mockUser(UserRole.ADMIN));

      expect(fixture.nativeElement.querySelector('.branding')).toBeNull();
      expect(fixture.nativeElement.querySelector('img')).toBeNull();
    }));

    it('should remove a logo that fails to load', fakeAsync(() => {
      component.showCompanyLogo = true;
      component.showProjectLogo = true;
      login(mockUser(UserRole.ADMIN));

      const projectLogo = fixture.nativeElement.querySelector('.branding__logo--project img');
      projectLogo.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.branding__logo--project')).toBeNull();
      expect(fixture.nativeElement.querySelector('.branding__logo')).not.toBeNull();
    }));

    it('should crop transparent padding and scale the lettering to the label capital height', () => {
      spyOn(LogoTrimHelper, 'measureLogo').and.returnValue({
        visible: { left: 20, top: 10, width: 140, height: 70 },
        text: { top: 40, height: 30 },
      });
      const image = { naturalWidth: 200, naturalHeight: 100 } as HTMLImageElement;

      component.trimLogo('project', image);

      expect(component.logoTrims.project).toEqual({
        frameWidth: 70,
        frameHeight: 30,
        frameClipPath: 'inset(0 0 -5px 0)',
        imageHeight: 50,
        imageLeft: -10,
        imageTop: -5,
      });
    });

    it('should scale a logo without lettering to the logo height, resting on its bottom', () => {
      spyOn(LogoTrimHelper, 'measureLogo').and.returnValue({
        visible: { left: 20, top: 10, width: 140, height: 70 },
        text: null,
      });
      const image = { naturalWidth: 200, naturalHeight: 100 } as HTMLImageElement;

      component.trimLogo('project', image);

      expect(component.logoTrims.project).toEqual({
        frameWidth: 70,
        frameHeight: 35,
        frameClipPath: 'inset(0 0 -0px 0)',
        imageHeight: 50,
        imageLeft: -10,
        imageTop: -5,
      });
    });

    it('should keep a logo with small lettering within the toolbar', () => {
      spyOn(LogoTrimHelper, 'measureLogo').and.returnValue({
        visible: { left: 0, top: 0, width: 100, height: 100 },
        text: { top: 40, height: 10 },
      });
      const image = { naturalWidth: 100, naturalHeight: 100 } as HTMLImageElement;

      component.trimLogo('project', image);

      expect(component.logoTrims.project?.imageHeight).toBe(48);
    });

    it('should leave a logo untrimmed when it cannot be measured', () => {
      spyOn(LogoTrimHelper, 'measureLogo').and.returnValue(null);

      component.trimLogo('project', {} as HTMLImageElement);

      expect(component.logoTrims.project).toBeUndefined();
    });
  });
});
