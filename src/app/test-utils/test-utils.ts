import { Artifact } from '../models/artifact';
import { Catalog } from '../models/catalog';
import { ContractNegotiation } from '../models/contractNegotiation';
import { DataService } from '../models/dataService';
import { Dataset } from '../models/dataset';
import { Distribution } from '../models/distribution';
import { ContractNegotiationState } from '../models/enums/contractNegotiationState';
import { DataTransferState } from '../models/enums/dataTransferState';
import { Offer } from '../models/offer';
import { Permission } from '../models/permission';

export const MOCK_DATA_SERVICE: DataService = {
  '@id': 'a7064ac6-626a-45b7-9359-5f7334533bfc',
  conformsTo: 'conformsToSomething',
  creator: 'Chuck_Norris',
  description: [
    {
      value: 'For test',
      language: 'en',
    },
  ],
  endpointDescription: 'endpoint description',
  endpointURL: 'http://dataservice.com',
  identifier: 'Unique_identifier_for_tests',
  issued: '2024-04-23T18:26:00+02:00',
  keyword: ['DataService keyword1', 'DataService keyword2'],
  modified: '2024-04-23T18:26:00+02:00',
  theme: ['DataService theme1', 'DataService theme2'],
  title: 'Title_for_test',
  type: 'dcat:DataService',
  version: 1,
  createdBy: 'admin@admin.com',
  lastModifiedBy: 'admin@admin.com',
};

export const MOCK_DISTRIBUTION: Distribution = {
  '@id': 'urn:uuid:f159416c-1996-423c-bd0c-b71d4f356506',
  accessService: [MOCK_DATA_SERVICE],
  description: [
    {
      value: 'For test',
      language: 'en',
    },
  ],
  format: {
    '@id': 'HTTP:PULL',
  },
  hasPolicy: [
    {
      '@id': 'urn:offer_id',
      assignee: null,
      assigner: null,
      permission: [
        {
          action: 'USE',
          constraint: [
            {
              leftOperand: 'COUNT',
              operator: 'EQ',
              rightOperand: '5',
            },
          ],
          assignee: null,
          assigner: null,
          target: null,
        },
      ],
      target: null,
    },
  ],
  issued: '2024-04-23T18:26:00+02:00',
  modified: '2024-04-23T18:26:00+02:00',
  title: 'Title_for_test',
  type: 'dspace:Distribution',
  version: 1,
  createdBy: 'admin@admin.com',
  lastModifiedBy: 'admin@admin.com',
};

export const MOCK_DATASET: Dataset = {
  '@id': 'dataset_uuid_test',
  conformsTo: 'conformsToSomething',
  creator: 'Chuck_Norris',
  description: [
    {
      value: 'For test',
      language: 'en',
    },
  ],
  distribution: [MOCK_DISTRIBUTION],
  hasPolicy: [
    {
      '@id': 'urn:offer_id',
      assignee: 'null',
      assigner: 'null',
      permission: [
        {
          action: 'USE',
          constraint: [
            {
              leftOperand: 'COUNT',
              operator: 'EQ',
              rightOperand: '5',
            },
          ],
          assignee: 'null',
          assigner: 'null',
          target: 'null',
        },
      ],
      target: 'null',
    },
  ],
  identifier: 'Unique_identifier_for_tests',
  issued: '2024-04-23T18:26:00+02:00',
  keyword: ['keyword1', 'keyword2'],
  modified: '2024-04-23T18:26:00+02:00',
  theme: ['aqua', 'white', 'blue'],
  title: 'Title_for_test',
  type: 'dcat:Dataset',
  version: 1,
  createdBy: 'admin@admin.com',
  lastModifiedBy: 'admin@admin.com',
  artifact: null,
};

export const MOCK_CATALOG: Catalog = {
  '@id': 'urn:uuid:efa480fc-1bfb-4995-b3a0-7a3caad9e695',
  keyword: ['keyword1', 'keyword2'],
  theme: ['aqua', 'white', 'blue'],
  conformsTo: 'conformsToSomething',
  creator: 'Chuck_Norris',
  description: [
    {
      value: 'Catalog description',
      language: 'en',
    },
  ],
  identifier: 'Unique_identifier_for_tests',
  issued: '2024-04-23T18:26:00+02:00',
  modified: '2024-04-23T18:26:00+02:00',
  title: 'Title_for_test',
  distribution: [MOCK_DISTRIBUTION],
  hasPolicy: [
    {
      '@id': 'urn:offer_id',
      assignee: null,
      assigner: null,
      permission: [
        {
          action: 'USE',
          constraint: [
            {
              leftOperand: 'COUNT',
              operator: 'EQ',
              rightOperand: '5',
            },
          ],
          assignee: null,
          assigner: null,
          target: null,
        },
      ],
      target: null,
    },
  ],
  dataset: [MOCK_DATASET],
  service: [MOCK_DATA_SERVICE],
  participantId: 'urn:example:DataProviderA',
  homepage: 'https://provider-a.com/connector',
  type: 'dcat:Catalog',
  version: 1,
  createdBy: 'admin@admin.com',
  lastModifiedBy: 'admin@admin.com',
};

export const MOCK_ENDPOINT_PROPERTY = {
  name: 'authorization',
  value: 'TOKEN-ABCDEFG',
};

export const MOCK_DATA_ADDRESS = {
  endpoint: 'https://provider-a.com/connector',
  endpointType: 'https://w3id.org/idsa/v4.1/HTTP',
  endpointProperties: [MOCK_ENDPOINT_PROPERTY],
};

