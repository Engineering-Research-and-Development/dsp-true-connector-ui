import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-cn-details-dialog',
  standalone: true,
  imports: [CommonModule, MatExpansionModule],
  templateUrl: './cn-details-dialog.component.html',
  styleUrl: './cn-details-dialog.component.css',
})
export class CnDetailsDialogComponent {
  type: string = '';

  constructor(
    public dialogRef: MatDialogRef<CnDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.type = data.type;
    console.log(data);
  }

  /**
   * Close the dialog
   * @returns void
   * */
  onClose(): void {
    this.dialogRef.close();
  }
}
