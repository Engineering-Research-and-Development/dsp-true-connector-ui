import { DataService } from './dataService';
import { Multilanguage } from './multilanguage';
import { Offer } from './offer';

export interface Distribution {
  '@id'?: string;
  title: string;
  description: Multilanguage[];
  issued?: string;
  modified?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  version?: number;
  accessService: DataService;
  hasPolicy?: Offer[];
  readonly type?: string;
  format?: any;
}
