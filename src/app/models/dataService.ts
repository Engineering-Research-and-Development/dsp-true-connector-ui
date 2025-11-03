import { Dataset } from './dataset';
import { Multilanguage } from './multilanguage';

export interface DataService {
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
  endpointDescription: string;
  endpointURL: string;
  createdBy?: string;
  lastModifiedBy?: string;
  version?: number;
  readonly type?: string;
}
