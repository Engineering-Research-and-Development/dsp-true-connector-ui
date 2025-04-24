export interface Artifact {
  id?: string;
  artifactType: 'FILE' | 'EXTERNAL';
  filename?: string;
  contentType?: string;
  authorization?: string;
  createdAt?: string;
  modifiedAt?: string;
  created?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  version?: number;
  value: string;
}
