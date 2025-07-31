export interface AuditEvent {
  id: string;
  eventType: string; // Event type code from backend
  username?: string;
  timestamp: string; // ISO string from backend, will be converted to Date when needed
  description?: string;
  details?: { [key: string]: any }; // flexible structure for additional data
  source?: string; // component/module where event occurred
  ipAddress?: string;
}
