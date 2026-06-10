/** Avoid open redirects: only accept same-origin relative paths. */
export function safeInternalRedirect(path: unknown): string | null {
  if (typeof path !== 'string' || !path.startsWith('/')) return null
  if (path.startsWith('//')) return null
  try {
    const u = new URL(path, 'http://local.invalid')
    if (u.origin !== 'http://local.invalid') return null
    return u.pathname + u.search + u.hash
  } catch {
    return null
  }
}
