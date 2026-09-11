export interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string | null;
  enabled: boolean;
  expired: boolean;
  locked: boolean;
}
