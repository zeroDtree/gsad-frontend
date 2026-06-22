<script setup lang="ts">
import { FilePlus2, LayoutGrid, Layers, LogIn, Upload } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import UserStatusPanel from '@/components/layout/UserStatusPanel.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const mainNav = [
  { to: '/board', label: '资源看板', nav: 'board' as const, icon: LayoutGrid },
  { to: '/applications/new', label: '新建申请', nav: 'apply' as const, icon: FilePlus2 },
  { to: '/applications/mine', label: '我的申请', nav: 'mine' as const, icon: Layers },
]

const adminNav = computed(() =>
  auth.isAdmin
    ? [{ to: '/admin/users/import', label: '用户导入', nav: 'admin-import' as const, icon: Upload }]
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
      <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400" title="GPU Server Access Dashboard">GSAD</p>
      <p class="mt-0.5 text-sm font-semibold tracking-tight text-slate-900">资源控制台</p>
    </div>

    <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-4 pt-2" aria-label="主导航">
      <RouterLink v-if="!auth.isAuthenticated" to="/login" :class="linkClass('login')">
        <LogIn
          class="size-4 shrink-0 text-slate-400 transition group-hover:text-slate-600"
          :class="route.meta.nav === 'login' ? '!text-slate-700' : ''"
        />
        登录
      </RouterLink>
      <RouterLink v-for="item in mainNav" :key="item.to" :to="item.to" :class="linkClass(item.nav)">
        <component
          :is="item.icon"
          class="size-4 shrink-0 text-slate-400 transition group-hover:text-slate-600"
          :class="route.meta.nav === item.nav ? '!text-slate-700' : ''"
        />
        {{ item.label }}
      </RouterLink>

      <template v-if="adminNav.length > 0">
        <p class="mb-1 mt-4 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          管理
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
          {{ item.label }}
        </RouterLink>
      </template>
    </nav>

    <UserStatusPanel />
  </aside>
</template>
