<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { useLocale } from '@/composables/useLocale'
import type { AppLocale } from '@/i18n'

const { t } = useI18n()
const { currentLocale, setLocale } = useLocale()

function onLocaleChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as AppLocale
  setLocale(value)
}
</script>

<template>
  <label class="fixed right-3 top-3 z-40">
    <span class="sr-only">{{ t('locale.label') }}</span>
    <select
      :value="currentLocale"
      class="h-8 rounded-md border border-slate-200 bg-white/95 px-2 text-[11px] font-medium text-slate-700 shadow-sm outline-none ring-slate-300 backdrop-blur-sm transition focus:ring-2"
      @change="onLocaleChange"
    >
      <option value="zh-CN">{{ t('locale.zhCN') }}</option>
      <option value="en">{{ t('locale.en') }}</option>
    </select>
  </label>
</template>
