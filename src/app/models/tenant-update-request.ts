export interface TenantUpdateRequest {
  name?: string;
  description?: string | null;
  automaticNegotiation?: boolean;
  automaticTransfer?: boolean;
  bucketName?: string | null;
  accessKey?: string | null;
  secretKey?: string | null;
  verifyConnection?: boolean;
}
