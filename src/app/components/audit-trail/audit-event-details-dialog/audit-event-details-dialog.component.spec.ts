import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuditEvent } from '../../../models/auditEvent';
import { AuditEventType } from '../../../models/auditEventType';
import { AuditEventDetailsDialogComponent } from './audit-event-details-dialog.component';

describe('AuditEventDetailsDialogComponent', () => {
  let component: AuditEventDetailsDialogComponent;
  let fixture: ComponentFixture<AuditEventDetailsDialogComponent>;

  const mockAuditEvent: AuditEvent = {
    id: 'test-id',
    eventType: 'APPLICATION_LOGIN',
    username: 'testuser',
    timestamp: '2024-01-01T00:00:00Z',
    description: 'Test description',
    details: { key1: 'value1' },
    source: 'test-source',
    ipAddress: '127.0.0.1',
  };

  const mockEventTypes: AuditEventType[] = [
    { code: 'APPLICATION_LOGIN', description: 'Login' },
    { code: 'APPLICATION_LOGOUT', description: 'Logout' },
  ];

  const mockDialogRef = {
    close: jasmine.createSpy('close'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditEventDetailsDialogComponent, BrowserAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            auditEvent: mockAuditEvent,
            eventTypes: mockEventTypes,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditEventDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
