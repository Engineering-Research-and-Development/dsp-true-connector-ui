export interface AuditEventType {
  code: string;
  description: string;
}

export function getAuditEventTypeDisplayName(
  eventType: AuditEventType
): string {
  return eventType.description;
}

export function getAuditEventTypeCode(eventType: AuditEventType): string {
  return eventType.code;
}
