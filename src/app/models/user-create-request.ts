export interface UserCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  tenantId: string | null;
}
