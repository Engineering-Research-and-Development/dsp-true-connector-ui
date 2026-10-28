import { APP_INITIALIZER, ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { appConfig } from './app.config';
import { AuthService } from './services/auth/auth.service';

describe('app configuration', () => {
  const originalPath = window.location.pathname;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    window.history.replaceState({}, '', '/keycloak-test');
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'initSession',
    ]);
    authService.initSession.and.returnValue(of(null));
  });

  afterEach(() => {
    window.history.replaceState({}, '', originalPath);
    TestBed.resetTestingModule();
  });

  it('initializes only the production auth session on the former test-page path', async () => {
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        { provide: AuthService, useValue: authService },
      ],
    });

    expect(TestBed.inject(APP_INITIALIZER)).toHaveSize(1);
    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(authService.initSession).toHaveBeenCalledTimes(1);
    expect(authService.initSession).toHaveBeenCalledTimes(1);
  });
});
