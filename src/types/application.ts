/** Application lifecycle after submit (no manual approval) */
export type AuditStatus =
  | 'APPROVED'
  | 'ACTIVE'
  | 'REVOKING'
  | 'REVOKED'
  | 'CANCELLED'
  | 'FAILED_GRANT'
  | 'FAILED_REVOKE'

export interface ApplicationItem {
  id: string
  /** Optional; same user in "mine" list */
  user_email?: string
  /** Target GPU server id (binds application to one machine). */
  server_id: string
  audit_status: AuditStatus
  /** Optional system or operator note */
  comment?: string | null
  updated_at: string
  /** SSH-reachable address when grant is active */
  server_ip?: string
  ssh_username?: string
  /** May be omitted on later list polls after first delivery */
  initial_password?: string
  /** Whether Miniconda was requested at submit time */
  install_miniconda?: boolean
}

/** UI/form payload for POST /api/applications (mapped to CreateApplicationRequest on the wire). */
export interface CreateApplicationPayload {
  server_id: string
  ssh_password?: string
  install_miniconda?: boolean
}

export interface ApplicationListParams {
  status?: AuditStatus | 'all'
  page?: number
  page_size?: number
}

export interface ApplicationListResult {
  items: ApplicationItem[]
  total: number
  page: number
  page_size: number
}
