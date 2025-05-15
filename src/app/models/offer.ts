import { Permission } from './permission';

export interface Offer {
  '@id': string;
  target?: string;
  assigner: string;
  assignee: string;
  permission: Permission[];
  providerPid?: string;
  consumerPid?: string;
}
