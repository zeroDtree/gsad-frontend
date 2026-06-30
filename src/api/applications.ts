import { http } from '@/api/http'
import type {
  ApplicationItem,
  ApplicationListParams,
  ApplicationListResult,
  AuditStatus,
  CreateApplicationPayload,
} from '@/types/application'
import type {
  ApplicationResponseEnvelope,
  ApplicationVO,
  CreateApplicationRequest,
  PageResultApplicationEnvelope,
} from '@/types/apiEnvelope'

function readStr(raw: Record<string, unknown>, key: string): string {
  const v = raw[key]
  return typeof v === 'string' ? v : ''
}

function readServerId(raw: Record<string, unknown>): string {
  const v = raw.serverId
  if (typeof v === 'string' && v.trim()) return v
  return ''
}

const VALID_AUDIT_STATUSES = new Set<AuditStatus>([
  'APPROVED',
  'ACTIVE',
  'REVOKING',
  'REVOKED',
  'CANCELLED',
  'FAILED_GRANT',
  'FAILED_REVOKE',
])

function parseAuditStatus(raw: Record<string, unknown>): AuditStatus | null {
  const audit = readStr(raw, 'auditStatus')
  if (!audit || !VALID_AUDIT_STATUSES.has(audit as AuditStatus)) return null
  return audit as AuditStatus
}

/** Normalize gsad camelCase ApplicationVO into internal ApplicationItem. */
export function toApplicationItem(vo: ApplicationVO): ApplicationItem | null {
  const raw = vo as Record<string, unknown>
  const audit_status = parseAuditStatus(raw)
  if (!audit_status) return null
  return {
    id: String(raw.id ?? ''),
    user_email: readStr(raw, 'userEmail') || undefined,
    server_id: readServerId(raw),
    audit_status,
    comment: ((): string | null | undefined => {
      if (raw.comment === null) return null
      const c = readStr(raw, 'comment')
      return c === '' ? undefined : c
    })(),
    updated_at: readStr(raw, 'updatedAt'),
    server_ip: readStr(raw, 'serverIp') || undefined,
    ssh_username: readStr(raw, 'sshUsername') || undefined,
    initial_password: readStr(raw, 'initialPassword') || undefined,
    install_miniconda:
      typeof raw.installMiniconda === 'boolean' ? raw.installMiniconda : undefined,
  }
}

/** Request body for POST /api/applications (Jackson camelCase). */
export function toCreateApplicationWireBody(
  payload: CreateApplicationPayload,
): CreateApplicationRequest {
  const body: CreateApplicationRequest = {
    serverId: payload.server_id,
  }
  const sshPassword = payload.ssh_password?.trim()
  if (sshPassword) body.sshPassword = sshPassword
  if (payload.install_miniconda === true) body.installMiniconda = true
  return body
}

/** Parse paginated list envelope from gsad. */
export function normalizeApplicationListResult(
  envelope: PageResultApplicationEnvelope,
): ApplicationListResult {
  const data = envelope.data
  const items = (data?.items ?? [])
    .map(toApplicationItem)
    .filter((item): item is ApplicationItem => item !== null)
  const total = data?.total ?? 0
  const page = data?.page ?? 1
  const page_size = data?.pageSize ?? 20
  return { items, total, page, page_size }
}

function normalizeApplication(envelope: ApplicationResponseEnvelope): ApplicationItem {
  if (!envelope.data) throw new Error('Invalid application response')
  const item = toApplicationItem(envelope.data)
  if (!item) throw new Error('Invalid application response')
  return item
}

/**
 * POST /api/applications — doc §6.2
 * Caller provides a stable idempotencyKey (UUID) to prevent duplicate submissions.
 */
export async function createApplication(
  payload: CreateApplicationPayload,
  idempotencyKey: string,
): Promise<ApplicationItem> {
  const { data } = await http.post<ApplicationResponseEnvelope>(
    '/api/applications',
    toCreateApplicationWireBody(payload),
    {
      headers: { 'Idempotency-Key': idempotencyKey },
    },
  )
  return normalizeApplication(data)
}

/**
 * DELETE /api/applications/{id} — revoke or cancel my application.
 */
export async function revokeApplication(id: string): Promise<ApplicationItem> {
  const { data } = await http.delete<ApplicationResponseEnvelope>(`/api/applications/${id}`)
  return normalizeApplication(data)
}

/**
 * GET /api/applications/mine — doc §6.4
 */
export async function getMyApplications(
  params?: ApplicationListParams,
): Promise<ApplicationListResult> {
  const query: Record<string, string | number> = {}
  if (params?.status && params.status !== 'all') query.status = params.status
  if (params?.page) query.page = params.page
  if (params?.page_size) query.page_size = params.page_size

  const { data } = await http.get<PageResultApplicationEnvelope>('/api/applications/mine', {
    params: query,
  })
  return normalizeApplicationListResult(data)
}
