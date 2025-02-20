import { DataTransferState } from './enums/dataTransferState';

export interface DataTransfer {
  '@id': string;
  type: string;
  consumerPid: string;
  providerPid: string;
  state: DataTransferState;
  agreementId: string;
  callbackAddress: string;
  datasetId: string;
  role: string;
  dataAddress?: any;
  dataId?: string;
  format?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  version: number;
  downloaded?: boolean;
}
