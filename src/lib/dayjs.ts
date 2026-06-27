import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/zh-cn'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import type { AppLocale } from '@/i18n'
import { t } from '@/i18n/t'

dayjs.extend(utc)
dayjs.extend(timezone)

const STALE_AFTER_SECONDS = 120

export function syncDayjsLocale(appLocale: AppLocale | string): void {
  dayjs.locale(appLocale === 'en' ? 'en' : 'zh-cn')
}

/**
 * Parse API UTC instant and format for local display (doc §8.4).
 */
export function formatLocalDateTime(isoUtc: string | null | undefined): string {
  if (!isoUtc) return '—'
  return dayjs.utc(isoUtc).local().format('YYYY-MM-DD HH:mm:ss')
}

export function formatRelativeFromUtc(isoUtc: string | null | undefined): string {
  if (!isoUtc) return '—'
  const time = dayjs.utc(isoUtc).local()
  const diffSec = dayjs().diff(time, 'second')
  if (diffSec < 60) return t('time.secondsAgo', { n: Math.max(0, diffSec) })
  const diffMin = dayjs().diff(time, 'minute')
  if (diffMin < 60) return t('time.minutesAgo', { n: diffMin })
  const diffHr = dayjs().diff(time, 'hour')
  if (diffHr < 48) return t('time.hoursAgo', { n: diffHr })
  return time.format('YYYY-MM-DD')
}

/**
 * Whether lastReportedAt is older than 120s (doc §4.1).
 */
export function isReportStale(isoUtc: string | null | undefined): boolean {
  if (!isoUtc) return true
  const time = dayjs.utc(isoUtc)
  return dayjs.utc().diff(time, 'second') > STALE_AFTER_SECONDS
}

export { dayjs }
