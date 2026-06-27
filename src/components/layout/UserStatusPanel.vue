<script setup lang="ts">
import { KeyRound, LogOut, UserRound } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'

import { useLocale } from '@/composables/useLocale'
import { useAuthStore } from '@/stores/auth'
import type { AppLocale } from '@/i18n'

const { t } = useI18n()
const { currentLocale, setLocale } = useLocale()
const auth = useAuthStore()
const router = useRouter()

async function logout() {
  await auth.logout()
  void router.push('/login')
}

function onLocaleChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as AppLocale
  setLocale(value)
}
</script>

<template>
  <div class="border-t border-slate-200 p-3">
    <div
      class="flex items-center gap-3 rounded-lg border border-transparent px-1 py-1 transition hover:border-slate-200"
    >
      <div
        class="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-zinc-50 text-slate-500"
      >
        <UserRound class="size-4" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-xs font-medium text-slate-900">
          {{ auth.email ?? t('auth.guest') }}
        </p>
        <p class="truncate text-[11px] text-slate-500">
          {{ auth.isAuthenticated ? t('auth.loggedIn') : t('auth.notLoggedIn') }}
        </p>
      </div>
    </div>

    <label class="mt-2 block">
      <span class="sr-only">{{ t('locale.label') }}</span>
      <select
        :value="currentLocale"
        class="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 outline-none ring-slate-300 transition focus:ring-2"
        @change="onLocaleChange"
      >
        <option value="zh-CN">{{ t('locale.zhCN') }}</option>
        <option value="en">{{ t('locale.en') }}</option>
      </select>
    </label>

    <RouterLink
      v-if="auth.isAuthenticated"
      to="/account/password"
      class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-zinc-50"
    >
      <KeyRound class="size-3.5 opacity-70" />
      {{ t('auth.changePassword') }}
    </RouterLink>

    <button
      v-if="auth.isAuthenticated"
      type="button"
      class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-zinc-50"
      @click="logout"
    >
      <LogOut class="size-3.5 opacity-70" />
      {{ t('auth.logout') }}
    </button>
  </div>
</template>
