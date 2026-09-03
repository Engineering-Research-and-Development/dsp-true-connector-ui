export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  tenantId: string | null;
  enabled: boolean;
  expired: boolean;
  locked: boolean;
}
