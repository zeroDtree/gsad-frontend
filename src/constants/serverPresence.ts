import type { ServerStatus } from '@/types/public'

export const SERVER_STATUS_LABEL_KEY: Record<ServerStatus, string> = {
  ONLINE: 'serverStatus.ONLINE',
  OFFLINE: 'serverStatus.OFFLINE',
  MAINTENANCE: 'serverStatus.MAINTENANCE',
}

/** Tailwind palette tokens for presence dots (not application state colors). */
export const SERVER_STATUS_DOT_CLASS: Record<ServerStatus, string> = {
  ONLINE: 'bg-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]',
  OFFLINE: 'bg-slate-400',
  MAINTENANCE: 'bg-amber-500',
}
