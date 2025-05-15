import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  let service: SnackbarService;
  let matSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        SnackbarService,
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    service = TestBed.inject(SnackbarService);
    matSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open snackbar with default parameters', () => {
    const message = 'Test message';
    const action = 'OK';

    service.openSnackBar(message, action);

    expect(matSnackBar.open).toHaveBeenCalledWith(message, action, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'snackbar-success',
    });
  });

  it('should open snackbar with custom horizontal position', () => {
    const message = 'Test message';
    const action = 'OK';
    const hPosition = 'left';

    service.openSnackBar(message, action, hPosition);

    expect(matSnackBar.open).toHaveBeenCalledWith(message, action, {
      duration: 5000,
      horizontalPosition: 'left',
      verticalPosition: 'bottom',
      panelClass: 'snackbar-success',
    });
  });

  it('should open snackbar with custom vertical position', () => {
    const message = 'Test message';
    const action = 'OK';
    const hPosition = 'center';
    const vPosition = 'top';

    service.openSnackBar(message, action, hPosition, vPosition);

    expect(matSnackBar.open).toHaveBeenCalledWith(message, action, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: 'snackbar-success',
    });
  });

  it('should open snackbar with custom class name', () => {
    const message = 'Test message';
    const action = 'OK';
    const hPosition = 'center';
    const vPosition = 'bottom';
    const className = 'snackbar-error';

    service.openSnackBar(message, action, hPosition, vPosition, className);

    expect(matSnackBar.open).toHaveBeenCalledWith(message, action, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'snackbar-error',
    });
  });

  it('should open snackbar with all custom parameters', () => {
    const message = 'Test message';
    const action = 'OK';
    const hPosition = 'right';
    const vPosition = 'top';
    const className = 'snackbar-warning';

    service.openSnackBar(message, action, hPosition, vPosition, className);

    expect(matSnackBar.open).toHaveBeenCalledWith(message, action, {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: 'snackbar-warning',
    });
  });

  it('should handle empty message and action', () => {
    const message = '';
    const action = '';

    service.openSnackBar(message, action);

    expect(matSnackBar.open).toHaveBeenCalledWith(message, action, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'snackbar-success',
    });
  });

  it('should handle undefined optional parameters', () => {
    const message = 'Test message';
    const action = 'OK';

    service.openSnackBar(message, action, undefined, undefined, undefined);

    expect(matSnackBar.open).toHaveBeenCalledWith(message, action, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'snackbar-success',
    });
  });
});
