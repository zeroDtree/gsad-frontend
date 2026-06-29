import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { http } from '@/api/http'
import { useAuthStore } from '@/stores/auth'

describe('useAuthStore ensureSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(http.get).mockReset()
    vi.mocked(http.post).mockReset()
  })

  it('restores session when /api/auth/me succeeds', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: { data: { email: 'u@example.com', roles: ['admin'] } },
    } as never)

    const auth = useAuthStore()
    await auth.ensureSession()

    expect(auth.sessionReady).toBe(true)
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.email).toBe('u@example.com')
    expect(auth.isAdmin).toBe(true)
    expect(http.get).toHaveBeenCalledWith('/api/auth/me', { skipAuthRedirect: true })
  })

  it('marks guest when /api/auth/me fails', async () => {
    vi.mocked(http.get).mockRejectedValue(new Error('401'))

    const auth = useAuthStore()
    await auth.ensureSession()

    expect(auth.sessionReady).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.email).toBeNull()
  })

  it('ensureSession is idempotent', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: { data: { email: 'u@example.com', roles: [] } },
    } as never)

    const auth = useAuthStore()
    await auth.ensureSession()
    await auth.ensureSession()

    expect(http.get).toHaveBeenCalledTimes(1)
  })

  it('login invalidates an in-flight session probe', async () => {
    let resolveGet: (value: unknown) => void = () => {}
    vi.mocked(http.get).mockReturnValue(
      new Promise((resolve) => {
        resolveGet = resolve
      }) as never,
    )
    vi.mocked(http.post).mockResolvedValue({
      data: { data: { email: 'u@example.com', roles: [] } },
    } as never)

    const auth = useAuthStore()
    const sessionTask = auth.ensureSession()
    await auth.loginWithPassword('u@example.com', 'secret')
    resolveGet({ data: { code: 'UNAUTHORIZED' } })
    await sessionTask

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.email).toBe('u@example.com')
  })
})
