import { AxiosError } from 'axios'

import { http } from '@/api/http'
import type {
  AdminUserEnvelope,
  AdminUserVO,
  BulkDeleteUsersRequest,
  BulkDeleteUsersResponse,
  BulkDeleteUsersResponseEnvelope,
  BulkDisableUsersResponse,
  BulkDisableUsersResponseEnvelope,
  BulkEnableUsersResponse,
  BulkEnableUsersResponseEnvelope,
  BulkUserActionRequest,
  DeleteAdminUserResponse,
  DeleteAdminUserResponseEnvelope,
  PageResultAdminUser,
  PageResultAdminUserEnvelope,
  UpdateAdminUserRequest,
  UserImportResponse,
  UserImportResponseEnvelope,
} from '@/types/apiEnvelope'

export type ListAdminUsersParams = {
  cohort?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'all'
  role?: 'admin' | 'user' | 'all'
  page?: number
  page_size?: number
}

export async function listAdminUsers(
  params: ListAdminUsersParams = {},
): Promise<PageResultAdminUser> {
  const { data } = await http.get<PageResultAdminUserEnvelope>('/api/admin/users', { params })
  if (!data.data) throw new Error('Invalid list response')
  return data.data
}

export async function updateAdminUser(
  id: number,
  body: UpdateAdminUserRequest,
): Promise<AdminUserVO> {
  const { data } = await http.patch<AdminUserEnvelope>(`/api/admin/users/${id}`, body)
  if (!data.data) throw new Error('Invalid update response')
  return data.data
}

export type DeleteAdminUserResult =
  | { deleted: true }
  | { deleted: false; pendingRevokes: number; message: string }

export async function deleteAdminUser(
  id: number,
  revokeSsh: boolean,
): Promise<DeleteAdminUserResult> {
  try {
    await http.delete(`/api/admin/users/${id}`, { params: { revokeSsh } })
    return { deleted: true }
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 409) {
      const body = err.response.data as DeleteAdminUserResponseEnvelope | undefined
      const payload = body?.data as DeleteAdminUserResponse | undefined
      return {
        deleted: false,
        pendingRevokes: payload?.pendingRevokes ?? 0,
        message: payload?.message ?? body?.message ?? 'Revoke in progress',
      }
    }
    throw err
  }
}

export async function bulkDisableUsers(
  body: BulkUserActionRequest,
): Promise<BulkDisableUsersResponse> {
  const { data } = await http.post<BulkDisableUsersResponseEnvelope>(
    '/api/admin/users/bulk-disable',
    body,
  )
  if (!data.data) throw new Error('Invalid bulk disable response')
  return data.data
}

export async function bulkEnableUsers(
  body: BulkUserActionRequest,
): Promise<BulkEnableUsersResponse> {
  const { data } = await http.post<BulkEnableUsersResponseEnvelope>(
    '/api/admin/users/bulk-enable',
    body,
  )
  if (!data.data) throw new Error('Invalid bulk enable response')
  return data.data
}

export async function bulkDeleteUsers(
  body: BulkDeleteUsersRequest,
): Promise<BulkDeleteUsersResponse> {
  const { data } = await http.post<BulkDeleteUsersResponseEnvelope>(
    '/api/admin/users/bulk-delete',
    body,
  )
  if (!data.data) throw new Error('Invalid bulk delete response')
  return data.data
}

export async function importUsersCsv(file: File): Promise<UserImportResponse> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await http.post<UserImportResponseEnvelope>('/api/admin/users/import', form)
  if (!data.data) throw new Error('Invalid import response')
  return data.data
}