export const MOCK_TRANSFER_ERROR = {
  consumerPid: 'urn:uuid:CONSUMER_PID',
  providerPid: 'urn:uuid:PROVIDER_PID',
  code: 'TEST',
  reason: [{ language: 'en', value: 'TEST' }],
};

export const MOCK_DATA_TRANSFER = {
  '@id': 'test-transfer-process-id',
  type: 'DataTransfer',
  consumerPid: 'urn:uuid:CONSUMER_PID',
  providerPid: 'urn:uuid:PROVIDER_PID',
  state: DataTransferState.INITIALIZED,
  agreementId: 'urn:uuid:AGREEMENT_ID',
  callbackAddress: 'https://example.com/callback',
  datasetId: 'datasetId',
  role: 'PROVIDER',
  dataAddress: MOCK_DATA_ADDRESS,
  format: 'HTTP_PULL',
  createdBy: 'admin@admin.com',
  lastModifiedBy: 'admin@admin.com',
  version: 1,
};

export const MOCK_TRANSFER_REQUEST = {
  transferProcessId: 'test-transfer-process-id',
  consumerPid: 'urn:uuid:CONSUMER_PID',
  agreementId: 'urn:uuid:AGREEMENT_ID',
  format: 'HTTP_PULL',
  callbackAddress: 'https://example.com/callback',
  dataAddress: MOCK_DATA_ADDRESS,
};

export const MOCK_TRANSFER_START = {
  consumerPid: 'urn:uuid:CONSUMER_PID',
  providerPid: 'urn:uuid:PROVIDER_PID',
};

export const MOCK_TRANSFER_COMPLETION = {
  consumerPid: 'urn:uuid:CONSUMER_PID',
  providerPid: 'urn:uuid:PROVIDER_PID',
};

export const MOCK_TRANSFER_TERMINATION = {
  consumerPid: 'urn:uuid:CONSUMER_PID',
  providerPid: 'urn:uuid:PROVIDER_PID',
  code: '123',
};

export const MOCK_TRANSFER_SUSPENSION = {
  consumerPid: 'urn:uuid:CONSUMER_PID',
  providerPid: 'urn:uuid:PROVIDER_PID',
  code: '123',
};

export const MOCK_PERMISSION: Permission = {
  assigner: 'urn:uuid:ASSIGNER_PROVIDER',
  assignee: 'urn:uuid:ASSIGNEE_CONSUMER',
  action: 'USE',
  constraint: [
    {
      leftOperand: 'COUNT',
      operator: 'LTEQ',
      rightOperand: '5',
    },
  ],
  target: 'urn:uuid:fdc45798-a222-4955-8baf-ab7fd66ac4d5',
};

export const MOCK_OFFER: Offer = {
  '@id': '1',
  target: 'urn:uuid:fdc45798-a222-4955-8baf-ab7fd66ac4d5',
  assignee: 'urn:uuid:ASSIGNEE_CONSUMER',
  assigner: 'urn:uuid:ASSIGNER_PROVIDER',
  permission: [MOCK_PERMISSION],
  providerPid: 'urn:uuid:PROVIDER_PID',
  consumerPid: 'urn:uuid:CONSUMER_PID',
};

export const MOCK_CONTRACT_NEGOTIATION: ContractNegotiation = {
  '@id': 'test-negotiation-id',
  type: 'ContractNegotiation',
  callbackAddress: 'https://callback.address/callback',
  assigner: 'urn:uuid:ASSIGNER_PROVIDER',
  offer: MOCK_OFFER,
  consumerPid: 'urn:uuid:CONSUMER_PID',
  providerPid: 'urn:uuid:PROVIDER_PID',
  state: ContractNegotiationState.REQUESTED,
};

export const MOCK_CONTRACT_NEGOTIATION_REQUESTED: ContractNegotiation = {
  ...MOCK_CONTRACT_NEGOTIATION,
  state: ContractNegotiationState.REQUESTED,
};

export const MOCK_CONTRACT_NEGOTIATION_OFFERED: ContractNegotiation = {
  ...MOCK_CONTRACT_NEGOTIATION,
  state: ContractNegotiationState.OFFERED,
};

export const MOCK_CONTRACT_NEGOTIATION_ACCEPTED: ContractNegotiation = {
  ...MOCK_CONTRACT_NEGOTIATION,
  state: ContractNegotiationState.ACCEPTED,
};

export const MOCK_CONTRACT_NEGOTIATION_AGREED: ContractNegotiation = {
  ...MOCK_CONTRACT_NEGOTIATION,
  state: ContractNegotiationState.AGREED,
};

export const MOCK_CONTRACT_NEGOTIATION_VERIFIED: ContractNegotiation = {
  ...MOCK_CONTRACT_NEGOTIATION,
  state: ContractNegotiationState.VERIFIED,
};

export const MOCK_CONTRACT_NEGOTIATION_FINALIZED: ContractNegotiation = {
  ...MOCK_CONTRACT_NEGOTIATION,
  state: ContractNegotiationState.FINALIZED,
};

export const MOCK_CONTRACT_NEGOTIATION_TERMINATED: ContractNegotiation = {
  ...MOCK_CONTRACT_NEGOTIATION,
  state: ContractNegotiationState.TERMINATED,
};

export const MOCK_ARTIFACT: Artifact = {
  id: 'urn:uuid:test-artifact-id',
  'Content-Type': 'application/json',
  artifactType: 'FILE',
  createdBy: 'admin@admin.com',
  created: '2024-04-23T18:26:00+02:00',
  lastModifiedDate: '2024-04-23T18:26:00+02:00',
  filename: 'Employees.txt',
  lastModifiedBy: 'admin@admin.com',
  value: '123456789',
  version: 1,
};
