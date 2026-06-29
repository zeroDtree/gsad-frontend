import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized } from 'vue-router'

import { safeInternalRedirect } from '@/lib/redirect'
import { useAuthStore } from '@/stores/auth'

function guestRedirectTarget(to: RouteLocationNormalized): string {
  const q = to.query.redirect
  return safeInternalRedirect(q) ?? '/board'
}

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', redirect: '/board' },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { authPage: true, guestOnly: true, nav: 'login' },
    },
    {
      path: '/board',
      name: 'board',
      component: () => import('@/views/BoardView.vue'),
      meta: { nav: 'board', requiresAuth: true },
    },
    {
      path: '/applications/new',
      name: 'applications-new',
      component: () => import('@/views/NewApplicationView.vue'),
      meta: { nav: 'apply', requiresAuth: true },
    },
    {
      path: '/applications/mine',
      name: 'applications-mine',
      component: () => import('@/views/MyApplicationsView.vue'),
      meta: { nav: 'mine', requiresAuth: true },
    },
    {
      path: '/account/password',
      name: 'account-password',
      component: () => import('@/views/account/ChangePasswordView.vue'),
      meta: { nav: 'account-password', requiresAuth: true },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/views/admin/AdminUserListView.vue'),
      meta: { nav: 'admin-users', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/users/import',
      name: 'admin-users-import',
      component: () => import('@/views/admin/AdminUserImportView.vue'),
      meta: { nav: 'admin-import', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/servers/import',
      name: 'admin-servers-import',
      component: () => import('@/views/admin/AdminServerImportView.vue'),
      meta: { nav: 'admin-servers-import', requiresAuth: true, requiresAdmin: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/board' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.ensureSession()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { path: '/board' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return guestRedirectTarget(to)
  }

  return true
})
