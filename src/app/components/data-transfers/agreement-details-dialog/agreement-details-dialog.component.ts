import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Agreement } from '../../../models/agreement';
import { AgreementService } from '../../../services/agreement/agreement.service';
import { Constraint } from '../../../models/permission';
import { Operator } from '../../../models/enums/operators.enum';

@Component({
  selector: 'app-agreement-details-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './agreement-details-dialog.component.html',
  styleUrl: './agreement-details-dialog.component.css',
})
export class AgreementDetailsDialogComponent implements OnInit {
  agreement: Agreement | null = null;
  loading = true;

  constructor(
    public dialogRef: MatDialogRef<AgreementDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { agreementId: string },
    private agreementService: AgreementService,
  ) {}

  ngOnInit(): void {
    this.agreementService.getAgreementById(this.data.agreementId).subscribe({
      next: (agreement) => {
        this.agreement = agreement;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  isDateConstraint(constraint: Constraint): boolean {
    return constraint.leftOperand === 'DATE_TIME';
  }

  isCountConstraint(constraint: Constraint): boolean {
    return constraint.leftOperand === 'COUNT';
  }

  getRemainingCount(constraint: Constraint): string {
    let remaining: number=0;
    if (constraint.operator === Operator.LTEQ) {
      remaining =
        parseInt(constraint.rightOperand) - (this.agreement?.currentCount ?? 0);
    } 
    if (constraint.operator === Operator.LT) {
      remaining =
        parseInt(constraint.rightOperand)-1 - (this.agreement?.currentCount ?? 0);
    }
    
    if (remaining <= 0) {
        return 'No remaining transfers';
      }
     if (remaining === 1) {
        return '1 remaining transfer';
      }

      return `${remaining} remaining transfers`;
    } 
  

  
}
