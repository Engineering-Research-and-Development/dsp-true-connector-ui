// src/app/test-utils/test-utils.ts

// --- Existing Mocks (Keep these) ---
import { ApplicationProperty } from '../models/applicationProperty';
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

export const MOCK_ARTIFACT: Artifact = {
  id: 'urn:uuid:test-artifact-id', // Keep this generic one if used elsewhere
  contentType: 'application/json',
  artifactType: 'FILE',
  createdBy: 'admin@admin.com',
  created: '2024-04-23T18:26:00+02:00',
  lastModifiedDate: '2024-04-23T18:26:00+02:00',
  filename: 'Employees.txt',
  lastModifiedBy: 'admin@admin.com',
  value: '123456789',
  version: 1,
};

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
  artifact: MOCK_ARTIFACT,
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
  created: '2024-04-23T18:26:00+02:00',
  modified: '2024-04-23T18:26:00+02:00',
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
  agreement: null,
  created: '2024-04-23T18:26:00+02:00',
  createdBy: 'tc',
  lastModifiedBy: 'tc',
  modified: '2024-04-23T18:26:00+02:00',
  role: 'CONSUMER',
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

// --- NEW Mocks for Artifact Dialog Component ---

export const MOCK_FILE_ARTIFACT: Artifact = {
  id: 'artifact-file-1',
  artifactType: 'FILE',
  filename: 'test-file.txt',
  contentType: 'text/plain',
  value: '', // Value might not be relevant for FILE type on client
  // Add other optional fields if needed based on your Artifact model
  createdBy: 'test@test.com',
  created: new Date().toISOString(),
  lastModifiedBy: 'test@test.com',
  lastModifiedDate: new Date().toISOString(),
  version: 1,
  authorization: undefined, // Explicitly undefined for file artifacts
};

export const MOCK_EXTERNAL_ARTIFACT_NO_AUTH: Artifact = {
  id: 'artifact-ext-1',
  artifactType: 'EXTERNAL',
  value: 'http://example.com/data.csv', // URL stored in value
  filename: 'data.csv', // Optional filename info
  contentType: 'text/csv',
  authorization: undefined, // No authorization
  createdBy: 'test@test.com',
  created: new Date().toISOString(),
  lastModifiedBy: 'test@test.com',
  lastModifiedDate: new Date().toISOString(),
  version: 1,
};

export const MOCK_EXTERNAL_ARTIFACT_BASIC_AUTH: Artifact = {
  id: 'artifact-ext-2',
  artifactType: 'EXTERNAL',
  value: 'http://example.com/secure/data.json',
  filename: 'data.json',
  contentType: 'application/json',
  authorization: 'Basic dXNlcjpwYXNz', // base64 for "user:pass"
  createdBy: 'test@test.com',
  created: new Date().toISOString(),
  lastModifiedBy: 'test@test.com',
  lastModifiedDate: new Date().toISOString(),
  version: 1,
};

export const MOCK_EXTERNAL_ARTIFACT_BEARER_AUTH: Artifact = {
  id: 'artifact-ext-3',
  artifactType: 'EXTERNAL',
  value: 'http://example.com/api/resource',
  filename: 'resource',
  contentType: 'application/json',
  authorization: 'Bearer mytoken123',
  createdBy: 'test@test.com',
  created: new Date().toISOString(),
  lastModifiedBy: 'test@test.com',
  lastModifiedDate: new Date().toISOString(),
  version: 1,
};

export const MOCK_EXTERNAL_ARTIFACT_OTHER_AUTH: Artifact = {
  id: 'artifact-ext-4',
  artifactType: 'EXTERNAL',
  value: 'http://example.com/api/other',
  filename: 'other',
  contentType: 'application/xml',
  authorization: 'CustomApiKey abcdef12345', // Doesn't start with Basic/Bearer
  createdBy: 'test@test.com',
  created: new Date().toISOString(),
  lastModifiedBy: 'test@test.com',
  lastModifiedDate: new Date().toISOString(),
  version: 1,
};

// --- Application Property Mocks ---

export const MOCK_APPLICATION_PROPERTY_DAPS: ApplicationProperty = {
  key: 'daps.url',
  value: 'https://daps.example.com',
  sampleValue: 'https://daps.example.com',
  mandatory: true,
  group: 'DAPS',
  label: 'DAPS URL',
  tooltip: 'The URL of the DAPS (Dynamic Attribute Provisioning Service)',
  type: 'string',
};

export const MOCK_APPLICATION_PROPERTY_SECURITY: ApplicationProperty = {
  key: 'security.authentication.enabled',
  value: 'true',
  sampleValue: 'true',
  mandatory: false,
  group: 'Security',
  label: 'Authentication Enabled',
  tooltip: 'Enable or disable authentication for the connector',
  type: 'boolean',
};

export const MOCK_APPLICATION_PROPERTY_GENERAL: ApplicationProperty = {
  key: 'connector.name',
  value: 'Test Connector',
  sampleValue: 'My Connector',
  mandatory: true,
  group: 'General',
  label: 'Connector Name',
  tooltip: 'The display name for this connector instance',
  type: 'string',
};

export const MOCK_APPLICATION_PROPERTIES = [
  MOCK_APPLICATION_PROPERTY_DAPS,
  MOCK_APPLICATION_PROPERTY_SECURITY,
  MOCK_APPLICATION_PROPERTY_GENERAL,
];
