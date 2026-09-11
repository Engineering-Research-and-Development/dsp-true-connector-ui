export interface TenantCreateRequest {
  id: string;
  name: string;
  description?: string | null;
  participantId: string;
  automaticNegotiation?: boolean;
  automaticTransfer?: boolean;
  enabled?: boolean;
  bucketName?: string | null;
  accessKey?: string | null;
  secretKey?: string | null;
  verifyConnection?: boolean;
}
