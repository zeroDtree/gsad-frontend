/**
 * OpenAPI envelope aliases. Wire types match [api.md](./api.md) and [openapi/openapi.json](./openapi/openapi.json).
 */
import type { components } from '@/types/api.generated'

export type AuthResponseEnvelope = components['schemas']['SessionResponseEnvelope']
export type ServerListEnvelope = components['schemas']['ServerListEnvelope']
export type ApplicationResponseEnvelope = components['schemas']['ApplicationResponseEnvelope']
export type PageResultApplicationEnvelope = components['schemas']['PageResultApplicationEnvelope']

export type LoginRequest = components['schemas']['LoginRequest']
export type ChangePasswordRequest = components['schemas']['ChangePasswordRequest']
export type ResetUserPasswordRequest = components['schemas']['ResetUserPasswordRequest']
export type SessionResponse = components['schemas']['SessionResponse']
export type SessionResponseEnvelope = components['schemas']['SessionResponseEnvelope']
export type ApplicationVO = components['schemas']['ApplicationVO']
export type ServerVO = components['schemas']['ServerVO']
export type CreateApplicationRequest = components['schemas']['CreateApplicationRequest']
export type UserImportResponse = components['schemas']['UserImportResponse']
export type UserImportResponseEnvelope = components['schemas']['UserImportResponseEnvelope']
export type ServerImportResponse = components['schemas']['ServerImportResponse']
export type ServerImportResponseEnvelope = components['schemas']['ServerImportResponseEnvelope']
export type AdminUserVO = components['schemas']['AdminUserVO']
export type AdminUserEnvelope = components['schemas']['AdminUserEnvelope']
export type UpdateAdminUserRequest = components['schemas']['UpdateAdminUserRequest']
export type PageResultAdminUser = components['schemas']['PageResultAdminUser']
export type PageResultAdminUserEnvelope = components['schemas']['PageResultAdminUserEnvelope']
export type DeleteAdminUserResponse = components['schemas']['DeleteAdminUserResponse']
export type DeleteAdminUserResponseEnvelope =
  components['schemas']['DeleteAdminUserResponseEnvelope']
export type BulkUserActionRequest = components['schemas']['BulkUserActionRequest']
export type BulkDeleteUsersRequest = components['schemas']['BulkDeleteUsersRequest']
export type BulkUserError = components['schemas']['BulkUserError']
export type BulkDisableUsersResponse = components['schemas']['BulkDisableUsersResponse']
export type BulkDisableUsersResponseEnvelope =
  components['schemas']['BulkDisableUsersResponseEnvelope']
export type BulkEnableUsersResponse = components['schemas']['BulkEnableUsersResponse']
export type BulkEnableUsersResponseEnvelope =
  components['schemas']['BulkEnableUsersResponseEnvelope']
export type BulkDeleteUsersResponse = components['schemas']['BulkDeleteUsersResponse']
export type BulkDeleteUsersResponseEnvelope =
  components['schemas']['BulkDeleteUsersResponseEnvelope']
export type UserStatus = components['schemas']['UserStatus']
