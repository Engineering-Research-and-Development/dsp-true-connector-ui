export interface GenericApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
