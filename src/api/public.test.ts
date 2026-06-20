import { describe, expect, it } from 'vitest'

import { normalizePublicServerItem } from '@/api/public'
import type { ServerVO } from '@/types/apiEnvelope'

const baseServer: ServerVO = {
  id: 'gpu-mock-001',
  resourceLevel: 'H100',
  status: 'ONLINE',
  lastReportedAt: '2026-04-21T14:28:10Z',
  collectedAt: '2026-04-21T14:28:05Z',
  summary: { gpuCount: 8, avgUtil: 0.78, avgMemUsedMb: 78336 },
  gpus: [],
}

describe('normalizePublicServerItem', () => {
  it('uses explicit string id when present', () => {
    const item = normalizePublicServerItem({ ...baseServer, id: 'gpu-cn-bj-001' })
    expect(item?.id).toBe('gpu-cn-bj-001')
  })

  it('coerces numeric id to string', () => {
    const item = normalizePublicServerItem({ ...baseServer, id: 42 } as unknown as ServerVO)
    expect(item?.id).toBe('42')
  })

  it('returns null when id is missing', () => {
    const { id: _id, ...withoutId } = baseServer
    expect(normalizePublicServerItem(withoutId as ServerVO)).toBeNull()
  })

  it('returns null for invalid status', () => {
    expect(
      normalizePublicServerItem({ ...baseServer, status: 'UNKNOWN' } as unknown as ServerVO),
    ).toBeNull()
  })

  it('returns null when id is empty', () => {
    expect(normalizePublicServerItem({ ...baseServer, id: '  ' })).toBeNull()
  })
})
