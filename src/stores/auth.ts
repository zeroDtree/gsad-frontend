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

  let sessionPromise: Promise<void> | null = null
  let loadGeneration = 0

  const isAuthenticated = computed(() => sessionReady.value && email.value !== null)

  /** UI-only; backend enforces admin on /api/admin/**. */
  const isAdmin = computed(() => roles.value.includes('admin'))

  function applySession(nextEmail: string, nextRoles: string[]) {
    email.value = nextEmail.trim()
    roles.value = nextRoles
    sessionReady.value = true
  }

  function clearSession() {
    email.value = null
    roles.value = []
  }

  async function loadSession() {
    const generation = ++loadGeneration
    try {
      const { data } = await http.get<SessionEnvelope>('/api/auth/me', {
        skipAuthRedirect: true,
      })
      if (generation !== loadGeneration) return
      const session = normalizeSession(data)
      applySession(session.email, session.roles)
    } catch {
      if (generation !== loadGeneration) return
      clearSession()
    } finally {
      if (generation === loadGeneration) {
        sessionReady.value = true
      }
    }
  }

  async function ensureSession(): Promise<void> {
    sessionPromise ??= loadSession()
    await sessionPromise
  }

  async function loginWithPassword(rawEmail: string, password: string) {
    const body: LoginRequest = { email: rawEmail.trim(), password }
    const { data } = await http.post<SessionEnvelope>('/api/auth/login', body)
    loadGeneration++
    const session = normalizeSession(data)
    applySession(session.email, session.roles)
    sessionPromise = Promise.resolve()
  }

  async function logout() {
    try {
      await http.post('/api/auth/logout')
    } finally {
      loadGeneration++
      clearSession()
      sessionReady.value = true
      sessionPromise = Promise.resolve()
    }
  }

  return {
    email,
    roles,
    sessionReady,
    isAuthenticated,
    isAdmin,
    ensureSession,
    applySession,
    clearSession,
    logout,
    loginWithPassword,
  }
})
