import { describe, expect, it } from 'vitest'

import {
  normalizeApplicationListResult,
  toApplicationItem,
  toCreateApplicationWireBody,
} from '@/api/applications'
import type { ApplicationVO, PageResultApplicationEnvelope } from '@/types/apiEnvelope'

describe('toApplicationItem', () => {
  it('normalizes camelCase ApplicationVO', () => {
    const item = toApplicationItem({
      id: 'app-abc123',
      serverId: 'gpu-cn-bj-001',
      purpose: 'Training',
      requestedDays: 7,
      requestedStartAt: '2026-04-22T00:00:00Z',
      expireAt: '2026-04-29T00:00:00Z',
      auditStatus: 'ACTIVE',
      comment: null,
      updatedAt: '2026-04-22T01:00:00Z',
      serverIp: '10.0.0.1',
      sshUsername: 'ubuntu',
      initialPassword: 'secret',
    } as unknown as ApplicationVO)

    expect(item).toMatchObject({
      id: 'app-abc123',
      server_id: 'gpu-cn-bj-001',
      purpose: 'Training',
      requested_days: 7,
      audit_status: 'ACTIVE',
      server_ip: '10.0.0.1',
      ssh_username: 'ubuntu',
      initial_password: 'secret',
    })
  })

  it('leaves server_id empty when serverId absent', () => {
    const item = toApplicationItem({
      id: 'app-xyz',
      resourceLevel: 'H100',
      purpose: 'Job',
      requestedDays: 3,
      requestedStartAt: '2026-04-22T00:00:00Z',
      auditStatus: 'APPROVED',
      updatedAt: '2026-04-22T00:00:00Z',
    })

    expect(item).not.toBeNull()
    expect(item!.server_id).toBe('')
  })

  it('returns null when auditStatus is missing', () => {
    const item = toApplicationItem({
      id: 'app-xyz',
      serverId: 'srv-1',
      purpose: 'Job',
      requestedDays: 3,
      requestedStartAt: '2026-04-22T00:00:00Z',
      updatedAt: '2026-04-22T00:00:00Z',
    } as unknown as ApplicationVO)

    expect(item).toBeNull()
  })

  it('returns null for invalid auditStatus', () => {
    const item = toApplicationItem({
      id: 'app-xyz',
      serverId: 'srv-1',
      purpose: 'Job',
      requestedDays: 3,
      requestedStartAt: '2026-04-22T00:00:00Z',
      auditStatus: 'UNKNOWN',
      updatedAt: '2026-04-22T00:00:00Z',
    } as unknown as ApplicationVO)

    expect(item).toBeNull()
  })
})

describe('normalizeApplicationListResult', () => {
  it('parses pagination metadata', () => {
    const envelope: PageResultApplicationEnvelope = {
      code: '',
      message: 'ok',
      data: {
        items: [
          {
            id: 'app-1',
            serverId: 'srv-1',
            purpose: 'A',
            requestedDays: 1,
            requestedStartAt: '2026-04-22T00:00:00Z',
            auditStatus: 'APPROVED',
            updatedAt: '2026-04-22T00:00:00Z',
          } as unknown as ApplicationVO,
        ],
        total: 42,
        page: 2,
        pageSize: 20,
      },
    }

    const result = normalizeApplicationListResult(envelope)
    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(42)
    expect(result.page).toBe(2)
    expect(result.page_size).toBe(20)
  })
})

describe('toCreateApplicationWireBody', () => {
  it('always includes required purpose and serverId', () => {
    const body = toCreateApplicationWireBody({
      server_id: 'gpu-001',
      purpose: '  Fine-tune model  ',
      requested_days: 7,
      requested_start_at: '2026-04-22T00:00:00Z',
    })

    expect(body).toEqual({
      serverId: 'gpu-001',
      purpose: 'Fine-tune model',
      requestedDays: 7,
      requestedStartAt: '2026-04-22T00:00:00Z',
    })
  })

  it('includes sshPassword when provided', () => {
    const body = toCreateApplicationWireBody({
      server_id: 'gpu-001',
      purpose: 'Job',
      ssh_password: 'longpassword',
      requested_days: 1,
      requested_start_at: '2026-04-22T00:00:00Z',
    })

    expect(body.sshPassword).toBe('longpassword')
  })
})
