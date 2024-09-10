import { ContractNegotiationState } from './enums/contractNegotiationState';
import { Offer } from './offer';

export interface ContractNegotiation {
  '@id': string;
  callbackAddress: string;
  assigner: string;
  offer: Offer;
  consumerPid: string;
  providerPid: string;
  state: ContractNegotiationState;
  type?: string;
}
