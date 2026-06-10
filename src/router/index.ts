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
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { authPage: true, guestOnly: true },
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
    { path: '/:pathMatch(.*)*', redirect: '/board' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return guestRedirectTarget(to)
  }

  return true
})
