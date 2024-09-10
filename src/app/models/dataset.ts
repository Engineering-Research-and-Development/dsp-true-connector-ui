import { Distribution } from './distribution';
import { Multilanguage } from './multilanguage';
import { Offer } from './offer';

export interface Dataset {
  '@id': string;
  type?: string;
  title: string;
  description: Multilanguage[];
  keyword: string[];
  distribution: Distribution[];
  hasPolicy: Offer[];
  conformsTo?: string;
  creator?: string;
  identifier?: string;
  issued?: string;
  modified?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  version?: number;
  theme: string[];
}
