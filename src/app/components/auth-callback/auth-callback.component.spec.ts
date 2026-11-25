import { Location } from '@angular/common';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { routes } from '../../app.routes';

describe('Auth callback route', () => {
  let authService: {
    initSession: jasmine.Spy;
    isAuthenticated: boolean;
  };
  let router: jasmine.SpyObj<Router>;
  let location: jasmine.SpyObj<Location>;

  beforeEach(() => {
    sessionStorage.clear();
    authService = {
      initSession: jasmine.createSpy('initSession').and.returnValue(
        of('keycloak-access-token')
      ),
      isAuthenticated: true,
    };
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);
    location = jasmine.createSpyObj<Location>('Location', ['replaceState']);
  });

  afterEach(() => sessionStorage.clear());

  it('is public and registered at the agreed callback path', () => {
    const callbackRoute = routes.find(
      (route) => route.path === 'auth/callback'
    );

    expect(callbackRoute).toBeDefined();
    expect(callbackRoute?.canActivate).toBeUndefined();
    expect(callbackRoute?.canActivateChild).toBeUndefined();
  });

  it('initializes the selected session and replaces the callback with the safe local return route', async () => {
    sessionStorage.setItem(
      'keycloak_auth_selection',
      JSON.stringify({ type: 'admin' })
    );
    sessionStorage.setItem(
      'keycloak_auth_return_url',
      '/catalog-browser?filter=recent'
    );

    const fixture = await createCallback();
    if (!fixture) {
      return;
    }

    expect(authService.initSession).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      '/catalog-browser?filter=recent',
      { replaceUrl: true }
    );
    expect(sessionStorage.getItem('keycloak_auth_selection')).toBe(
      JSON.stringify({ type: 'admin' })
    );
    expect(sessionStorage.getItem('keycloak_auth_return_url')).toBeNull();
  });

  it('does not initialize Keycloak when the saved selection is missing', async () => {
    sessionStorage.setItem('keycloak_auth_return_url', '/catalog-browser');
    authService.isAuthenticated = false;

    const fixture = await createCallback();
    if (!fixture) {
      return;
    }

    expect(authService.initSession).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Sign-in could not be completed'
    );
    expect(
      fixture.nativeElement.querySelector('[data-testid="return-to-login"]')
    ).toBeTruthy();
    expect(sessionStorage.getItem('keycloak_auth_return_url')).toBeNull();
    expect(location.replaceState).toHaveBeenCalledWith(
      '/auth/callback'
    );

    const returnButton = fixture.nativeElement.querySelector(
      '[data-testid="return-to-login"]'
    ) as HTMLButtonElement;
    returnButton.click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login', {
      replaceUrl: true,
    });
  });

  it('leaves the session unauthenticated after an invalid saved selection', async () => {
    sessionStorage.setItem('keycloak_auth_selection', 'invalid');
    authService.initSession.and.returnValue(of(null));
    authService.isAuthenticated = false;

    const fixture = await createCallback();
    if (!fixture) {
      return;
    }

    expect(authService.initSession).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Sign-in could not be completed'
    );
    expect(sessionStorage.getItem('keycloak_auth_selection')).toBeNull();
  });

  it('shows a recoverable failure when Keycloak rejects the callback', async () => {
    sessionStorage.setItem(
      'keycloak_auth_selection',
      JSON.stringify({ type: 'admin' })
    );
    authService.initSession.and.returnValue(of(null));
    authService.isAuthenticated = false;

    const fixture = await createCallback();
    if (!fixture) {
      return;
    }

    expect(fixture.nativeElement.textContent).toContain(
      'Sign-in could not be completed'
    );
    expect(
      fixture.nativeElement.querySelector('[data-testid="return-to-login"]')
    ).toBeTruthy();
    expect(sessionStorage.getItem('keycloak_auth_selection')).toBeNull();
    expect(location.replaceState).toHaveBeenCalledWith('/auth/callback');
  });

  it('falls back to the dashboard instead of navigating to an unsafe saved route', async () => {
    sessionStorage.setItem(
      'keycloak_auth_selection',
      JSON.stringify({ type: 'admin' })
    );
    sessionStorage.setItem(
      'keycloak_auth_return_url',
      '//outside.example.test/'
    );

    const fixture = await createCallback();
    if (!fixture) {
      return;
    }

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard', {
      replaceUrl: true,
    });
  });

  async function createCallback(): Promise<ComponentFixture<unknown> | null> {
    const callbackRoute = routes.find(
      (route) => route.path === 'auth/callback'
    );
    expect(callbackRoute?.loadComponent).toBeDefined();
    if (!callbackRoute?.loadComponent) {
      return null;
    }

    const componentType = (await callbackRoute.loadComponent()) as Type<unknown>;
    await TestBed.configureTestingModule({
      imports: [componentType],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: Location, useValue: location },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(componentType);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
});
