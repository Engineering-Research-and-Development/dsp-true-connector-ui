import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRole } from '../../models/enums/user-role.enum';
import { ErrorHandlerService } from '../error-handler/error-handler.service';
import { SnackbarService } from '../snackbar/snackbar.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>;
  const apiUrl = environment.USER_API_URL();

  beforeEach(() => {
    const snackbarSpy = jasmine.createSpyObj('SnackbarService', [
      'openSnackBar',
    ]);
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'handleError',
    ]);

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    errorHandlerService = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;
    errorHandlerService.handleError.and.callFake((error) => {
      let errorMessage = '';
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      snackbarService.openSnackBar(
        `An error occurred: ${errorMessage}`,
        'OK',
        'center',
        'bottom',
        'snackbar-error'
      );
      return throwError(() => error);
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get users with filters and pagination', () => {
    const mockResponse = {
      response: {
        success: true,
        message: 'OK',
        data: {
          content: [],
          page: {
            size: 20,
            totalElements: 0,
            totalPages: 0,
            number: 0,
          },
          links: [],
        },
        timestamp: new Date().toISOString(),
      },
    };

    service
      .getUsers({ role: UserRole.ADMIN }, { page: 0, size: 20 })
      .subscribe((response) => {
        expect(response.response.data?.content).toEqual([]);
      });

    const req = httpMock.expectOne(
      (request) =>
        request.url === apiUrl &&
        request.params.get('role') === 'ADMIN' &&
        request.params.get('page') === '0'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create a user', () => {
    const request = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      tenantId: 't1',
    };

    service.createUser(request).subscribe((user) => {
      expect(user.email).toBe('john@example.com');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      message: 'User created',
      data: { ...request, id: '1', role: UserRole.ADMIN, enabled: true, expired: false, locked: false },
      timestamp: new Date().toISOString(),
    });
  });
});
