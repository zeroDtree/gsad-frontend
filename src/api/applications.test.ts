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
      updatedAt: '2026-04-22T00:00:00Z',
    } as unknown as ApplicationVO)

    expect(item).toBeNull()
  })

  it('returns null for invalid auditStatus', () => {
    const item = toApplicationItem({
      id: 'app-xyz',
      serverId: 'srv-1',
      auditStatus: 'EXPIRED',
      updatedAt: '2026-04-22T00:00:00Z',
    } as unknown as ApplicationVO)

    expect(item).toBeNull()
  })

  it('accepts REVOKING and REVOKED statuses', () => {
    expect(
      toApplicationItem({
        id: 'app-1',
        serverId: 'srv-1',
        auditStatus: 'REVOKING',
        updatedAt: '2026-04-22T00:00:00Z',
      } as unknown as ApplicationVO)?.audit_status,
    ).toBe('REVOKING')
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
  it('includes only serverId by default', () => {
    const body = toCreateApplicationWireBody({
      server_id: 'gpu-001',
    })

    expect(body).toEqual({
      serverId: 'gpu-001',
    })
  })

  it('includes sshPassword when provided', () => {
    const body = toCreateApplicationWireBody({
      server_id: 'gpu-001',
      ssh_password: 'longpassword',
    })

    expect(body.sshPassword).toBe('longpassword')
  })

  it('includes installMiniconda when true', () => {
    const body = toCreateApplicationWireBody({
      server_id: 'gpu-001',
      install_miniconda: true,
    })

    expect(body.installMiniconda).toBe(true)
  })

  it('omits installMiniconda when false or unset', () => {
    expect(
      toCreateApplicationWireBody({
        server_id: 'gpu-001',
      }).installMiniconda,
    ).toBeUndefined()
    expect(
      toCreateApplicationWireBody({
        server_id: 'gpu-001',
        install_miniconda: false,
      }).installMiniconda,
    ).toBeUndefined()
  })
})
