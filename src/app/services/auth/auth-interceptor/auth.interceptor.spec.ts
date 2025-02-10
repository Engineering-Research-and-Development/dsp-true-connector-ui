import {
  HttpHandlerFn,
  HttpHeaders,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  const mockNext: HttpHandlerFn = jasmine.createSpy('next');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(authInterceptor).toBeTruthy();
  });

  it('should add Authorization header with Basic auth token', () => {
    const req = new HttpRequest('GET', '/api/test');
    const expectedToken = btoa('admin@mail.com:password');

    authInterceptor(req, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const modifiedReq = (mockNext as jasmine.Spy).calls.mostRecent().args[0];
    expect(modifiedReq.headers.get('Authorization')).toBe(
      `Basic ${expectedToken}`
    );
  });

  it('should encode credentials correctly', () => {
    const req = new HttpRequest('GET', '/api/test');
    const expectedToken = btoa('admin@mail.com:password');

    authInterceptor(req, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const modifiedReq = (mockNext as jasmine.Spy).calls.mostRecent().args[0];
    const authHeader = modifiedReq.headers.get('Authorization');
    expect(authHeader).toBe(`Basic ${expectedToken}`);
    expect(atob(authHeader!.replace('Basic ', ''))).toBe(
      'admin@mail.com:password'
    );
  });

  it('should preserve existing headers when adding Authorization header', () => {
    const initialHeaders = new HttpHeaders().set(
      'Content-Type',
      'application/json'
    );
    const req = new HttpRequest('GET', '/api/test', null, {
      headers: initialHeaders,
    });

    authInterceptor(req, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const modifiedReq = (mockNext as jasmine.Spy).calls.mostRecent().args[0];
    expect(modifiedReq.headers.get('Content-Type')).toBe('application/json');
    expect(modifiedReq.headers.get('Authorization')).toBeTruthy();
  });

  it('should not modify request method or URL', () => {
    const req = new HttpRequest('POST', '/api/test', { data: 'test' });

    authInterceptor(req, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const modifiedReq = (mockNext as jasmine.Spy).calls.mostRecent().args[0];
    expect(modifiedReq.method).toBe('POST');
    expect(modifiedReq.url).toBe('/api/test');
    expect(modifiedReq.body).toEqual({ data: 'test' });
  });
});
