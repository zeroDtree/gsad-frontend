import { i18n } from '@/i18n'

export function t(key: string, values?: Record<string, unknown>): string {
  return i18n.global.t(key, values ?? {})
}
