import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AuditTrailComponent } from './audit-trail.component';

describe('AuditTrailComponent', () => {
  let component: AuditTrailComponent;
  let fixture: ComponentFixture<AuditTrailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AuditTrailComponent,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MatDialogModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditTrailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should bound the From Date picker max by the selected To Date', () => {
    expect(component.maxFromDate).toBeNull();

    const toDate = new Date('2024-06-15');
    component.toDateFilter = toDate;

    expect(component.maxFromDate).toBe(toDate);
  });

  it('should bound the To Date picker min by the selected From Date', () => {
    expect(component.minToDate).toBeNull();

    const fromDate = new Date('2024-06-01');
    component.fromDateFilter = fromDate;

    expect(component.minToDate).toBe(fromDate);
  });
});
