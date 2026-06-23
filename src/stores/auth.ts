import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { http } from '@/api/http'
import type { AuthResponse, AuthResponseEnvelope, LoginRequest } from '@/types/apiEnvelope'

const TOKEN_KEY = 'GSAD_TOKEN'

function normalizeAuthResponse(envelope: AuthResponseEnvelope): AuthResponse {
  const inner = envelope.data
  if (!inner?.token) throw new Error('Invalid auth response')
  return {
    token: inner.token,
    email: inner.email ?? '',
    roles: Array.isArray(inner.roles)
      ? inner.roles.filter((x): x is string => typeof x === 'string')
      : [],
  }
}

/**
 * Decode the base64url-encoded payload of a JWT.
 * Does NOT verify the signature (frontend can't; that's the backend's job).
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64)) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Derive the display email and UI roles from the stored token,
 * so we never trust opaque localStorage fields for access control.
 *
 * Email from `email` / `sub` claim; roles from `roles` claim.
 * The backend is the authoritative guard; these values are
 * UI-only (sidebar visibility, client-side route guard).
 */
function parseSessionFromToken(token: string): { email: string; roles: string[] } | null {
  const payload = decodeJwtPayload(token)
  if (!payload) return null

  const email =
    typeof payload.email === 'string'
      ? payload.email
      : typeof payload.sub === 'string'
        ? payload.sub
        : ''

  const roles = Array.isArray(payload.roles)
    ? (payload.roles as unknown[]).filter((r): r is string => typeof r === 'string')
    : []

  return { email, roles }
}

export const useAuthStore = defineStore('auth', () => {
  const email = ref<string | null>(null)
  const roles = ref<string[]>([])
  const token = ref<string | null>(null)

  /** Authenticated iff a token is present — email alone is not sufficient. */
  const isAuthenticated = computed(() => Boolean(token.value))

  /** UI-only; backend enforces admin on /api/admin/**. */
  const isAdmin = computed(() => roles.value.includes('admin'))

  function hydrate() {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) return

    const session = parseSessionFromToken(storedToken)
    if (!session) {
      // Unrecognisable token — discard to avoid a broken state
      localStorage.removeItem(TOKEN_KEY)
      return
    }

    token.value = storedToken
    email.value = session.email
    roles.value = session.roles
  }

  function persistSession(nextEmail: string, nextToken: string, nextRoles: string[]) {
    token.value = nextToken
    email.value = nextEmail.trim()
    roles.value = nextRoles
    localStorage.setItem(TOKEN_KEY, nextToken)
  }

  async function loginWithPassword(rawEmail: string, password: string) {
    const body: LoginRequest = { email: rawEmail.trim(), password }
    const { data } = await http.post<AuthResponseEnvelope>('/api/auth/login', body)
    const auth = normalizeAuthResponse(data)
    persistSession(auth.email, auth.token, auth.roles)
  }

  function clearSession() {
    token.value = null
    email.value = null
    roles.value = []
    localStorage.removeItem(TOKEN_KEY)
  }

  hydrate()

  return {
    email,
    roles,
    token,
    isAuthenticated,
    isAdmin,
    hydrate,
    clearSession,
    loginWithPassword,
  }
})
