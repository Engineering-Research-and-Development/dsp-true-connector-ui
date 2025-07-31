import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { AuditEvent } from '../../../models/auditEvent';
import { AuditEventType } from '../../../models/auditEventType';

@Component({
  selector: 'app-audit-event-details-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './audit-event-details-dialog.component.html',
  styleUrl: './audit-event-details-dialog.component.css',
})
export class AuditEventDetailsDialogComponent {
  eventTypes: AuditEventType[] = [];

  constructor(
    public dialogRef: MatDialogRef<AuditEventDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { auditEvent: AuditEvent; eventTypes: AuditEventType[] }
  ) {
    this.eventTypes = data.eventTypes || [];
  }

  get auditEvent(): AuditEvent {
    return this.data.auditEvent;
  }

  /**
   * Close the dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  }

  /**
   * Get display name for the event type
   */
  getEventTypeDisplayName(eventTypeCode: string): string {
    const eventType = this.eventTypes.find(
      (type) => type.code === eventTypeCode
    );
    return eventType ? eventType.description : eventTypeCode;
  }

  /**
   * Check if details object has any content
   */
  hasDetails(): boolean {
    return (
      this.auditEvent.details != null &&
      Object.keys(this.auditEvent.details).length > 0
    );
  }

  /**
   * Get structured details for display - show actual JSON content
   */
  getStructuredDetails(): Array<{
    key: string;
    value: string;
    icon?: string;
    isComplex?: boolean;
  }> {
    if (!this.auditEvent.details) return [];

    const details: Array<{
      key: string;
      value: string;
      icon?: string;
      isComplex?: boolean;
    }> = [];

    // Handle specific known fields with better formatting
    const detailsObj = this.auditEvent.details;

    // Contract Negotiation details
    if (detailsObj['contractNegotiation']) {
      const cn = detailsObj['contractNegotiation'];
      if (cn.id)
        details.push({ key: 'Contract ID', value: cn.id, icon: 'assignment' });
      if (cn.providerPid)
        details.push({
          key: 'Provider PID',
          value: cn.providerPid,
          icon: 'business',
        });
      if (cn.consumerPid)
        details.push({
          key: 'Consumer PID',
          value: cn.consumerPid,
          icon: 'person',
        });
      if (cn.state)
        details.push({ key: 'Contract State', value: cn.state, icon: 'info' });
    }

    // Data Transfer details
    if (detailsObj['dataTransfer']) {
      const dt = detailsObj['dataTransfer'];
      if (dt.id)
        details.push({ key: 'Transfer ID', value: dt.id, icon: 'sync' });
      if (dt.state)
        details.push({
          key: 'Transfer State',
          value: dt.state,
          icon: 'cloud_sync',
        });
    }

    // Handle other fields - show full JSON for complex objects
    Object.keys(detailsObj).forEach((key) => {
      if (key === 'contractNegotiation' || key === 'dataTransfer') return; // Already handled

      const value = detailsObj[key];
      if (value !== null && value !== undefined) {
        const formattedKey = this.formatFieldName(key);
        const isComplex = typeof value === 'object';
        const formattedValue = isComplex
          ? JSON.stringify(value, null, 2)
          : String(value);
        details.push({
          key: formattedKey,
          value: formattedValue,
          icon: 'info',
          isComplex,
        });
      }
    });

    return details;
  }

  /**
   * Format field names for display
   */
  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Get event type chip color based on event type
   */
  getEventTypeChipColor(eventTypeCode: string): string {
    const upperEventType = eventTypeCode.toUpperCase();

    // Error events (Red)
    if (
      upperEventType.includes('ERROR') ||
      upperEventType.includes('FAILED') ||
      upperEventType.includes('DENIED')
    ) {
      return 'warn';
    }

    // Data transfer events (Green)
    else if (upperEventType.includes('TRANSFER')) {
      return 'accent';
    }

    // Contract negotiation events (Blue)
    else if (
      upperEventType.includes('NEGOTIATION') ||
      upperEventType.includes('POLICY EVALUATION')
    ) {
      return 'primary';
    }

    // User-related events (Orange)
    else if (
      upperEventType.includes('LOGIN') ||
      upperEventType.includes('LOGOUT') ||
      upperEventType.includes('USER') ||
      upperEventType.includes('AUTHENTICATION')
    ) {
      return 'user';
    }

    // Application events (Gray) - return default for default styling
    else if (upperEventType.includes('APPLICATION')) {
      return 'default';
    }

    return 'default';
  }
}
