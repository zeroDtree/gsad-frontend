import type { GpuRow } from '@/types/public'

export function formatUtil(u: number | null | undefined): string {
  if (u == null || Number.isNaN(Number(u))) return '—'
  const n = Number(u)
  const pct = n <= 1 ? Math.round(n * 100) : Math.round(n)
  return `${pct}%`
}

export function formatMemMb(mb: number | null | undefined): string {
  if (mb == null || Number.isNaN(Number(mb))) return '—'
  const n = Number(mb)
  if (n >= 1024) return `${(n / 1024).toFixed(1)} GB`
  return `${Math.round(n)} MB`
}

export function memUseRatio(row: GpuRow): string {
  if (!row.memTotalMb || row.memTotalMb <= 0) return '—'
  const pct = Math.round((row.memUsedMb / row.memTotalMb) * 100)
  return `${pct}%`
}
