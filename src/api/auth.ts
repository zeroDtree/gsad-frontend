import { http } from '@/api/http'
import type { ChangePasswordRequest, SessionResponseEnvelope } from '@/types/apiEnvelope'

export async function changePassword(body: ChangePasswordRequest) {
  const { data } = await http.post<SessionResponseEnvelope>('/api/auth/change-password', body)
  if (!data.data?.email) throw new Error('Invalid change password response')
  return data.data
}
