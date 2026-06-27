import { describe, expect, it } from 'vitest'

import { BusinessCode, getLocalizedError, getLocalizedErrorForCode } from '@/api/errors'

describe('getLocalizedError', () => {
  it('returns localized message for known business code', () => {
    expect(getLocalizedError({ code: BusinessCode.FORBIDDEN })).toBe('权限不足')
  })

  it('returns fallback for unknown payload', () => {
    expect(getLocalizedError({})).toBe('请求失败')
  })
})

describe('getLocalizedErrorForCode', () => {
  it('returns localized unauthorized message', () => {
    expect(getLocalizedErrorForCode(BusinessCode.UNAUTHORIZED)).toBe('登录已失效，请重新登录')
  })
})
