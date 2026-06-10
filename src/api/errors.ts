/** Document §7 business codes */
export const BusinessCode = {
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  STATE_CONFLICT: 'STATE_CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  UPSTREAM_NETBIRD_ERROR: 'UPSTREAM_NETBIRD_ERROR',
} as const

export type BusinessCodeType = (typeof BusinessCode)[keyof typeof BusinessCode]

export const DEFAULT_MESSAGES: Record<BusinessCodeType, string> = {
  [BusinessCode.INVALID_ARGUMENT]: '请求参数无效',
  [BusinessCode.UNAUTHORIZED]: '登录已失效，请重新登录',
  [BusinessCode.FORBIDDEN]: '权限不足',
  [BusinessCode.NOT_FOUND]: '资源不存在或已变更',
  [BusinessCode.STATE_CONFLICT]: '状态已变更，请刷新后重试',
  [BusinessCode.RATE_LIMITED]: '请求过于频繁，请稍后再试',
  [BusinessCode.UPSTREAM_NETBIRD_ERROR]: '上游服务暂时不可用，请稍后重试',
}

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
