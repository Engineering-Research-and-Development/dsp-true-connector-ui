import { DataService } from './dataService';
import { Dataset } from './dataset';
import { Distribution } from './distribution';
import { Multilanguage } from './multilanguage';
import { Offer } from './offer';

export interface Catalog {
  '@id'?: string;
  keyword: string[];
  theme: string[];
  conformsTo: string;
  creator: string;
  description: Multilanguage[];
  identifier: string;
  issued?: string;
  modified?: string;
  title: string;
  distribution: Distribution[];
  hasPolicy: Offer[];
  dataset: Dataset[];
  service: DataService[];
  participantId: string;
  createdBy?: string;
  lastModifiedBy?: string;
  version?: number;
  readonly type?: string;
}
