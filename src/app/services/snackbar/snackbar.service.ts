import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  /**
   * Constructs the SnackbarService with an injected MatSnackBar dependency from Angular Material.
   * @param matSnackBar - The MatSnackBar instance used to display snackbars.
   */
  constructor(private matSnackBar: MatSnackBar) {}

  /**
   * Opens a snackbar with the specified message and action. Additional parameters allow
   * for customizing the snackbar's position and styling.
   *
   * @param message The message text to display in the snackbar.
   * @param action The label for the snackbar's action button. This can be used to give users
   *               an option to interact with the snackbar, such as undoing an action or
   *               retrying a failed operation.
   * @param hPosition (optional) The horizontal position of the snackbar. Possible values are
   *                  'start', 'center', 'end', 'left', and 'right'. If not specified, defaults
   *                  to 'center'.
   * @param vPosition (optional) The vertical position of the snackbar. Possible values are
   *                  'top' and 'bottom'. If not specified, defaults to 'bottom'.
   * @param className (optional) A custom CSS class to apply to the snackbar for styling purposes.
   *                  If not specified, defaults to 'custom-snackbar', which should be defined
   *                  in the global or component-specific styles.
   */
  openSnackBar(
    message: string,
    action: string,
    hPosition?: any,
    vPosition?: any,
    className?: any
  ) {
    this.matSnackBar.open(message, action, {
      duration: 5000,
      horizontalPosition: hPosition ? hPosition : 'center',
      verticalPosition: vPosition ? vPosition : 'bottom',
      panelClass: className ? className : 'snackbar-success',
    });
  }
}
