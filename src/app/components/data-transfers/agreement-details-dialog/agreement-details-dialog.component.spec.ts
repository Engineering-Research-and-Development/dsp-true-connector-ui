import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Agreement } from '../../../models/agreement';
import { Constraint } from '../../../models/permission';
import { Operator } from '../../../models/enums/operators.enum';
import { AgreementService } from '../../../services/agreement/agreement.service';
import { AgreementDetailsDialogComponent } from './agreement-details-dialog.component';

describe('AgreementDetailsDialogComponent', () => {
  let component: AgreementDetailsDialogComponent;
  let fixture: ComponentFixture<AgreementDetailsDialogComponent>;
  let mockAgreementService: jasmine.SpyObj<AgreementService>;

  const mockAgreement: Agreement = {
    '@id': 'test-agreement-id',
    assigner: 'urn:uuid:provider',
    assignee: 'urn:uuid:consumer',
    target: 'urn:uuid:dataset',
    timestamp: '2024-01-15T10:00:00Z',
    permission: [
      {
        action: 'USE',
        constraint: [
          { leftOperand: 'DATE_TIME', operator: Operator.LTEQ, rightOperand: '2025-12-31T23:59:59Z' },
          { leftOperand: 'COUNT', operator: Operator.LTEQ, rightOperand: '10' },
        ],
      },
    ],
    currentCount: 3,
  };

  const mockDialogRef = {
    close: jasmine.createSpy('close'),
  };

  beforeEach(async () => {
    mockAgreementService = jasmine.createSpyObj('AgreementService', ['getAgreementById']);
    mockAgreementService.getAgreementById.and.returnValue(of(mockAgreement));

    await TestBed.configureTestingModule({
      imports: [AgreementDetailsDialogComponent, BrowserAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { agreementId: 'test-agreement-id' } },
        { provide: AgreementService, useValue: mockAgreementService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgreementDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load agreement details on init', () => {
    expect(mockAgreementService.getAgreementById).toHaveBeenCalledWith('test-agreement-id');
    expect(component.agreement).toEqual(mockAgreement);
    expect(component.loading).toBeFalse();
  });

  it('should set loading to false on API error', () => {
    mockAgreementService.getAgreementById.and.returnValue(throwError(() => new Error('API error')));
    component.loading = true;
    component.ngOnInit();
    expect(component.loading).toBeFalse();
  });

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  describe('isDateConstraint', () => {
    it('should return true for DATE_TIME left operand', () => {
      const constraint: Constraint = { leftOperand: 'DATE_TIME', operator: Operator.LTEQ, rightOperand: '2025-12-31' };
      expect(component.isDateConstraint(constraint)).toBeTrue();
    });

    it('should return false for non-date left operand', () => {
      const constraint: Constraint = { leftOperand: 'COUNT', operator: Operator.LTEQ, rightOperand: '10' };
      expect(component.isDateConstraint(constraint)).toBeFalse();
    });
  });

  describe('isCountConstraint', () => {
    it('should return true for COUNT left operand', () => {
      const constraint: Constraint = { leftOperand: 'COUNT', operator: Operator.LTEQ, rightOperand: '5' };
      expect(component.isCountConstraint(constraint)).toBeTrue();
    });

    it('should return false for non-count left operand', () => {
      const constraint: Constraint = { leftOperand: 'DATE_TIME', operator: Operator.LTEQ, rightOperand: '2025-12-31' };
      expect(component.isCountConstraint(constraint)).toBeFalse();
    });
  });

  describe('getRemainingCount', () => {
    it('should return plural remaining count for LTEQ operator', () => {
      // currentCount=3, rightOperand='10' → remaining = 10 - 3 = 7
      const constraint: Constraint = { leftOperand: 'COUNT', operator: Operator.LTEQ, rightOperand: '10' };
      expect(component.getRemainingCount(constraint)).toBe('7 remaining transfers');
    });

    it('should return singular remaining count for LT operator', () => {
      // currentCount=3, rightOperand='5' → remaining = 5-1-3 = 1
      const constraint: Constraint = { leftOperand: 'COUNT', operator: Operator.LT, rightOperand: '5' };
      expect(component.getRemainingCount(constraint)).toBe('1 remaining transfer');
    });

    it('should return "No remaining transfers" when count is exhausted', () => {
      // currentCount=3, rightOperand='3' → remaining = 3 - 3 = 0
      const constraint: Constraint = { leftOperand: 'COUNT', operator: Operator.LTEQ, rightOperand: '3' };
      expect(component.getRemainingCount(constraint)).toBe('No remaining transfers');
    });

    it('should return singular "1 remaining transfer" for exactly 1 left', () => {
      // currentCount=3, rightOperand='4' → remaining = 4 - 3 = 1
      const constraint: Constraint = { leftOperand: 'COUNT', operator: Operator.LTEQ, rightOperand: '4' };
      expect(component.getRemainingCount(constraint)).toBe('1 remaining transfer');
    });
  });
});
