import { Permission } from './permission';

export interface Offer {
  '@id': number;
  target?: string;
  assigner: string;
  assignee: string;
  permission: Permission[];
  providerPid?: string;
  consumerPid?: string;
}
