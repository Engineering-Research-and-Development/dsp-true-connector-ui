import { DataService } from './dataService';
import { Multilanguage } from './multilanguage';

export interface Distribution {
  '@id'?: string;
  title: string;
  description: Multilanguage[];
  issued?: string;
  modified?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  version?: number;
  accessService: DataService[];
  hasPolicy?: any[];
  type?: string;
}
