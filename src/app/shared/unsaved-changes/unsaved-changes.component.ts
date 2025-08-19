import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'unsaved-changes',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div *ngIf="active" class="changes-indicator">
      <mat-icon color="accent">edit</mat-icon>
      <span>You have unsaved changes</span>
    </div>
  `,
  styles: [
    `
      .changes-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #ff9800;
        font-weight: 500;
        margin-bottom: 20px;
        padding: 12px;
        background: #fff8e1;
        border-radius: 8px;
        border-left: 4px solid #ff9800;
      }
    `,
  ],
})
export class UnsavedChangesComponent {
  @Input() active = false;
}
