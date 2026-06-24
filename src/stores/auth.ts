import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { http } from '@/api/http'
import type { LoginRequest } from '@/types/apiEnvelope'

type SessionResponse = {
  email: string
  roles: string[]
}

type SessionEnvelope = {
  data?: SessionResponse
  code?: string
}

function normalizeSession(envelope: SessionEnvelope): SessionResponse {
  const inner = envelope.data
  if (!inner?.email) throw new Error('Invalid session response')
  return {
    email: inner.email,
    roles: Array.isArray(inner.roles)
      ? inner.roles.filter((x): x is string => typeof x === 'string')
      : [],
  }
}

export const useAuthStore = defineStore('auth', () => {
  const email = ref<string | null>(null)
  const roles = ref<string[]>([])
  const sessionReady = ref(false)

  const isAuthenticated = computed(() => sessionReady.value && email.value !== null)

  /** UI-only; backend enforces admin on /api/admin/**. */
  const isAdmin = computed(() => roles.value.includes('admin'))

  function applySession(nextEmail: string, nextRoles: string[]) {
    email.value = nextEmail.trim()
    roles.value = nextRoles
    sessionReady.value = true
  }

  async function hydrate() {
    try {
      const { data } = await http.get<SessionEnvelope>('/api/auth/me')
      const session = normalizeSession(data)
      applySession(session.email, session.roles)
    } catch {
      clearSession()
    }
  }

  async function loginWithPassword(rawEmail: string, password: string) {
    const body: LoginRequest = { email: rawEmail.trim(), password }
    const { data } = await http.post<SessionEnvelope>('/api/auth/login', body)
    const session = normalizeSession(data)
    applySession(session.email, session.roles)
  }

  function clearSession() {
    email.value = null
    roles.value = []
    sessionReady.value = false
  }

  async function logout() {
    try {
      await http.post('/api/auth/logout')
    } finally {
      clearSession()
    }
  }

  void hydrate()

  return {
    email,
    roles,
    isAuthenticated,
    isAdmin,
    hydrate,
    applySession,
    clearSession,
    logout,
    loginWithPassword,
  }
})
