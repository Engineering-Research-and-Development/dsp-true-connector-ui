export interface ApplicationProperty {
  key: string;
  value: string;
  sampleValue?: string;
  mandatory: boolean;
  group?: string;
  label?: string;
  tooltip?: string;
  type: string;
}
