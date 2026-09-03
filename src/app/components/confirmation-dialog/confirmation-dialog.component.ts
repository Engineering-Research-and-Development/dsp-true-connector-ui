import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirmation-dialog',
    imports: [CommonModule, MatButtonModule],
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  get confirmLabel(): string {
    return this.data.confirmLabel || 'Delete';
  }

  get cancelLabel(): string {
    return this.data.cancelLabel || 'Cancel';
  }

  get hideActions(): boolean {
    return this.data.hideActions === true;
  }

  /**
   * Function for closing modal
   */
  onCancel() {
    this.dialogRef.close(false);
  }

  /**
   * Function for confirming action
   */
  onConfirm() {
    this.dialogRef.close(true);
  }
}
