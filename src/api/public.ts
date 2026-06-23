import { http } from '@/api/http'
import type { GpuRow, GpuSummaryBlock, PublicServerItem } from '@/types/public'
import type { ServerListEnvelope, ServerVO } from '@/types/apiEnvelope'

function asFiniteNumber(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  return v
}

function asNonEmptyString(v: unknown): string | null {
  if (typeof v !== 'string' || !v.trim()) return null
  return v
}

/** Public server id from gsad JSON (camelCase). */
function asServerId(v: unknown): string | null {
  return asNonEmptyString(v)
}

function normalizeGpuSummaryBlock(raw: ServerVO['summary']): GpuSummaryBlock | null {
  if (!raw || typeof raw !== 'object') return null
  const gpuCount = asFiniteNumber(raw.gpuCount)
  const avgUtil = asFiniteNumber(raw.avgUtil)
  const avgMemUsedMb = asFiniteNumber(raw.avgMemUsedMb)
  if (gpuCount === null || avgUtil === null || avgMemUsedMb === null) return null
  if (!Number.isInteger(gpuCount) || gpuCount < 0) return null
  if (!Number.isInteger(avgMemUsedMb) || avgMemUsedMb < 0) return null
  return { gpuCount, avgUtil, avgMemUsedMb: Math.trunc(avgMemUsedMb) }
}

function normalizeGpuRow(raw: NonNullable<ServerVO['gpus']>[number]): GpuRow | null {
  const index = asFiniteNumber(raw.index)
  const name = asNonEmptyString(raw.name)
  const avgUtil = asFiniteNumber(raw.avgUtil)
  const memUsedMb = asFiniteNumber(raw.memUsedMb)
  const memTotalMb = asFiniteNumber(raw.memTotalMb)
  if (index === null || name === null || avgUtil === null) return null
  if (memUsedMb === null || memTotalMb === null) return null
  if (!Number.isInteger(index) || !Number.isInteger(memUsedMb) || !Number.isInteger(memTotalMb)) {
    return null
  }
  return {
    index,
    name,
    avgUtil,
    memUsedMb: Math.trunc(memUsedMb),
    memTotalMb: Math.trunc(memTotalMb),
  }
}

/** Normalize a public server row from gsad JSON (camelCase) into PublicServerItem. */
export function normalizePublicServerItem(raw: ServerVO): PublicServerItem | null {
  const id = asServerId(raw.id)
  const resourceLevel = asNonEmptyString(raw.resourceLevel)
  const status = asNonEmptyString(raw.status)
  if (!id || !resourceLevel || !status) return null
  const lastReportedAt =
    raw.lastReportedAt === null || raw.lastReportedAt === undefined
      ? null
      : asNonEmptyString(raw.lastReportedAt)
  if (status !== 'ONLINE' && status !== 'OFFLINE' && status !== 'MAINTENANCE') return null

  const collectedAt =
    raw.collectedAt === null || raw.collectedAt === undefined
      ? null
      : asNonEmptyString(raw.collectedAt)

  const summary = normalizeGpuSummaryBlock(raw.summary)

  const gpus: GpuRow[] = []
  if (Array.isArray(raw.gpus)) {
    for (const row of raw.gpus) {
      const g = normalizeGpuRow(row)
      if (g) gpus.push(g)
    }
  }
  gpus.sort((a, b) => a.index - b.index)

  return {
    id,
    resourceLevel,
    status,
    lastReportedAt,
    collectedAt,
    summary,
    gpus,
  }
}

function normalizeServerList(envelope: ServerListEnvelope): PublicServerItem[] {
  const items = envelope.data?.items ?? []
  const out: PublicServerItem[] = []
  for (const row of items) {
    const s = normalizePublicServerItem(row)
    if (s) out.push(s)
  }
  return out
}

/**
 * GET /api/servers
 */
export async function getServers(): Promise<PublicServerItem[]> {
  const { data } = await http.get<ServerListEnvelope>('/api/servers')
  return normalizeServerList(data)
}
