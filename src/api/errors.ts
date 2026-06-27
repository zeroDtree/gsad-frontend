import { t } from '@/i18n/t'

/** Document §7 business codes */
export const BusinessCode = {
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  STATE_CONFLICT: 'STATE_CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type BusinessCodeType = (typeof BusinessCode)[keyof typeof BusinessCode]

const BUSINESS_CODES = new Set<string>(Object.values(BusinessCode))

export function getBusinessCode(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object' && 'code' in payload) {
    const c = (payload as { code?: unknown }).code
    return typeof c === 'string' ? c : undefined
  }
  return undefined
}

export function getApiMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const m = (payload as { message?: unknown }).message
    if (typeof m === 'string' && m.length > 0) return m
  }
  return fallback
}

export function getLocalizedError(payload: unknown): string {
  const code = getBusinessCode(payload)
  if (code && BUSINESS_CODES.has(code)) {
    return t(`errors.${code}`)
  }
  return t('errors.requestFailed')
}

export function getLocalizedErrorForCode(code: BusinessCodeType): string {
  return t(`errors.${code}`)
}
