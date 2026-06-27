<script setup lang="ts">
import { FilePlus2, LayoutGrid, Layers, LogIn, Server, Upload, Users } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

import UserStatusPanel from '@/components/layout/UserStatusPanel.vue'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()

const mainNav = computed(() => [
  { to: '/board', labelKey: 'nav.board', nav: 'board' as const, icon: LayoutGrid },
  { to: '/applications/new', labelKey: 'nav.newApplication', nav: 'apply' as const, icon: FilePlus2 },
  { to: '/applications/mine', labelKey: 'nav.myApplications', nav: 'mine' as const, icon: Layers },
])

const adminNav = computed(() =>
  auth.isAdmin
    ? [
        { to: '/admin/users', labelKey: 'nav.adminUsers', nav: 'admin-users' as const, icon: Users },
        {
          to: '/admin/users/import',
          labelKey: 'nav.adminUserImport',
          nav: 'admin-import' as const,
          icon: Upload,
        },
        {
          to: '/admin/servers/import',
          labelKey: 'nav.adminServerImport',
          nav: 'admin-servers-import' as const,
          icon: Server,
        },
      ]
    : [],
)

function linkClass(nav: string) {
  const active = route.meta.nav === nav
  return [
    'group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition',
    active
      ? 'bg-zinc-100 font-medium text-slate-900 ring-1 ring-slate-200'
      : 'text-slate-600 hover:bg-zinc-50 hover:text-slate-900',
  ]
}
</script>

<template>
  <aside
    class="sticky top-0 flex h-svh w-56 shrink-0 flex-col border-r border-slate-200 bg-zinc-50/80 backdrop-blur-sm"
  >
    <div class="shrink-0 px-4 pb-2 pt-5">
      <p
        class="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
        title="GPU Server Access Dashboard"
      >
        GSAD
      </p>
      <p class="mt-0.5 text-sm font-semibold tracking-tight text-slate-900">
        {{ t('nav.consoleTitle') }}
      </p>
    </div>

    <nav
      class="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-4 pt-2"
      :aria-label="t('nav.main')"
    >
      <RouterLink v-if="!auth.isAuthenticated" to="/login" :class="linkClass('login')">
        <LogIn
          class="size-4 shrink-0 text-slate-400 transition group-hover:text-slate-600"
          :class="route.meta.nav === 'login' ? '!text-slate-700' : ''"
        />
        {{ t('nav.login') }}
      </RouterLink>
      <RouterLink v-for="item in mainNav" :key="item.to" :to="item.to" :class="linkClass(item.nav)">
        <component
          :is="item.icon"
          class="size-4 shrink-0 text-slate-400 transition group-hover:text-slate-600"
          :class="route.meta.nav === item.nav ? '!text-slate-700' : ''"
        />
        {{ t(item.labelKey) }}
      </RouterLink>

      <template v-if="adminNav.length > 0">
        <p
          class="mb-1 mt-4 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
        >
          {{ t('nav.admin') }}
        </p>
        <RouterLink
          v-for="item in adminNav"
          :key="item.to"
          :to="item.to"
          :class="linkClass(item.nav)"
        >
          <component
            :is="item.icon"
            class="size-4 shrink-0 text-slate-400 transition group-hover:text-slate-600"
            :class="route.meta.nav === item.nav ? '!text-slate-700' : ''"
          />
          {{ t(item.labelKey) }}
        </RouterLink>
      </template>
    </nav>

    <UserStatusPanel />
  </aside>
</template>
