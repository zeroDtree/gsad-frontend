import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    nav?: 'board' | 'apply' | 'mine' | 'login' | 'admin-users' | 'admin-import'
    requiresAuth?: boolean
    requiresAdmin?: boolean
    /** Full-width auth pages without app sidebar */
    authPage?: boolean
    guestOnly?: boolean
  }
}
