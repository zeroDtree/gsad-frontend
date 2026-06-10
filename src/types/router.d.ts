import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    nav?: 'board' | 'apply' | 'mine' | 'login'
    requiresAuth?: boolean
    /** Full-width auth pages without app sidebar */
    authPage?: boolean
    guestOnly?: boolean
    placeholderTitle?: string
    placeholderHint?: string
  }
}
