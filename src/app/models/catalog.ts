import { DataService } from './dataService';
import { Dataset } from './dataset';
import { Distribution } from './distribution';
import { Multilanguage } from './multilanguage';

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
  hasPolicy: any[];
  dataset: Dataset[];
  service: DataService[];
  participantId: string;
  homepage: string;
  createdBy?: string;
  lastModifiedBy?: string;
  version?: number;
  type?: string;
}
