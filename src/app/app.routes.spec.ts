import { routes } from './app.routes';

describe('app routes', () => {
  it('keeps the production callback public and removes the isolated Keycloak test route', () => {
    const callbackRoute = routes.find(({ path }) => path === 'auth/callback');

    expect(callbackRoute).toBeDefined();
    expect(callbackRoute?.canActivate).toBeUndefined();
    expect(callbackRoute?.canActivateChild).toBeUndefined();
    expect(routes.some(({ path }) => path === 'keycloak-test')).toBeFalse();
  });
});
