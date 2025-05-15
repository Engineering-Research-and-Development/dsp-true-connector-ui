import { TestBed } from '@angular/core/testing';
import { SnackbarService } from '../snackbar/snackbar.service';
import { ErrorHandlerService } from './error-handler.service';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  beforeEach(() => {
    const snackbarSpy = jasmine.createSpyObj('SnackbarService', [
      'openSnackBar',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ErrorHandlerService,
        { provide: SnackbarService, useValue: snackbarSpy },
      ],
    });

    service = TestBed.inject(ErrorHandlerService);
    snackbarService = TestBed.inject(
      SnackbarService
    ) as jasmine.SpyObj<SnackbarService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle ErrorEvent', () => {
    const errorEvent = new ErrorEvent('TestError', {
      message: 'Test error message',
    });
    const error = { error: errorEvent };

    service.handleError(error).subscribe({
      error: (err) => {
        expect(err.message).toBe('Test error message');
      },
    });

    expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
      'An error occurred: Test error message',
      'OK',
      'center',
      'bottom',
      'snackbar-error'
    );
  });

  it('should handle error with error.message', () => {
    const error = {
      error: {
        message: 'Backend error message',
      },
    };

    service.handleError(error).subscribe({
      error: (err) => {
        expect(err.message).toBe('Backend error message');
      },
    });

    expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
      'An error occurred: Backend error message',
      'OK',
      'center',
      'bottom',
      'snackbar-error'
    );
  });

  it('should handle HTTP error with status code', () => {
    const error = {
      status: 404,
      message: 'Not Found',
    };

    service.handleError(error).subscribe({
      error: (err) => {
        expect(err.message).toBe('Error Code: 404\nMessage: Not Found');
      },
    });

    expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
      'An error occurred: Error Code: 404\nMessage: Not Found',
      'OK',
      'center',
      'bottom',
      'snackbar-error'
    );
  });

  it('should handle error with null error object', () => {
    const error = {
      status: 500,
      message: 'Internal Server Error',
      error: null,
    };

    service.handleError(error).subscribe({
      error: (err) => {
        expect(err.message).toBe(
          'Error Code: 500\nMessage: Internal Server Error'
        );
      },
    });

    expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
      'An error occurred: Error Code: 500\nMessage: Internal Server Error',
      'OK',
      'center',
      'bottom',
      'snackbar-error'
    );
  });

  it('should handle error with undefined properties', () => {
    const error = {};

    service.handleError(error).subscribe({
      error: (err) => {
        expect(err.message).toBe('Error Code: undefined\nMessage: undefined');
      },
    });

    expect(snackbarService.openSnackBar).toHaveBeenCalledWith(
      'An error occurred: Error Code: undefined\nMessage: undefined',
      'OK',
      'center',
      'bottom',
      'snackbar-error'
    );
  });

  it('should console.error the error message', () => {
    const consoleSpy = spyOn(console, 'error');
    const error = {
      status: 500,
      message: 'Test error',
    };

    service.handleError(error).subscribe({
      error: () => {},
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error Code: 500\nMessage: Test error'
    );
  });

  it('should log error details to console', () => {
    const consoleSpy = spyOn(console, 'log');
    const error = {
      status: 500,
      message: 'Test error',
    };

    service.handleError(error).subscribe({
      error: () => {},
    });

    expect(consoleSpy).toHaveBeenCalledWith('ERR', error);
  });
});
