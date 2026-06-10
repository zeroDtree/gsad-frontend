import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

const STALE_AFTER_SECONDS = 120

/**
 * Parse API UTC instant and format for local display (doc §8.4).
 */
export function formatLocalDateTime(isoUtc: string | null | undefined): string {
  if (!isoUtc) return '—'
  return dayjs.utc(isoUtc).local().format('YYYY-MM-DD HH:mm:ss')
}

export function formatRelativeFromUtc(isoUtc: string | null | undefined): string {
  if (!isoUtc) return '—'
  const t = dayjs.utc(isoUtc).local()
  const diffSec = dayjs().diff(t, 'second')
  if (diffSec < 60) return `${Math.max(0, diffSec)} 秒前`
  const diffMin = dayjs().diff(t, 'minute')
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffHr = dayjs().diff(t, 'hour')
  if (diffHr < 48) return `${diffHr} 小时前`
  return t.format('YYYY-MM-DD')
}

/**
 * Whether lastReportedAt is older than 120s (doc §4.1).
 */
export function isReportStale(isoUtc: string | null | undefined): boolean {
  if (!isoUtc) return true
  const t = dayjs.utc(isoUtc)
  return dayjs.utc().diff(t, 'second') > STALE_AFTER_SECONDS
}

export { dayjs }
