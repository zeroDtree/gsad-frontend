/** Server presence on the public board, distinct from application audit_status. */
export type ServerStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'

/** Per-GPU row (gpu-server-report `gpus[]`, Jackson camelCase). avgUtil is 0~1. */
export interface GpuRow {
  index: number
  name: string
  avgUtil: number
  memUsedMb: number
  memTotalMb: number
}

/** Aggregates from agent `summary` (camelCase). avgUtil is 0~1. */
export interface GpuSummaryBlock {
  gpuCount: number
  avgUtil: number
  avgMemUsedMb: number
}

/** GET /api/servers item — matches gsad ServerVO (camelCase). */
export interface PublicServerItem {
  /** Stable GPU server id (unique). */
  id: string
  hostname: string
  resourceLevel: string
  status: ServerStatus
  /** Server ingest time (ISO 8601 UTC); null if never received a report. */
  lastReportedAt: string | null
  /** Agent snapshot time from metrics payload; null if never reported with new shape. */
  collectedAt: string | null
  summary: GpuSummaryBlock | null
  gpus: GpuRow[]
}
