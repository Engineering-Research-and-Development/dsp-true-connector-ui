export interface KeyCount {
  key: string;
  count: number;
}

export interface TimeBucketCount {
  bucketStart: string; // ISO-8601 instant
  key: string;
  count: number;
}

export interface TenantMetrics<T> {
  tenantId: string;
  tenantName: string;
  metrics: T;
}

export interface NegotiationSnapshotMetrics {
  totalCount: number;
  byState: KeyCount[];
  byRoleAndState: KeyCount[];
  byTenant: TenantMetrics<NegotiationSnapshotMetrics>[] | null;
}

export interface TransferSnapshotMetrics {
  totalCount: number;
  byState: KeyCount[];
  byRoleAndState: KeyCount[];
  byFormat: KeyCount[];
  downloadedCount: number;
  downloadInProgressCount: number;
  byTenant: TenantMetrics<TransferSnapshotMetrics>[] | null;
}

export interface HistoricalEventMetrics {
  totalCount: number;
  byEventType: KeyCount[];
  byRole: KeyCount[];
  overTime: TimeBucketCount[];
  byTenant: TenantMetrics<HistoricalEventMetrics>[] | null;
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
  /** When set (SUPER_ADMIN scoping to a specific tenant), sent as the X-Tenant-Id header. */
  tenantId?: string;
}
