import { Permission } from './permission';

export interface OfferNegotiation {
  '@id': number;
  consumerPid?: string;
  providerPid?: string;
  target: string;
  assigner: string;
  assignee: string;
  permission: Permission[];
  type?: string;
}
