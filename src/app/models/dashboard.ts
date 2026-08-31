export interface KeyCount {
  key: string;
  count: number;
}

export interface TimeBucketCount {
  bucketStart: string; // ISO-8601 instant
  key: string;
  count: number;
}

export interface NegotiationSnapshotMetrics {
  countsByState: KeyCount[];
  countsByRoleAndState: KeyCount[];
  total: number;
}

export interface TransferSnapshotMetrics {
  countsByState: KeyCount[];
  countsByRoleAndState: KeyCount[];
  countsByFormat: KeyCount[];
  countsByDownloadFlag: KeyCount[];
  total: number;
}

export interface HistoricalEventMetrics {
  countsByEventType: KeyCount[];
  countsByRole: KeyCount[];
  countsOverTime: TimeBucketCount[];
  total: number;
}

export interface RuntimeMetricsResponse {
  processCpuUsage: number; // ratio 0..1, or -1 when unavailable
  systemCpuUsage: number; // ratio 0..1, or -1 when unavailable
  heapUsedBytes: number;
  heapMaxBytes: number; // can be -1 when undefined
  nonHeapUsedBytes: number;
  liveThreadCount: number;
  uptimeMilliseconds: number;
}

export interface DashboardSummaryResponse {
  negotiations: NegotiationSnapshotMetrics;
  transfers: TransferSnapshotMetrics;
  events: HistoricalEventMetrics;
  runtime: RuntimeMetricsResponse;
}

export type DashboardBucket = 'hour' | 'day';

export interface DashboardSummaryParams {
  from?: string;
  to?: string;
  bucket?: DashboardBucket;
}
