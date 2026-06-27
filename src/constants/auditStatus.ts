import type { AuditStatus } from '@/types/application'

/** Tailwind color token names — resolved to real classes in AuditStatusBadge */
type StatusMeta = {
  labelKey: string
  color: 'blue' | 'cyan' | 'success' | 'gray' | 'error' | 'warning'
  icon: string
}

export const AUDIT_STATUS_MAP: Record<AuditStatus, StatusMeta> = {
  APPROVED: { labelKey: 'auditStatus.APPROVED', color: 'cyan', icon: 'Zap' },
  ACTIVE: { labelKey: 'auditStatus.ACTIVE', color: 'success', icon: 'CheckCircle' },
  REVOKING: { labelKey: 'auditStatus.REVOKING', color: 'blue', icon: 'Clock' },
  REVOKED: { labelKey: 'auditStatus.REVOKED', color: 'gray', icon: 'CheckCircle' },
  CANCELLED: { labelKey: 'auditStatus.CANCELLED', color: 'gray', icon: 'XCircle' },
  FAILED_GRANT: { labelKey: 'auditStatus.FAILED_GRANT', color: 'error', icon: 'XCircle' },
  FAILED_REVOKE: { labelKey: 'auditStatus.FAILED_REVOKE', color: 'warning', icon: 'AlertTriangle' },
}

export const STATUS_COLOR_CLASS: Record<StatusMeta['color'], string> = {
  blue: 'bg-blue-50 text-blue-800 ring-blue-200/70',
  cyan: 'bg-cyan-50 text-cyan-900 ring-cyan-200/70',
  success: 'bg-emerald-50 text-emerald-900 ring-emerald-200/70',
  gray: 'bg-slate-100 text-slate-700 ring-slate-200/70',
  error: 'bg-red-50 text-red-800 ring-red-200/70',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200/70',
}
