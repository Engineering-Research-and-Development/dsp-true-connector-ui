import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { SnackbarService } from '../snackbar/snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor(private snackBarService: SnackbarService) {}

  /**
   * Handles HTTP errors and displays a snackbar message.
   * @param error The error object received from the HTTP request.
   * @returns An observable that emits no value and throws an error.
   */
  handleError(error: any) {
    console.log('ERR', error);
    let errorMessage = '';

    // Prioritize backend error messages
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    // Display a user-friendly snackbar
    this.snackBarService.openSnackBar(
      `An error occurred: ${errorMessage}`,
      'OK',
      'center',
      'bottom',
      'snackbar-error'
    );

    console.error(errorMessage);

    // Re-throw the error to be optionally handled by the calling service
    return throwError(() => new Error(errorMessage));
  }
}
