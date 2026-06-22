import { http } from '@/api/http'
import type { UserImportResponse, UserImportResponseEnvelope } from '@/types/apiEnvelope'

export async function importUsersCsv(file: File): Promise<UserImportResponse> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await http.post<UserImportResponseEnvelope>('/api/admin/users/import', form)
  if (!data.data) throw new Error('Invalid import response')
  return data.data
}
