/**
 * OpenAPI envelope aliases. Wire types match [api.md](./api.md) and [openapi/openapi.json](./openapi/openapi.json).
 */
import type { components } from '@/types/api.generated'

export type AuthResponseEnvelope = components['schemas']['AuthResponseEnvelope']
export type ServerListEnvelope = components['schemas']['ServerListEnvelope']
export type ApplicationResponseEnvelope = components['schemas']['ApplicationResponseEnvelope']
export type PageResultApplicationEnvelope = components['schemas']['PageResultApplicationEnvelope']

export type LoginRequest = components['schemas']['LoginRequest']
export type RegisterRequest = components['schemas']['RegisterRequest']
export type AuthResponse = components['schemas']['AuthResponse']
export type ApplicationVO = components['schemas']['ApplicationVO']
export type ServerVO = components['schemas']['ServerVO']
export type CreateApplicationRequest = components['schemas']['CreateApplicationRequest']
