export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  tenantId: string | null;
  tenantName?: string | null;
  enabled: boolean;
  expired: boolean;
  locked: boolean;
}
