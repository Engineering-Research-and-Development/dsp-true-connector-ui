export interface Tenant {

  id: string;
  name: string;
  description: string;
  participantId: string;
  automaticNegotiation: boolean;
  automaticTransfer: boolean;
  enabled: boolean;
  bucketName: string;
  createdBy?: string;
  lastModifiedBy?: string;
}
